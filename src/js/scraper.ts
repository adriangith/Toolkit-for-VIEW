import { allDataFields, defaultTargetFields, derivationFunctionsRegistry, pageDefinitions } from "./config"; // Assuming these are correctly defined elsewhere
import { DerivedFieldDefinition, TargetFieldSet, AllPagesMap, PageId, OptimiserPageRepresentation, MasterPageDefinition, PathEntry, DataFieldName, DerivationLogicRegistry, ITransformer, TransformerInput, IDataExtractor, PageExtractionTask, ExtractionOutput, IOptimiser, OptimiserInput, OptimiserOutput, MasterFieldDefinition, ScraperConfig, CollectedData, Message, DomSelector, FieldDefinition, SourcedFieldName, DerivationFunction } from "./types"; // Assuming types.ts exists
import { expandPageDefinitionsForOptimiser, getErrorMessage, setStorage, templateSubstitution } from "./utils"; // Assuming utils.ts exists


// --- 2. Transformer Module ---
export class Transformer implements ITransformer {
    constructor() {
        // Constructor remains the same
    }

    /**
     * Derives fields based on the provided input.
     * @param input - The input containing current data, level, master field definitions, explicitly targeted fields, and derivation registry.
     * @returns A promise that resolves to a boolean indicating if any fields were derived.
     */
    public async deriveFields(input: TransformerInput): Promise<boolean> {
        const { level, log } = input;
        let derivedSomethingInAnyPass = false;
        let derivedSomethingThisPass: boolean;
        const maxPasses = 5;
        let currentPass = 0;

        do {
            currentPass++;
            if (currentPass > maxPasses) {
                log(`              WARN (Transformer): Exceeded max derivation passes (${maxPasses}) for level ${level}.`);
                break;
            }

            log(`              INFO (Transformer): Starting derivation pass ${currentPass} for level ${level}.`);

            derivedSomethingThisPass = await this._performDerivationPass(input, currentPass);

            if (derivedSomethingThisPass) {
                derivedSomethingInAnyPass = true;
            }

        } while (derivedSomethingThisPass && currentPass < maxPasses);

        this._logFinalDerivationStatus(log, level, currentPass, maxPasses, derivedSomethingInAnyPass, derivedSomethingThisPass);

        return derivedSomethingInAnyPass;
    }

    /**
     * Checks if a field derivations should occur for the current pass, and if so, attempt to derive the fields.    
     * @param input - The input containing current data, level, master field definitions, explicitly targeted fields, derivation registry, and log function.
     * @param _currentPass - The current pass number.
     * @returns A boolean indicating if any field derivations should occur.
     */
    private async _performDerivationPass(
        input: TransformerInput,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _currentPass: number
    ): Promise<boolean> {
        const {
            currentData,
            level,
            masterFieldDefinitions,
            explicitlyTargetedFields,
            derivationRegistry,
            log
        } = input;
        let derivedInThisPass = false;

        for await (const fieldDef of masterFieldDefinitions) {
            /** Key to use for the derivation registry */
            const keyForRegistry = fieldDef.derivationKey || fieldDef.name;

            // Initial checks to see if we should attempt derivation for this field
            if (fieldDef.isDerived &&
                keyForRegistry &&
                fieldDef.name && // fieldDef.name is crucial for updating currentData and checking explicitlyTargetedFields
                fieldDef.level === level &&
                explicitlyTargetedFields.includes(fieldDef.name) &&
                !Object.prototype.hasOwnProperty.call(currentData, fieldDef.name)) {

                if (await this._tryDeriveSingleField(fieldDef, keyForRegistry, currentData, derivationRegistry, log)) {
                    derivedInThisPass = true;
                }
            }
        }
        return derivedInThisPass;
    }

    /**
     * Attempts to derive a single field based on its definition and the current data.  
     * @param fieldDef - The definition of the field to derive.
     * @param keyForRegistry - The key to use for the derivation registry.  
     * @param currentData - The current data object to update with derived values.  
     * @param derivationRegistry - The registry containing derivation functions.
     * @param log - The logging function to use for outputting messages.
     * @return A boolean indicating if the field was successfully derived.  
     */
    private _tryDeriveSingleField(
        fieldDef: DerivedFieldDefinition & { sourceFields?: SourcedFieldName[] },
        keyForRegistry: typeof allDataFields[number]['name'],
        currentData: CollectedData,
        derivationRegistry: DerivationLogicRegistry,
        log: (message: string) => void,
    ): Promise<boolean> | boolean {
        /** Name of the field being derived. */
        const fieldName = fieldDef.name;
        const derivationFn = derivationRegistry[keyForRegistry];


        /** Flag indicating if any source fields are available in the current data. */
        const sourcesAvailable = fieldDef.sourceFields?.some(sf => Object.prototype.hasOwnProperty.call(currentData, sf));

        //if there is no derivationFn found but there is a single sourceField, default to attempting a copy of sourceField value to currentData[fieldName]
        if (sourcesAvailable && !derivationFn && fieldDef.sourceFields?.length === 1) {
            /** DataField from the field's sourceFields list. */
            const sourceField = fieldDef.sourceFields[0];
            currentData[fieldName] = currentData[sourceField];
            //  log(`              INFO (Transformer): No derivation function found for field '${fieldName}' (key: '${keyForRegistry}'). Defaulting to copying value from source field '${sourceField}'.`);
            return true;
        }

        if (!derivationFn) {
            return false;
        }

        if (!fieldDef.sourceFields) {
            // log(`              WARN (Transformer): Field '${fieldName}' (key: '${keyForRegistry}') is derivable but has no sourceFields defined. Attempting derivation without explicit sources.`);
            // Proceed to execute, assuming it's a source-less derivation
            return this._executeDerivationFunction(fieldDef, keyForRegistry, derivationFn, currentData, log);
        }


        // If any of the dependent fields are avaliable, try and derive a value. Derivation functions must handle undefined values.
        if (sourcesAvailable) {
            return this._executeDerivationFunction(fieldDef, keyForRegistry, derivationFn, currentData, log);
        } else {
            // Optional: Log if sources are not available for a derivable field in this pass
            // log(`              INFO (Transformer): Sources not yet available for field '${fieldName}' (key: '${keyForRegistry}') in pass ${currentPass}.`);
            return false;
        }
    }

    private async _executeDerivationFunction(
        fieldDef: MasterFieldDefinition,
        keyForRegistry: string,
        derivationFn: DerivationFunction,
        currentData: CollectedData,
        log: (message: string) => void
    ): Promise<boolean> {
        const fieldName = fieldDef.name as typeof allDataFields[number]['name'];
        try {

            /** Execute the derivation function and capture the derived value. */
            const derivedValue = await derivationFn(currentData);

            /** If a value was derived, update the current data and log the result. */
            if (derivedValue !== undefined) {
                currentData[fieldName] = derivedValue;
                log(`              Derived Field (Transformer) '${fieldName}' (key: '${keyForRegistry}'): ${JSON.stringify(derivedValue)}`);
                return true;
            }
            return false; // No value derived or undefined was returned intentionally
        } catch (e) {
            log(`              ERROR deriving field '${fieldName}' (key: '${keyForRegistry}') via registry: ${getErrorMessage(e)}`);
            return false;
        }
    }

    private _logFinalDerivationStatus(
        log: (message: string) => void,
        level: string | number,
        currentPass: number,
        maxPasses: number,
        derivedSomethingInAnyPass: boolean,
        derivedSomethingInLastAttemptedPass: boolean
    ): void {
        if (currentPass >= maxPasses && derivedSomethingInLastAttemptedPass) {
            log(`              INFO (Transformer): Stopped after reaching max passes (${maxPasses}) for level ${level}. Further derivations might be possible if maxPasses were increased.`);
        } else if (!derivedSomethingInAnyPass) {
            log(`              INFO (Transformer): No fields were derived for level ${level} after ${currentPass} pass(es).`);
        } else {
            log(`              INFO (Transformer): Field derivation completed for level ${level} in ${currentPass} pass(es).`);
        }
    }
}

// --- 3. Page Data Extractor ---
export class VIEWDataExtractor implements IDataExtractor {
    private environment: string;
    private domParser: DOMParser;
    private parsedContentCache: Map<string, { document: Document, embeddedFormData: URLSearchParams }>; // Cache for initial form data, not augmented
    private log: (message: string) => void;

    constructor(
        environment: string,
        log: (message: string) => void
    ) {
        this.environment = environment;
        this.domParser = new DOMParser();
        this.parsedContentCache = new Map(); // This cache stores the raw parsed document and its form
        this.log = log;
    }

    /**
     * Appends stateFields and literalParams to the embeddedFormData for a given page.
     * @param pageDef Definition of the page whose HTML is being parsed
     * @param relevantDataSourceForStateFields Data source (debtor or specific obligation) for stateField values
     * @param embeddedFormData FormData to which stateFields and literalParams will be appended
     * @returns 
     */
    private appendStateToPageState(
        pageDef: MasterPageDefinition,
        relevantDataSourceForStateFields: CollectedData,
        embeddedFormData?: URLSearchParams
    ) {
        if (!embeddedFormData) return undefined;
        // Append dynamic stateFields
        if (pageDef.dependencies.length > 0) {
            for (const /** Dependent page IDs with  stateField and literalParams */ dep of pageDef.dependencies) {
                if (dep.stateFields) {
                    for (const /** Field to use for dynamic value extraction */ stateFieldName of dep.stateFields) {
                        if (Object.prototype.hasOwnProperty.call(relevantDataSourceForStateFields, stateFieldName)) {
                            const value = relevantDataSourceForStateFields[stateFieldName];
                            if (value !== undefined && value !== null) {
                                embeddedFormData.set(stateFieldName, String(value));
                                this.log(`       (Extractor/getParsedContent) Appended stateField '${stateFieldName}=${String(value)}' to embeddedFormData for ${pageDef.id} (from its dependency ${dep.id})`);
                            }
                        } else {
                            this.log(`       (Extractor/getParsedContent) WARN: State field '${stateFieldName}' for ${pageDef.id} (from its dependency ${dep.id}) not found in its relevant data source.`);
                        }
                    }
                }
                // Append literalParams
                if (dep.literalParams) {
                    for (const literalParam of dep.literalParams) {
                        embeddedFormData.set(literalParam.name, literalParam.value);
                        this.log(`       (Extractor/getParsedContent) Appended literalParam '${literalParam.name}=${literalParam.value}' to embeddedFormData for ${pageDef.id} (from its dependency ${dep.id})`);
                    }
                }
            }
        }

        return embeddedFormData;
    }

    /**
     * Parses HTML content for the current page and extracts data from a form element.
     * @param parsedFullDoc - The parsed HTML document. 
     * @return An object containing the parsed document and embedded form data, or null if extraction fails.    
     */
    private extractPageState(
        parsedFullDoc: Document,
    ): { document: Document, embeddedFormData: URLSearchParams } | null {
        try {
            const formElement = parsedFullDoc.querySelector('form') || undefined;
            const embeddedFormData: URLSearchParams = new URLSearchParams(formElement ? new FormData(formElement) as unknown as URLSearchParams : undefined);
            return { document: parsedFullDoc, embeddedFormData };
        } catch (e) {
            this.log(`           ERROR (Extractor/getParsedContent): Failed to extract params: ${getErrorMessage(e)}`);
            return null;
        }
    }

    private _extractMappedTableData(config: RowMappingConfig, doc: Document): ExtractionOutput {
        const extractedData: ExtractionOutput = {};
        const lookupMap = new Map<string, string>();

        // 1. Build the lookup map if a lookup is defined
        if (config.lookup) {
            const { rowSelector, keySelector, valueSelector, valueFieldName } = config.lookup;
            this.log(`       (Extractor/TableMap) Building lookup for '${valueFieldName}'...`);
            const lookupRows = doc.querySelectorAll(rowSelector);

            lookupRows.forEach(row => {
                const keyEl = row.querySelector(keySelector);
                const valueEl = row.querySelector(valueSelector);
                const key = keyEl?.textContent?.trim();
                const value = valueEl?.textContent?.trim();

                if (key && value) {
                    lookupMap.set(key, value);
                }
            });
            this.log(`       (Extractor/TableMap) Built lookup map with ${lookupMap.size} entries.`);
        }

        // Initialize arrays for all fields we will extract
        const allFieldNames = [...Object.keys(config.fields)];
        if (config.lookup) {
            allFieldNames.push(config.lookup.valueFieldName);
        }
        allFieldNames.forEach(fieldName => {
            extractedData[fieldName as DataFieldName] = [];
        });

        const primaryIdentifierField = "NoticeNumber"; // This should be the key field

        // 2. Iterate through main data rows
        const dataRows = doc.querySelectorAll(config.rowSelector);
        this.log(`       (Extractor/TableMap) Found ${dataRows.length} primary data rows to process.`);

        dataRows.forEach(row => {
            // Extract the primary identifier (NoticeNumber) from the row first
            const primaryIdConfig = config.fields[primaryIdentifierField as DataFieldName];
            if (!primaryIdConfig) {
                this.log(`       (Extractor/TableMap) WARN: Row is missing primary identifier config ('${primaryIdentifierField}'). Skipping row.`);
                return;
            }
            const primaryIdEl = row.querySelector(primaryIdConfig.selector);
            const primaryId = primaryIdEl?.textContent?.trim();

            if (!primaryId) {
                this.log(`       (Extractor/TableMap) WARN: Could not find primary ID in a row. Skipping.`);
                return;
            }

            // Extract all other fields defined in the config for this row
            for (const fieldName in config.fields) {
                const fieldConfig = config.fields[fieldName as DataFieldName];
                if (fieldConfig) {
                    const element = row.querySelector(fieldConfig.selector);
                    const value = element?.textContent?.trim() || '';
                    (extractedData[fieldName as DataFieldName] as string[]).push(value);
                }
            }

            // 3. Use the primaryId to get the value from the lookup map
            if (config.lookup) {
                const lookedUpValue = lookupMap.get(primaryId) || null;
                if (lookedUpValue) {
                    this.log(`       (Extractor/TableMap) Lookup successful for key '${primaryId}' for field '${config.lookup.valueFieldName}'.`);
                }
                (extractedData[config.lookup.valueFieldName] as string[]).push(lookedUpValue);
            }
        });

        this.log(`       (Extractor/TableMap) Finished processing. Extracted ${allFieldNames.join(', ')}.`);
        return extractedData;
    }

    /**
     * Fetches a page and extracts data based on the provided task.
     * @param task - all data required to fetch and extract data from a page.
     * @returns  An object containing the extracted data and any augmented form data from the page.
     */
    public async fetchAndExtract(task: PageExtractionTask): Promise<ExtractionOutput & { augmentedFormDataFromPage?: URLSearchParams }> {
        this.log(`       Extractor: Fetching and extracting for page URL: ${task.url} (Page ID: ${task.id})`);

        /** Get the client state from the previous page in the path */
        const nextRequestClientState = this.appendStateToPageState(task.pageDefForGetParsedContent, task.currentDataForStateFields || {}, task.formData)

        /** Object containing the request method */
        const fetchOptions: RequestInit = {
            method: task.requestMethod || task.pageDefForGetParsedContent.method || 'GET', // Use pageDef method if available
        };

        if (fetchOptions.method === 'POST' && nextRequestClientState) {
            fetchOptions.body = task.formData;
            this.log(`       Extractor: POSTing to ${task.url} with formData: ${nextRequestClientState.toString()}`);
        } else if (fetchOptions.method === 'POST') {
            this.log(`       Extractor: POSTing to ${task.url} with empty body (no formData provided in task).`);
        }

        /** Get HTML page via fetch request */
        const pageEntryResponse = await fetch(task.url, fetchOptions);

        if (!pageEntryResponse.ok) {
            const errorBody = await pageEntryResponse.text().catch(() => "Could not read error body");
            this.log(`           ERROR (Extractor): Failed to fetch ${task.url}: ${pageEntryResponse.status} ${pageEntryResponse.statusText}. Body: ${errorBody}`);
            throw new Error(`Failed to fetch ${task.url}: ${pageEntryResponse.status} ${pageEntryResponse.statusText}`);
        }
        const pageEntryHtml = await pageEntryResponse.text();


        if (typeof pageEntryHtml !== 'string') {
            this.log(`           ERROR (Extractor): HTML content not found or not a string for URL ${task.url}.`);
            throw new Error(`HTML content not found for URL ${task.url}`);
        }

        /** Parse the HTML content into a document */
        const parsedFullDoc = this.domParser.parseFromString(pageEntryHtml, "text/html");

        /** Parsed document and any embedded form data. */
        const extractedPageState = this.extractPageState(
            parsedFullDoc,
        );

        if (!extractedPageState) {
            throw new Error(`Failed to parse content or handle state fields for ${task.url}`);
        }

        const extractedData: ExtractionOutput = {};

        /** Extract data for each field exposed by the page definition */
        for (const field of task.fields) {
            let value: string[] | string | undefined;
            try {
                // -- START OF MODIFICATION --
                if (typeof field.selector === 'object' && 'type' in field.selector && field.selector.type === 'row-mapped') {
                    this.log(`       (Extractor) Using Row-Mapped extraction for page ${task.id}`);
                    const mappedData = this._extractMappedTableData(field.selector, parsedFullDoc);
                    // Merge the results into the main extractedData object
                    Object.assign(extractedData, mappedData);
                    // Since this one definition handles multiple fields, we can break the loop.
                    // This assumes one 'row-mapped' config per page.
                    break;
                } else {
                    // This is the original logic, now in the else block
                    value = this._extractSimpleField(field as { name: DataFieldName; selector: DomSelector; isList?: boolean; }, parsedFullDoc, value, extractedData);
                }
                // -- END OF MODIFICATION --
            } catch (e) {
                this.log(`               ERROR (Extractor) selecting/evaluating for field '${field.name}': ${getErrorMessage(e)}`);
            }
        }

        const output: ExtractionOutput & { augmentedFormDataFromPage?: URLSearchParams } = { ...extractedData };
        if (extractedPageState.embeddedFormData) {
            output.augmentedFormDataFromPage = extractedPageState.embeddedFormData;
        }
        return output;
    }

    /**
     * 
     * @param field The
     * @param parsedFullDoc 
     * @param value 
     * @param extractedData 
     * @returns 
     */
    private _extractSimpleField(field: { name: DataFieldName; selector: DomSelector; isList?: boolean; }, parsedFullDoc: Document, value: string | string[] | undefined, extractedData: Partial<Record<DataFieldName, string | string[]>>) {
        function extractXPathValue(result: XPathResult | null, selectorNode?: string): (string)[] {
            // need keys and values reversed
            const ResultTypeConstant: Record<number, string> = {
                0: "ANY_TYPE",
                1: "NUMBER_TYPE",
                2: "STRING_TYPE",
                3: "BOOLEAN_TYPE",
                4: "UNORDERED_NODE_ITERATOR_TYPE",
                5: "ORDERED_NODE_ITERATOR_TYPE",
                6: "UNORDERED_NODE_SNAPSHOT_TYPE",
                7: "ORDERED_NODE_SNAPSHOT_TYPE",
                8: "ANY_UNORDERED_NODE_TYPE",
                9: "FIRST_ORDERED_NODE_TYPE"
            }
            if (!result) return [''];
            if (ResultTypeConstant[result.resultType] === 'STRING_TYPE' && result.stringValue.trim() !== '') return [result.stringValue];
            if (ResultTypeConstant[result.resultType] === 'UNORDERED_NODE_ITERATOR_TYPE') {
                const list = [];
                let node = result.iterateNext();
                while (node) {
                    if (node instanceof HTMLFormElement) {
                        list.push(node.value?.trim())
                    } else if (node instanceof HTMLElement) {
                        list.push(selectorNode === 'title' ? node.title.trim() : node.textContent?.trim())
                    }
                    node = result.iterateNext();
                }
                return list;

            }
            return [''];
        }

        if (field.selector.type === "css") {
            if (field.isList) {
                const elements = parsedFullDoc.querySelectorAll(field.selector.value);
                value = Array.from(elements).map(el => field.selector.node === 'title' ? (el as HTMLElement).title?.trim() : (el as HTMLElement).textContent?.trim() || (el as HTMLInputElement).value?.trim());
            } else {
                const element = parsedFullDoc.querySelector(field.selector.value);
                value = field.selector.node === 'title' ? (element as HTMLElement).title?.trim() : (element as HTMLElement)?.textContent?.trim() || (element as HTMLInputElement)?.value?.trim();
            }
        } else if (field.selector.type === "xpath") {
            const xpathResolver = (prefix: string | null) => {
                const ns = { 'xhtml': 'http://www.w3.org/1999/xhtml' };
                return ns[prefix as keyof typeof ns] || null;
            };
            if (field.isList) {
                const results = parsedFullDoc.evaluate(field.selector.value, parsedFullDoc, xpathResolver, XPathResult.ANY_TYPE, null);
                value = extractXPathValue(results, field.selector.node);
            } else {
                const result = parsedFullDoc.evaluate(field.selector.value, parsedFullDoc, xpathResolver, XPathResult.ANY_TYPE, null);
                const valueInArray = extractXPathValue(result, field.selector.node);
                value = valueInArray ? valueInArray[0] : undefined;
            }


        }


        if (value !== undefined && value !== '') {
            extractedData[field.name] = value;
            this.log(`               Extractor: Extracted '${field.name}': ${JSON.stringify(value)}`);
        } else {
            this.log(`               Extractor: Selector for '${field.name}' (${field.selector.type}: ${field.selector.value}) found no data.`);
        }
        return value;
    }

    /**
     * Gets the relevant data source for stateFields logic based on the page level and current task.
     * @param pageDefBeingParsed
     * @param task
     * @returns The relevant data source for stateFields logic.
     */
    private getDynamicFieldDataSource(pageDefBeingParsed: MasterPageDefinition, task: PageExtractionTask) {
        let relevantDataSourceForStateFieldsLogic: CollectedData = {};
        if (pageDefBeingParsed.level === "Debtor") {
            relevantDataSourceForStateFieldsLogic = task.currentDataForStateFields || {};
        } else {
            const globalData = task.currentDataForStateFields as CollectedData;
            if (globalData?.a && task.currentObligationNumberForStateFields && task.obligationIdentifierFieldNameForStateFields) {
                relevantDataSourceForStateFieldsLogic = globalData.a.find(
                    (o: Partial<Record<DataFieldName, string | undefined | string[]>>) => o[task.obligationIdentifierFieldNameForStateFields!] === task.currentObligationNumberForStateFields
                ) || {};
                if (!relevantDataSourceForStateFieldsLogic) {
                    if (globalData && globalData[task.obligationIdentifierFieldNameForStateFields!] === task.currentObligationNumberForStateFields) {
                        relevantDataSourceForStateFieldsLogic = globalData;
                    } else {
                        this.log(`       (Extractor/fetchAndExtract) WARN: Obligation object for ${task.currentObligationNumberForStateFields} not found in currentData.a for stateField sourcing for page ${task.pageId}.`);
                    }
                }
            } else if (globalData && task.obligationIdentifierFieldNameForStateFields && globalData[task.obligationIdentifierFieldNameForStateFields] === task.currentObligationNumberForStateFields) {
                relevantDataSourceForStateFieldsLogic = globalData;
            } else {
                this.log(`       (Extractor/fetchAndExtract) WARN: Insufficient data to locate specific obligation for stateField sourcing for page ${task.pageId}. currentDataForStateFields might not be structured as expected or obligation identifiers missing.`);
                relevantDataSourceForStateFieldsLogic = task.currentDataForStateFields || {};
            }
        }
        return relevantDataSourceForStateFieldsLogic;
    }
}

// --- 4. Optimiser Module ---
export class SimpleOptimiser implements IOptimiser {
    public async getOptimalPaths(input: OptimiserInput): Promise<OptimiserOutput> {
        const { targetFields, allPageDefinitions, pagesToExclude } = input;
        const optimiserResult = this.getOptimizedLoadDetails(
            allPageDefinitions,
            targetFields,
            pagesToExclude
        );
        return {
            pathsToVisit: optimiserResult.minimalTraversals,
            unreachableFields: optimiserResult.unreachableFields
        };
    }

    private findMinimalLoadSetInternal(targetFieldsSet: TargetFieldSet, allPagesMap: AllPagesMap, pagesToExclude: PageId[] | undefined) {
        const uncoveredFields = new Set(targetFieldsSet);
        const globallySelectedPages: Set<PageId> = new Set();
        const finalPaths = new Map<PageId, PageId[]>();

        // Move candidateMemo outside the loop to persist across iterations
        const candidateMemo = new Map<PageId, { pagesInvolved: Set<PageId> }>();

        function buildPathRecursive(pageIdToBuild: PageId, processingForBuild: Set<string>) {
            if (finalPaths.has(pageIdToBuild)) {
                const cachedPath = finalPaths.get(pageIdToBuild);
                if (!cachedPath) {
                    throw new Error(`Optimiser: Cached path for page ${pageIdToBuild} is empty or undefined.`);
                }
                return cachedPath;
            }
            if (processingForBuild.has(pageIdToBuild)) {
                console.warn(`Circular dependency detected for page: ${pageIdToBuild}. Path: ${Array.from(processingForBuild).join(' -> ')} -> ${pageIdToBuild}`);
                return [];
            }
            processingForBuild.add(pageIdToBuild);
            const pageDef = allPagesMap.get(pageIdToBuild);
            if (!pageDef) {
                processingForBuild.delete(pageIdToBuild);
                console.error(`Optimiser: Page definition not found for ID: ${pageIdToBuild}`);
                return [];
            }
            const dependencyPathSegments: PageId[][] = [];
            for (const depId of pageDef.dependencies) {
                dependencyPathSegments.push(buildPathRecursive(depId, processingForBuild));
            }
            const orderedPath: PageId[] = [];
            const pathSet = new Set();
            dependencyPathSegments.forEach((segment) => {
                segment.forEach((p) => {
                    if (!pathSet.has(p)) {
                        orderedPath.push(p);
                        pathSet.add(p);
                    }
                });
            });
            if (!pathSet.has(pageIdToBuild)) {
                orderedPath.push(pageIdToBuild);
            }
            finalPaths.set(pageIdToBuild, orderedPath);
            processingForBuild.delete(pageIdToBuild);
            return orderedPath;
        }

        function getPagesInvolvedForCandidateEval(
            evalPageId: PageId,
            candidateMemo: Map<PageId, { pagesInvolved: Set<PageId> }>,
            candidateProcessing: Set<PageId>,
            currentAllPages: Map<PageId, OptimiserPageRepresentation>,
            pagesToExclude: PageId[] | undefined
        ): { pagesInvolved: Set<PageId> } {
            if (pagesToExclude?.includes(evalPageId)) {
                throw new Error(`Candidate path for ${evalPageId} is invalid as it is in the exclusion list.`);
            }
            if (candidateMemo.has(evalPageId)) {
                const candidateMemoResult = candidateMemo.get(evalPageId);
                if (!candidateMemoResult) {
                    throw new Error(`Optimiser: Candidate memo for ${evalPageId} is empty or undefined.`);
                }
                return candidateMemoResult;
            }
            if (candidateProcessing.has(evalPageId)) {
                console.warn(`Cycle detected during candidate cost evaluation for ${evalPageId}`);
                return { pagesInvolved: new Set() };
            }
            candidateProcessing.add(evalPageId);
            const pageDef = currentAllPages.get(evalPageId);
            if (!pageDef) {
                candidateProcessing.delete(evalPageId);
                console.error(`Optimiser: Page definition not found for ${evalPageId} during candidate cost evaluation.`);
                return { pagesInvolved: new Set() };
            }
            const totalPagesForThisBranch: Set<PageId> = new Set();
            totalPagesForThisBranch.add(evalPageId);
            for (const depId of pageDef.dependencies) {
                const depResult = getPagesInvolvedForCandidateEval(depId, candidateMemo, candidateProcessing, currentAllPages, pagesToExclude);
                depResult.pagesInvolved.forEach(p => totalPagesForThisBranch.add(p));
            }
            candidateProcessing.delete(evalPageId);
            const result = { pagesInvolved: totalPagesForThisBranch };
            candidateMemo.set(evalPageId, result);
            return result;
        }

        while (uncoveredFields.size > 0) {
            let bestCandidate: { pageId: null | PageId, coveredCount: number, newPagesCount: number } = {
                pageId: null,
                coveredCount: -1,
                newPagesCount: Infinity
            };

            for (const [pageId, pageDef] of allPagesMap) {
                // Skip if page is excluded
                if (pagesToExclude?.includes(pageId)) {
                    continue;
                }

                // Skip if page is already selected - THIS IS THE KEY FIX
                if (globallySelectedPages.has(pageId)) {
                    continue;
                }

                let currentCoveredFieldsCount = 0;
                pageDef.fields.forEach((field) => {
                    if (uncoveredFields.has(field)) currentCoveredFieldsCount++;
                });
                if (currentCoveredFieldsCount === 0) continue;

                try {
                    // Use the persistent candidateMemo instead of creating a new one
                    const { pagesInvolved: candidateTotalPagesInvolved } = getPagesInvolvedForCandidateEval(
                        pageId,
                        candidateMemo, // ← Use persistent memo
                        new Set(),
                        allPagesMap,
                        pagesToExclude
                    );

                    let numNewPages = 0;
                    candidateTotalPagesInvolved.forEach(p => {
                        if (!globallySelectedPages.has(p)) numNewPages++;
                    });

                    if (currentCoveredFieldsCount > bestCandidate.coveredCount ||
                        (currentCoveredFieldsCount === bestCandidate.coveredCount && numNewPages < bestCandidate.newPagesCount)) {
                        bestCandidate = { pageId, coveredCount: currentCoveredFieldsCount, newPagesCount: numNewPages };
                    }
                } catch (e) {
                    continue;
                }
            }

            if (bestCandidate.pageId === null || bestCandidate.coveredCount <= 0) break;

            const chosenPageId = bestCandidate.pageId;
            try {
                const pathToChosenPage = buildPathRecursive(chosenPageId, new Set());
                pathToChosenPage.forEach(p => globallySelectedPages.add(p));

                // Update uncovered fields based on newly selected pages
                allPagesMap.forEach((pDef, pId) => {
                    if (globallySelectedPages.has(pId)) {
                        pDef.fields.forEach(field => uncoveredFields.delete(field));
                    }
                });

                // Optional: Clear memo entries for pages that are now selected to save memory
                pathToChosenPage.forEach(p => candidateMemo.delete(p));

            } catch (e) {
                console.error(`Optimiser: Error committing page ${chosenPageId} and its dependencies: ${(e instanceof Error ? e.message : String(e))}.`);
                break;
            }
        }

        const finalSelectedPaths = new Map();
        globallySelectedPages.forEach(pageId => {
            if (finalPaths.has(pageId)) {
                finalSelectedPaths.set(pageId, finalPaths.get(pageId));
            } else {
                try {
                    const path = buildPathRecursive(pageId, new Set());
                    finalSelectedPaths.set(pageId, path);
                } catch (e) {
                    console.error(`Optimiser: Could not rebuild path for selected page ${pageId}: ${getErrorMessage(e)}`);
                }
            }
        });

        return {
            pagesToLoad: globallySelectedPages,
            paths: finalSelectedPaths,
            numberOfLoads: globallySelectedPages.size,
            unreachableFields: uncoveredFields,
        };
    }

    private getMinimalTraversalPaths(rawPageDefinitions: MasterPageDefinition[], targetFieldStrings: string[], pagesToExclude?: PageId[]): PageId[][] {
        if (!Array.isArray(rawPageDefinitions)) throw new Error("Optimiser: Page definitions must be an array.");
        if (!Array.isArray(targetFieldStrings)) throw new Error("Optimiser: Target fields must be an array of strings.");

        const allPages: AllPagesMap = new Map();
        for (const def of rawPageDefinitions) {
            if (typeof def.id !== 'string' || !def.id.trim()) throw new Error(`Optimiser: Page definition found with invalid or empty ID.`);
            if (!Array.isArray(def.fields) || !def.fields.every(f => typeof f === 'object' && f !== null && typeof f.name === 'string' && typeof f.selector === 'object')) {
                throw new Error(`Optimiser: Page ID "${def.id}" has invalid 'fields'. Expected array of FieldDefinition objects.`);
            }
            if (!Array.isArray(def.dependencies)) throw new Error(`Optimiser: Page ID "${def.id}" has invalid 'dependencies'.`);
            if (typeof def.level !== 'string') throw new Error(`Optimiser: Page ID "${def.id}" has invalid 'level'.`);
            if (typeof def.url !== 'string') throw new Error(`Optimiser: Page ID "${def.id}" has invalid 'url'.`);
            if (allPages.has(def.id)) throw new Error(`Optimiser: Duplicate page ID: "${def.id}".`);

            const processedDependencies = def.dependencies.map((dep, index) => {
                if (typeof dep === 'object' && dep !== null && typeof dep.id === 'string') return dep.id;
                if (typeof dep === 'string') return dep;
                throw new Error(`Optimiser: Page ID "${def.id}" has invalid dependency structure at index ${index}. Expected {id: string} or string.`);
            }).filter(id => id);

            allPages.set(def.id, {
                id: def.id,
                fields: new Set(def._optimiserFields || def.fields.map((f) => f.name).filter(fName => fName)),
                dependencies: processedDependencies,
            });
        }

        const targetFields = new Set<string>(targetFieldStrings.map(f => f.trim()).filter(f => f));
        if (targetFields.size === 0) return [];
        if (allPages.size === 0 && targetFields.size > 0) return [];

        const internalResult = this.findMinimalLoadSetInternal(targetFields, allPages, pagesToExclude);

        const allSelectedPathEntries: PathEntry[] = [];
        internalResult.paths.forEach((path, pageId) => {
            if (internalResult.pagesToLoad.has(pageId)) {
                allSelectedPathEntries.push({ pageId, path });
            }
        });

        const finalPathsToDisplayObjects: PathEntry[] = [];
        for (const currentEntry of allSelectedPathEntries) {
            let isCoveredByLongerPath = false;
            for (const otherEntry of allSelectedPathEntries) {
                if (currentEntry.pageId === otherEntry.pageId) continue;
                if (currentEntry.path.length < otherEntry.path.length) {
                    const otherPathSet = new Set(otherEntry.path);
                    let allCurrentPathPagesFoundInOtherPath = true;
                    for (const pageInCurrentPath of currentEntry.path) {
                        if (!otherPathSet.has(pageInCurrentPath)) {
                            allCurrentPathPagesFoundInOtherPath = false;
                            break;
                        }
                    }
                    if (allCurrentPathPagesFoundInOtherPath) {
                        isCoveredByLongerPath = true;
                        break;
                    }
                }
            }
            if (!isCoveredByLongerPath) {
                finalPathsToDisplayObjects.push(currentEntry);
            }
        }
        finalPathsToDisplayObjects.sort((a, b) => a.pageId.localeCompare(b.pageId));
        return finalPathsToDisplayObjects.map(entry => entry.path);
    }

    /**
     * Get optimized load details for the scraper.
     * @param rawPageDefinitions - The raw page definitions to process.
     * @param targetFieldStrings - The target field strings to optimize for.
     * @param pagesToExclude - The pages to exclude from the optimization.
     * @returns The optimized load details.
     */
    private getOptimizedLoadDetails(
        rawPageDefinitions: MasterPageDefinition[],
        targetFieldStrings: DataFieldName[],
        pagesToExclude: PageId[]
    ) {
        /** Map of pageId with their definitions, fields, and dependencies. */
        const allPagesInternal: AllPagesMap = new Map();
        try {
            // Filter out invalid page definitions
            rawPageDefinitions.forEach(def => {
                const processedDependencies = def.dependencies.map(dep => {
                    if (typeof dep === 'object' && dep !== null && typeof dep.id === 'string') return dep.id;
                    if (typeof dep === 'string') return dep;
                    throw new Error(`Optimiser: Invalid dependency for page ${def.id} during internal processing.`);
                }).filter(id => id);

                allPagesInternal.set(def.id, {
                    id: def.id,
                    fields: new Set(def._optimiserFields || def.fields.map(f => f.name).filter(fName => fName)),
                    dependencies: processedDependencies
                });
            });
        } catch (e) {
            console.error("Optimiser: Error processing raw page definitions:", getErrorMessage(e));
            throw e;
        }

        /* Set of explicitly targeted fields to load */
        const targetFields = new Set(targetFieldStrings.map(f => f.trim()).filter(f => f));

        if (targetFields.size === 0) {
            return { minimalTraversals: [], pagesToLoad: new Set<PageId>(), numberOfLoads: 0, unreachableFields: new Set<DataFieldName>() };
        }
        if (allPagesInternal.size === 0) {
            return { minimalTraversals: [], pagesToLoad: new Set<PageId>(), numberOfLoads: 0, unreachableFields: new Set<DataFieldName>(Array.from(targetFields).sort()) };
        }


        const internalResult = this.findMinimalLoadSetInternal(targetFields, allPagesInternal, pagesToExclude)
        const minimalTraversals = this.getMinimalTraversalPaths(rawPageDefinitions, targetFieldStrings, pagesToExclude);

        return {
            minimalTraversals,
            pagesToLoad: internalResult.pagesToLoad,
            numberOfLoads: internalResult.numberOfLoads,
            unreachableFields: internalResult.unreachableFields,
        };
    }
}


// --- 5. Main Scraper Class ---
/**
 *
 */
export class Scraper {
    /** @private optimiser - An instance of IOptimiser to determine optimal paths. */
    private optimiser: IOptimiser
    /** @private extractor - An instance of IDataExtractor to extract data from pages. */
    private extractor: IDataExtractor;
    /** @private transformer - ITransformer to transform data. */
    private transformer?: ITransformer;
    private allPageDefinitions: MasterPageDefinition[];
    private masterFieldDefinitions: MasterFieldDefinition[];
    /** @private allPageDefsMap - A Map of all page definitions by their IDs. */
    private allPageDefsMap: Map<PageId, MasterPageDefinition>;
    private masterFieldDefsMap: Map<DataFieldName, MasterFieldDefinition>;
    /** @private environment - The required VIEW environment used for template substitution @example 'djr', 'djr-uat' */
    private environment: string;
    /** @private Name of the key field for obligation records*/
    private obligationIdentifierFieldName: DataFieldName;
    private contextSwitchingPageId?: PageId;
    private log: (message: string) => void;
    /**
     * Constructor for the Scraper class.
     * @param optimiser - An instance of IOptimiser to determine optimal paths.
     * @param extractor - An instance of IDataExtractor to extract data from pages.
     * @param config - Configuration object for the scraper.
     * @param logFunction - Custom logging function.
     * @param transformer - Optional instance of ITransformer to transform data.
     */
    constructor(
        optimiser: IOptimiser,
        extractor: IDataExtractor,
        config: ScraperConfig,
        logFunction: (message: string) => void,
        transformer?: ITransformer,
    ) {
        this.optimiser = optimiser;
        this.extractor = extractor;
        this.transformer = transformer;
        this.allPageDefinitions = expandPageDefinitionsForOptimiser(config.allPageDefinitions);
        this.masterFieldDefinitions = config.masterFieldDefinitions;
        this.allPageDefsMap = new Map(this.allPageDefinitions.map(p => [p.id, p]));
        this.masterFieldDefsMap = new Map(config.masterFieldDefinitions.map(f => [f.name, f]));
        this.environment = config.environment;
        this.obligationIdentifierFieldName = config.obligationIdentifierFieldName || "NoticeNumber";
        this.contextSwitchingPageId = config.contextSwitchingPageId;
        this.log = logFunction;
    }

    // --- Within the Scraper class ---

    /**
     * Returns the required fields that are still missing from the current data object
     * If a required field is derived, its missing non-derived source fields
     * will be added to `fieldsForOptimiser`.
     * @param currentDataObject The current data object to check against.
     * @param level The level of the data object (Debtor or Obligation).
     * @param explicitlyTargetedFields List of fields that are explicitly targeted for extraction.
     * @returns An object containing two arrays:
     * - `fieldsForOptimiser`: Non-derived fields that should be targeted by the optimiser.
     * - `missingOverallTargets`: Explicitly targeted fields that are missing in the current data object.
     */
    private calculateRemainingFields(
        currentDataObject: CollectedData,
        level: "Debtor" | "Obligation",
        explicitlyTargetedFields: DataFieldName[]
    ): {
        /** Non-derived fields that should be targeted by the optimiser.*/
        fieldsForOptimiser: DataFieldName[],
        /** Explicitly targeted fields that are missing in the current data object. */
        missingOverallTargets: DataFieldName[]
    } {
        const fieldsForOptimiser = new Set<DataFieldName>();
        const missingOverallTargets: DataFieldName[] = [];

        // Case 1: currentDataObject is null or undefined (initial state or no data for level)
        if (!currentDataObject) {
            explicitlyTargetedFields.forEach(targetedField => {
                const fieldDef = this.masterFieldDefsMap.get(targetedField);
                if (fieldDef && fieldDef.level === level) {
                    // All explicitly targeted fields are considered missing overall
                    missingOverallTargets.push(targetedField);

                    if (fieldDef.isDerived && fieldDef.sourceFields) {
                        // If the target is derived, its non-derived source fields are candidates for the optimiser
                        for (const sourceFieldName of fieldDef.sourceFields) {
                            const sourceFieldDef = this.masterFieldDefsMap.get(sourceFieldName);
                            // Add source field to optimiser if it's at the correct level and not derived itself
                            if (sourceFieldDef && sourceFieldDef.level === level && !sourceFieldDef.isDerived) {
                                fieldsForOptimiser.add(sourceFieldName);
                            }
                        }
                    } else if (!fieldDef.isDerived) {
                        // If the target is not derived, it's a direct candidate for the optimiser
                        fieldsForOptimiser.add(targetedField);
                    }
                }
            });
            return { fieldsForOptimiser: Array.from(fieldsForOptimiser), missingOverallTargets };
        }

        // Case 2: currentDataObject exists, proceed with the main logic
        for (const targetName of explicitlyTargetedFields) {
            const fieldDef = this.masterFieldDefsMap.get(targetName);
            if (!fieldDef || fieldDef.level !== level) {
                continue; // Skip if field definition is not found or not for the current level
            }

            // Check 1: Is the explicitly targeted field itself missing from currentData?
            // If so, add it to the list of overall missing targets.
            if (!Object.prototype.hasOwnProperty.call(currentDataObject, targetName)) {
                missingOverallTargets.push(targetName);
            }

            // Check 2: Determine fields for the optimiser based on the target's nature.
            if (fieldDef.isDerived && fieldDef.sourceFields) {
                // If the *explicitly targeted field* is derived, always check its source fields.
                // This is the core of your requested change.
                for (const sourceFieldName of fieldDef.sourceFields) {
                    const sourceFieldDef = this.masterFieldDefsMap.get(sourceFieldName);
                    // Add source field to optimiser if:
                    // 1. It has a definition and is for the correct level.
                    // 2. It's missing from currentDataObject.
                    // 3. It's not derived itself (optimiser fetches raw data).
                    if (sourceFieldDef &&
                        sourceFieldDef.level === level &&
                        !Object.prototype.hasOwnProperty.call(currentDataObject, sourceFieldName) &&
                        !sourceFieldDef.isDerived) {
                        fieldsForOptimiser.add(sourceFieldName);
                    }
                }
            } else if (!fieldDef.isDerived) {
                // If the *explicitly targeted field* is NOT derived,
                // it should be added to optimiser targets ONLY IF IT'S MISSING.
                if (!Object.prototype.hasOwnProperty.call(currentDataObject, targetName)) {
                    fieldsForOptimiser.add(targetName);
                }
            }
        }

        return {
            fieldsForOptimiser: Array.from(fieldsForOptimiser),
            missingOverallTargets
        };
    }

    // You can now remove the `newMethod` as its logic is incorporated above:
    // private newMethod(explicitlyTargetedFields: DataField[], level: string, missingOverallTargets: DataField[], fieldsForOptimiser: Set<DataField>) { ... }

    /** Merge new extracted data into the accumulated data. 
     * @remarks
     * This method integrates the extracted data into the final result object, ensuring that fields are added only if they are not already present.
     * It also checks if the data was explicitly targeted for extraction, which helps in determining if the optimiser should continue to run.
     * @param extractedData - The data extracted from the current page.
     * @param pageLevel - The level of the page (Debtor or Obligation).
     * @param finalResult - The accumulated data object where the extracted data will be integrated.
     * @param currentObligationNumber - The current obligation number, if applicable.
     * @param explicitlyTargetedFields - List of fields that are explicitly targeted for extraction.
     * @param optimiserTargetedDirectFields - Optional list of fields that are directly targeted by the optimiser.
     * @returns A boolean indicating whether new data was added to the targets.
    */
    private async integrateData(
        extractedData: ExtractionOutput,
        pageLevel: "Debtor" | "Obligation",
        finalResult: CollectedData,
        currentObligationNumber: string | undefined,
        explicitlyTargetedFields: string[],
        optimiserTargetedDirectFields?: string[]
    ): Promise<boolean> {
        /** Flag that shows that new data was added the accumulated data. */
        let dataActuallyAddedToTargets = false;

        /** Loop through all fields extracted from the current page */
        for (const fieldName in extractedData) {
            if (fieldName === 'augmentedFormDataFromPage') continue;

            /** The field definition for the current field. */
            const masterFieldDef = this.masterFieldDefsMap.get(fieldName as DataFieldName);

            /** If no definition is found, throw an error */
            if (!masterFieldDef) throw new Error(`Field definition for '${fieldName}' not found in master field definitions.`);

            /** The value of the current field. */
            const value = extractedData[fieldName as DataFieldName];

            if (masterFieldDef.level === "Debtor") {
                if (!Object.prototype.hasOwnProperty.call(finalResult, fieldName)) {
                    finalResult[fieldName as DataFieldName] = value;
                    if (explicitlyTargetedFields.includes(fieldName) || optimiserTargetedDirectFields?.includes(fieldName)) {
                        dataActuallyAddedToTargets = true;
                    }
                }
            } else if (masterFieldDef.level === "Obligation") {
                if (currentObligationNumber) {
                    let oblObj: CollectedData | undefined = finalResult.a?.find(o => o[this.obligationIdentifierFieldName] === currentObligationNumber);
                    if (!oblObj) {
                        oblObj = { [this.obligationIdentifierFieldName]: currentObligationNumber };
                        finalResult.a = [...(finalResult.a || []), oblObj];
                    }
                    if (!Object.prototype.hasOwnProperty.call(oblObj, fieldName)) {
                        oblObj[fieldName as DataFieldName] = value;
                        if (explicitlyTargetedFields.includes(fieldName) || optimiserTargetedDirectFields?.includes(fieldName)) {
                            dataActuallyAddedToTargets = true;
                        }
                    }
                } else if (pageLevel === "Debtor" && Array.isArray(value) && Array.isArray(extractedData[this.obligationIdentifierFieldName as DataFieldName])) {
                    (extractedData[this.obligationIdentifierFieldName] as unknown[]).forEach((oblNum, idx) => {
                        let targetObligation = finalResult.a?.find(o => o[this.obligationIdentifierFieldName] === oblNum);
                        if (!targetObligation) {
                            targetObligation = { [this.obligationIdentifierFieldName]: oblNum };
                            finalResult.a = [...(finalResult.a || []), targetObligation];
                        }

                        const sourceArray = extractedData[fieldName as DataFieldName];

                        // Ensure the source array is valid and we haven't already collected this field
                        if (Array.isArray(sourceArray) && !Object.prototype.hasOwnProperty.call(targetObligation, fieldName) && sourceArray.length > idx) {

                            // Get the specific value for this obligation from the array
                            const valueForObligation = sourceArray[idx];

                            // Only assign the value if it is NOT null or undefined
                            if (valueForObligation !== null && valueForObligation !== undefined) {
                                targetObligation[fieldName as DataFieldName] = valueForObligation;
                                this.log(`                                Pre-collected Obligation Field '${fieldName}' for ${oblNum}: ${JSON.stringify(targetObligation[fieldName as DataFieldName])}`);
                                if (explicitlyTargetedFields.includes(fieldName) || optimiserTargetedDirectFields?.includes(fieldName)) {
                                    dataActuallyAddedToTargets = true;
                                }
                            }
                        }

                    });
                }

            }
        }
        return dataActuallyAddedToTargets;
    }

    /**
     * Processes a specific page outside of the flow determined by the optimiser.
     * @param pageId - The ID of the page to process.
     * @param context - Context for the page processing, typically containing the NoticeNumber.
     * @param finalResult - The complete accumulated data object.
     * @param explicitlyTargetedFields - List of fields that are explicitly targeted for extraction.
     * @param logContext - Context for logging, typically the name of the page or process.
     * @param initialFormDataForRequest 
     * @returns A promise that resolves to the extraction output or undefined if the page could not be processed. 
     */
    private async forceProcessPageInternal(
        pageId: PageId,
        context: { NoticeNumber?: string },
        finalResult: CollectedData,
        explicitlyTargetedFields: DataFieldName[],
        allRequiredFields: DataFieldName[],
        logContext: string,
        initialFormDataForRequest?: URLSearchParams
    ): Promise<(ExtractionOutput & { augmentedFormDataFromPage?: URLSearchParams }) | undefined> {
        /** The definition of the page to process. */
        const pageDef = this.allPageDefsMap.get(pageId);
        if (!pageDef) {
            this.log(`                ERROR (Force Process - ${logContext}): Page definition for ${pageId} not found. Skipping.`);
            return undefined;
        }
        this.log(`        Force Processing Page for ${logContext}: ${pageId} with context ${JSON.stringify(context)}`);

        /** Resolves the URL for the page definition, replacing any placeholders with actual values. */
        const resolvedUrl = templateSubstitution(pageDef.url, { environment: this.environment, ...context });

        /** List of all definitions for field that can be extracted from the page.*/
        const fieldsOnPageToExtract = pageDef.fields.map(f => ({ name: f.name, selector: f.selector, isList: f.isList }));

        /** Determine the request method the page. */
        const requestMethodForForceProcess: 'GET' | 'POST' = initialFormDataForRequest ? 'POST' : (pageDef.method || 'GET');

        /**
         * Either the whole aggregated data (if the page is at the Debtor level), 
         * or a specific obligation record from the aggregated data.
         */
        let dataSourceForStateFields: CollectedData | undefined;
        if (pageDef.level === "Debtor") {
            dataSourceForStateFields = finalResult;
        } else if (context.NoticeNumber) {
            dataSourceForStateFields = finalResult.a?.find(o => o[this.obligationIdentifierFieldName] === context.NoticeNumber);
            if (!dataSourceForStateFields) {
                this.log(`        (Force Process) WARN: Obligation ${context.NoticeNumber} not found in finalResult.a for stateField sourcing.`);
                dataSourceForStateFields = {};
            }
        } else {
            dataSourceForStateFields = finalResult;
        }

        try {
            const extractionResult = await (this.extractor as VIEWDataExtractor).fetchAndExtract({
                id: pageId,
                url: resolvedUrl,
                fields: fieldsOnPageToExtract,
                requestMethod: requestMethodForForceProcess,
                formData: initialFormDataForRequest,
                pageDefForGetParsedContent: pageDef,
                currentDataForStateFields: pageDef.level === "Debtor" ? finalResult : dataSourceForStateFields,
                currentObligationNumberForStateFields: context.NoticeNumber,
                obligationIdentifierFieldNameForStateFields: this.obligationIdentifierFieldName
            });

            await this.integrateData(extractionResult, pageDef.level, finalResult, context.NoticeNumber, explicitlyTargetedFields);

            /** Transform and derive fields if required. */
            if (this.transformer) {
                const dataObjectToTransform = pageDef.level === "Debtor" ?
                    finalResult :
                    finalResult.a?.find(o => o[this.obligationIdentifierFieldName] === context.NoticeNumber);

                if (dataObjectToTransform) {
                    await this.transformer.deriveFields({
                        currentData: dataObjectToTransform,
                        level: pageDef.level,
                        masterFieldDefinitions: this.masterFieldDefinitions,
                        explicitlyTargetedFields,
                        derivationRegistry: derivationFunctionsRegistry,
                        log: this.log
                    });
                }
            }
            return extractionResult;
        } catch (error) {
            this.log(`                ERROR during force processing of ${pageId} for ${logContext}: ${getErrorMessage(error)}`);
            return undefined;
        }
    }

    /**
     * Scrapes data from the specified pages and extracts the relevant fields.
     * @param initialObligations - Set of input obligation data.
     * @param explicitlyTargetedFields - The fields that are explicitly targeted for extraction.
     * @returns The final collected data after scraping.
     */
    public async scrape(
        initialObligations: CollectedData[],
        explicitlyTargetedFields: DataFieldName[]
    ): Promise<CollectedData> {
        const finalResult: CollectedData = { a: [] };
        this.log(`--- Scraping Started (Env: ${this.environment}) ---`);
        this.log(`Targeting fields: ${explicitlyTargetedFields.join(', ')}`);
        if (this.transformer) this.log("Derived fields processing is ENABLED.");

        const allRequiredFields = new Set<DataFieldName>(explicitlyTargetedFields);
        explicitlyTargetedFields.forEach(fieldName => {
            const fieldDef = this.masterFieldDefsMap.get(fieldName);
            if (fieldDef?.isDerived && fieldDef.sourceFields) {
                fieldDef.sourceFields.forEach(source => {
                    allRequiredFields.add(source);
                });
            }
        });
        this.log(`Expanded targets to include source fields: ${Array.from(allRequiredFields).join(', ')}`);


        let formDataForNextRequest: URLSearchParams | undefined = undefined;

        if (this.contextSwitchingPageId && initialObligations.length > 0 && this.allPageDefsMap.has(this.contextSwitchingPageId)) {
            const firstOblNum = initialObligations[0][this.obligationIdentifierFieldName] as string;
            if (firstOblNum) {
                const contextSwitchResult = await this.forceProcessPageInternal(
                    this.contextSwitchingPageId,
                    { NoticeNumber: firstOblNum },
                    finalResult,
                    explicitlyTargetedFields,
                    Array.from(allRequiredFields),
                    "Initial Debtor Context"
                );
                if (contextSwitchResult?.augmentedFormDataFromPage) {
                    formDataForNextRequest = contextSwitchResult.augmentedFormDataFromPage;
                    this.log(`    Context switch page ${this.contextSwitchingPageId} provided form data for next request.`);
                }
            }
        }

        const preCollectableObligationFields = new Set<DataFieldName>();
        this.allPageDefinitions.forEach(pageDef => {
            if (pageDef.level === 'Debtor') {
                pageDef._optimiserFields?.forEach(fieldOnPage => {
                    const masterFieldDef = this.masterFieldDefsMap.get(fieldOnPage);
                    if (masterFieldDef && masterFieldDef.level === 'Obligation') {
                        preCollectableObligationFields.add(masterFieldDef.name);
                    }
                });
            }
        });


        // Phase 1: Debtor
        this.log("\n--- Phase 1: Debtor Data ---");
        let debtorIteration = 0;
        const visitedDebtorPages = new Set<PageId>();

        while (true) {
            debtorIteration++;
            const { fieldsForOptimiser: remainingDebtorFieldsForOptimiser, missingOverallTargets } = this.calculateRemainingFields(finalResult, "Debtor", explicitlyTargetedFields);

            // Use the new `allRequiredFields` set to correctly identify needed fields.
            const relevantPreCollectableFields = Array.from(preCollectableObligationFields)
                .filter(fieldName => allRequiredFields.has(fieldName)) // Correctly checks against direct and derived source fields
                .filter(fieldName =>
                    initialObligations.some(initialObl =>
                        !finalResult.a?.find(fa => fa[this.obligationIdentifierFieldName] === initialObl[this.obligationIdentifierFieldName])?.[fieldName]
                    )
                );


            const combinedDebtorPhaseTargets = Array.from(new Set([...remainingDebtorFieldsForOptimiser, ...relevantPreCollectableFields]));

            if (missingOverallTargets.length === 0 && relevantPreCollectableFields.length === 0) { this.log("All targeted Debtor and pre-collectable Obligation fields collected."); break; }
            this.log(`Debtor Iteration ${debtorIteration}: Targeting direct: ${combinedDebtorPhaseTargets.join(', ') || 'None'}. Missing overall (debtor-level): ${missingOverallTargets.join(', ')}`);

            if (combinedDebtorPhaseTargets.length === 0) {
                if (this.transformer && missingOverallTargets.length > 0) {
                    this.log("No direct Debtor fields for optimiser, attempting final derivations.");
                    const initialMissingCount = missingOverallTargets.length;
                    await this.transformer.deriveFields({ currentData: finalResult, level: "Debtor", masterFieldDefinitions: this.masterFieldDefinitions, explicitlyTargetedFields, derivationRegistry: derivationFunctionsRegistry, log: this.log });
                    const { missingOverallTargets: newMissingTargets } = this.calculateRemainingFields(finalResult, "Debtor", explicitlyTargetedFields);
                    if (newMissingTargets.length === initialMissingCount || newMissingTargets.length === 0) { this.log("Debtor derivation made no further progress or completed."); break; }
                } else { this.log("No more direct Debtor or pre-collectable fields, and no transformer progress. Breaking Debtor phase."); break; }
            }

            const optOutput = await this.optimiser.getOptimalPaths({
                targetFields: combinedDebtorPhaseTargets,
                allPageDefinitions: this.allPageDefinitions,
                collectedData: finalResult,
                masterFieldDefinitions: this.masterFieldDefinitions,
                pagesToExclude: Array.from(visitedDebtorPages)
            });

            if (!optOutput.pathsToVisit || optOutput.pathsToVisit.length === 0) { this.log("Optimiser found no more paths for Debtor phase targets."); break; }

            const path = optOutput.pathsToVisit[0];
            path.forEach(pageId => visitedDebtorPages.add(pageId));
            this.log(`    Processing Debtor path: ${path.join(' -> ')}`);
            let collectedThisPath = false;
            for (const pageId of path) {
                if (this.contextSwitchingPageId && pageId === this.contextSwitchingPageId) {
                    this.log(`    Skipping context page ${pageId} in Debtor path as it's usually handled upfront.`);
                    continue;
                }
                const pageDef = this.allPageDefsMap.get(pageId);
                if (!pageDef) { this.log(`            ERROR: PageDef ${pageId} not found.`); continue; }

                if (pageDef.level !== "Debtor") {
                    this.log(`            WARN: Skipping non-Debtor page ${pageId} in Debtor path.`);
                    continue;
                }

                const resolvedUrl = templateSubstitution(pageDef.url, { environment: this.environment, ...finalResult });
                const fieldsOnPageToExtract = pageDef.fields.map(f => ({ name: f.name, selector: f.selector, isList: f.isList }));
                const actualRequestMethod: 'GET' | 'POST' = (pageDef.method || ((pageDef.dependencies?.length > 0 || pageDef.dependencies?.some(d => d.literalParams?.length)) && formDataForNextRequest)) ? 'POST' : 'GET';

                const task = {
                    id: pageId,
                    url: resolvedUrl,
                    fields: fieldsOnPageToExtract,
                    requestMethod: actualRequestMethod,
                    formData: formDataForNextRequest,
                    pageDefForGetParsedContent: pageDef,
                    currentDataForStateFields: finalResult,
                    obligationIdentifierFieldNameForStateFields: this.obligationIdentifierFieldName
                } as PageExtractionTask;

                try {
                    const extractionResult = await (this.extractor as VIEWDataExtractor).fetchAndExtract(task);

                    let processedExtractionResult = extractionResult;
                    const obligationIdentifier = this.obligationIdentifierFieldName;

                    // This logic filters data from summary pages (e.g., DebtorObligationsSummary)
                    // It ensures we only integrate obligation data that matches the NoticeNumbers we are targeting.
                    if (pageDef.level === "Debtor" && extractionResult[obligationIdentifier] && Array.isArray(extractionResult[obligationIdentifier])) {
                        this.log(`            Filtering results from ${pageId} to match target NoticeNumbers...`);

                        const targetIds = new Set(initialObligations.map(o => o[obligationIdentifier]));
                        const extractedIds = extractionResult[obligationIdentifier] as string[];

                        const indicesToKeep: number[] = [];
                        extractedIds.forEach((id, index) => {
                            if (targetIds.has(id)) {
                                indicesToKeep.push(index);
                            }
                        });

                        // Only rewrite the result object if filtering actually removed something
                        if (indicesToKeep.length < extractedIds.length) {
                            const filteredResult: ExtractionOutput = {};
                            for (const key in extractionResult) {
                                // Ensure we only process own properties, not from prototype chain
                                if (Object.prototype.hasOwnProperty.call(extractionResult, key)) {
                                    const value = extractionResult[key as DataFieldName];
                                    if (Array.isArray(value)) {
                                        // Filter this array to only include elements at the matched indices
                                        filteredResult[key as DataFieldName] = indicesToKeep.map(i => value[i]);
                                    } else {
                                        // Copy non-array fields (like augmentedFormDataFromPage or single debtor fields) as-is
                                        (filteredResult as any)[key] = value;
                                    }
                                }
                            }
                            processedExtractionResult = filteredResult;
                            this.log(`            Filtered ${extractedIds.length} records down to ${indicesToKeep.length}.`);
                        } else {
                            this.log(`            No filtering needed, all ${extractedIds.length} extracted records are targeted.`);
                        }
                    }

                    const changed = await this.integrateData(processedExtractionResult, "Debtor", finalResult, undefined, explicitlyTargetedFields, combinedDebtorPhaseTargets);
                    if (changed) collectedThisPath = true;
                    formDataForNextRequest = processedExtractionResult.augmentedFormDataFromPage;

                } catch (e) { this.log(`        Error extracting from Debtor page ${pageId}: ${getErrorMessage(e)}`); }
            }
            if (this.transformer && collectedThisPath) {
                await this.transformer.deriveFields({ currentData: finalResult, level: "Debtor", masterFieldDefinitions: this.masterFieldDefinitions, explicitlyTargetedFields, derivationRegistry: derivationFunctionsRegistry, log: this.log });
            }
            if (!collectedThisPath && debtorIteration > 1 && optOutput.pathsToVisit.length <= 1 && combinedDebtorPhaseTargets.length > 0) { this.log("Stalemate in Debtor phase (no new data collected)."); break; }
            if (debtorIteration > this.allPageDefinitions.length + 5) { this.log("Debtor safety break (max iterations)."); break; }
        }

        // Phase 2: Obligations
        this.log("\n--- Phase 2: Obligation Data ---");
        // Loop through each obligation
        let obligationsCount = initialObligations.length;
        const obligationsCountFixed = initialObligations.length;
        setStorage("obligationsCountFixed", obligationsCountFixed);
        for (const /** Input obligation data. */  oblInput of initialObligations) {
            setStorage("obligationsCount", obligationsCount);
            obligationsCount--;
            /** Obligation number of the current obligation from the initialObligations input array.*/
            const oblNum = oblInput[this.obligationIdentifierFieldName] as string;
            if (!oblNum) { this.log("Skipping obligation with no identifier."); continue; }
            this.log(`\n    --- Processing Obligation: ${oblNum} ---`);

            /** Collected obligation data for the current obligation from the initialObligations input array. */
            let oblData = finalResult.a?.find(o => o[this.obligationIdentifierFieldName] === oblNum);
            if (!oblData) {
                oblData = { [this.obligationIdentifierFieldName]: oblNum };
                finalResult.a = [...(finalResult.a || []), oblData];
            }
            for (const /** Input obligation data field name. */ key in oblInput) {
                if (key !== this.obligationIdentifierFieldName && this.masterFieldDefsMap.has(key as DataFieldName)) {
                    oblData[key as DataFieldName] = oblInput[key as DataFieldName];
                    //        this.log(`            Pre-populated ${key} for ${oblNum} from input.`);
                }
            }

            formDataForNextRequest = undefined;

            if (this.transformer) {
                await this.transformer.deriveFields({ currentData: oblData, level: "Obligation", masterFieldDefinitions: this.masterFieldDefinitions, explicitlyTargetedFields, derivationRegistry: derivationFunctionsRegistry, log: this.log });
            }

            /** Set of visited pages to avoid reprocessing the same page in the current obligation path */
            const visitedPages = new Set<PageId>();

            if (this.contextSwitchingPageId && this.allPageDefsMap.has(this.contextSwitchingPageId)) {
                this.log(`        Processing context switch page ${this.contextSwitchingPageId} for Obligation ${oblNum}`);
                const contextSwitchResult = await this.forceProcessPageInternal(
                    this.contextSwitchingPageId,
                    { NoticeNumber: oblNum },
                    finalResult,
                    explicitlyTargetedFields,
                    Array.from(allRequiredFields),
                    `Obligation ${oblNum} Context`,
                    formDataForNextRequest
                );

                visitedPages.add(this.contextSwitchingPageId);
                this.log(`     Marked context page ${this.contextSwitchingPageId} as visited for this obligation.`);

                oblData = finalResult.a?.find(o => o[this.obligationIdentifierFieldName] === oblNum) || oblData;
                if (contextSwitchResult?.augmentedFormDataFromPage) {
                    formDataForNextRequest = contextSwitchResult.augmentedFormDataFromPage;
                    this.log(`        Context switch for Obligation ${oblNum} provided form data.`);
                }
            }

            let oblIteration = 0;
            // Loop until all explicitly specified fields for the obligation are collected or no more paths can be found.
            while (true) {
                oblIteration++;
                const { fieldsForOptimiser, missingOverallTargets } = this.calculateRemainingFields(oblData, "Obligation", explicitlyTargetedFields);
                // If all explicitly targeted fields are collected, break the loop and move to the next obligation.
                if (missingOverallTargets.length === 0) { this.log(`        All targeted Obligation fields for ${oblNum} collected.`); break; }
                this.log(`        Obligation ${oblNum} Iteration ${oblIteration}: Targeting direct: ${fieldsForOptimiser.join(', ') || 'None'}. Missing overall: ${missingOverallTargets.join(', ')}`);

                //If there are no more exposed fields for the optimiser to target, check if transformer can derive more fields.
                // If transformer is not available or no progress can be made, break the loop.
                if (fieldsForOptimiser.length === 0) {
                    if (this.transformer && missingOverallTargets.length > 0) {
                        const initialMissingCount = missingOverallTargets.length;
                        await this.transformer.deriveFields({ currentData: oblData, level: "Obligation", masterFieldDefinitions: this.masterFieldDefinitions, explicitlyTargetedFields, derivationRegistry: derivationFunctionsRegistry, log: this.log });
                        const { missingOverallTargets: newMissingTargets } = this.calculateRemainingFields(oblData, "Obligation", explicitlyTargetedFields);
                        if (newMissingTargets.length === initialMissingCount || newMissingTargets.length === 0) { this.log(`        Obligation ${oblNum} derivation made no further progress or completed.`); break; }
                    } else { this.log(`        No direct Obligation fields for ${oblNum} and no transformer, or no progress. Breaking.`); break; }
                }


                /** Optimal paths for the current obligation number. */
                const optOutput = await this.optimiser.getOptimalPaths({
                    targetFields: fieldsForOptimiser,
                    allPageDefinitions: this.allPageDefinitions,
                    collectedData: finalResult,
                    masterFieldDefinitions: this.masterFieldDefinitions,
                    pagesToExclude: Array.from(visitedPages)
                });
                if (!optOutput.pathsToVisit || optOutput.pathsToVisit.length === 0) { this.log(`        Optimiser found no paths for Obligation ${oblNum}.`); break; }

                const path = optOutput.pathsToVisit[0];
                this.log(`        All paths ${optOutput.pathsToVisit}`);

                this.log(`        Processing Obligation ${oblNum} path: ${path.join(' -> ')}`);
                let collectedThisPath = false;

                // Add all pages in the path to visited pages to avoid reprocessing.
                path.forEach(pageId => visitedPages.add(pageId));

                for (const pageId of path) {
                    if (this.contextSwitchingPageId && pageId === this.contextSwitchingPageId) {
                        this.log(`        Skipping context page ${pageId} in Obligation path as it's handled before the loop.`);
                        continue;
                    }
                    const pageDef = this.allPageDefsMap.get(pageId);
                    if (!pageDef) { this.log(`                ERROR: PageDef ${pageId} not found.`); continue; }
                    if (pageDef.level !== "Obligation" && pageDef.level !== "Debtor") {
                        this.log(`                WARN: Page ${pageId} (level ${pageDef.level}) in Obligation path for ${oblNum}. Ensure it's relevant.`);
                    }

                    /** Resolves the URL for the page definition, replacing any placeholders with actual values. */
                    const resolvedUrl = templateSubstitution(pageDef.url, { environment: this.environment, ...finalResult, ...oblData, NoticeNumber: oblNum });
                    const fieldsOnPageToExtract = pageDef.fields.map(f => ({ name: f.name, selector: f.selector, isList: f.isList }));

                    const actualRequestMethod: 'GET' | 'POST' = pageDef.method || ((pageDef.dependencies?.some(d => d.stateFields?.length || d.literalParams?.length) && formDataForNextRequest) ? 'POST' : 'GET');

                    let currentRequestPayload = formDataForNextRequest;
                    if (actualRequestMethod === 'POST' && !currentRequestPayload && pageDef.dependencies?.some(d => d.stateFields?.length || d.literalParams?.length)) {
                        this.log(`                WARN: POST to ${pageId} for Obligation ${oblNum} has dependencies but no prior form data. Sending empty body if not overridden by literals.`)
                        currentRequestPayload = new URLSearchParams();
                    }

                    const task: PageExtractionTask = {
                        id: pageId,
                        url: resolvedUrl,
                        fields: fieldsOnPageToExtract,
                        requestMethod: actualRequestMethod,
                        formData: currentRequestPayload,
                        pageDefForGetParsedContent: pageDef,
                        currentDataForStateFields: oblData,
                        currentObligationNumberForStateFields: oblNum,
                        obligationIdentifierFieldNameForStateFields: this.obligationIdentifierFieldName
                    };
                    try {
                        const extractionResult = await (this.extractor as VIEWDataExtractor).fetchAndExtract(task);
                        const changed = await this.integrateData(extractionResult, "Obligation", finalResult, oblNum, explicitlyTargetedFields, fieldsForOptimiser);
                        if (changed) collectedThisPath = true;
                        formDataForNextRequest = extractionResult.augmentedFormDataFromPage;
                    } catch (e) { this.log(`                Error extracting from ${pageId} for ${oblNum}: ${getErrorMessage(e)}`); }
                }
                if (this.transformer && collectedThisPath) {
                    await this.transformer.deriveFields({ currentData: oblData, level: "Obligation", masterFieldDefinitions: this.masterFieldDefinitions, explicitlyTargetedFields, derivationRegistry: derivationFunctionsRegistry, log: this.log });
                }
                if (optOutput.pathsToVisit.length === 0 && oblIteration > 1 && fieldsForOptimiser.length > 0) { this.log(`        Stalemate for Obligation ${oblNum}.`); break; }
                if (oblIteration > this.allPageDefinitions.length + 5) { this.log(`        Obligation ${oblNum} safety break.`); break; }
            }
        }

        this.log("\n--- Scraping Finished ---");
        return finalResult;
    }
}

// Example of how getData might be structured if it's outside a class
// This is just for context, assuming your chrome.runtime parts are elsewhere or integrated.
export async function getData(initialObligations: CollectedData[], targetFields: DataFieldName[] = defaultTargetFields, currentEnvironment: string, customLog: (message: string) => void) {
    // const targetFields: DataField[] = ["fullName", ...]; // Defined by caller or config

    // const currentEnvironment = 'djr'; // Passed as arg

    if (!Array.isArray(initialObligations)) {
        throw new Error("Initial Obligations must be a JSON array.");
    }

    const obligationIdKey = "NoticeNumber"; // Or from config
    if (initialObligations.some(obl => typeof obl[obligationIdKey] !== 'string')) {
        throw new Error(`Each object in Initial Obligations array must have an '${obligationIdKey}' string property.`);
    }
    if (!Array.isArray(targetFields) || !targetFields.every(f => typeof f === 'string')) {
        throw new Error(
            `Target Fields for this Run must be a JSON array of strings.
            The following fields were provided: ${JSON.stringify(targetFields)}`);
    }

    const optimiser = new SimpleOptimiser();
    // Ensure VIEWDataExtractor is instantiated correctly
    const extractor = new VIEWDataExtractor(currentEnvironment, customLog);

    const scraperConfig: ScraperConfig = {
        allPageDefinitions: pageDefinitions, // from import
        masterFieldDefinitions: allDataFields, // from import
        environment: currentEnvironment,
        contextSwitchingPageId: "NoticeDetails", // Example, make configurable
        obligationIdentifierFieldName: obligationIdKey
    };

    const scraper = new Scraper(
        optimiser,
        extractor,
        scraperConfig,
        customLog,
        new Transformer() // Instantiate transformer
    );

    return await scraper.scrape(
        initialObligations,
        targetFields
    );
}


