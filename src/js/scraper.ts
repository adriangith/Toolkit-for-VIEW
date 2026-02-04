import { allDataFields, derivationFunctionsRegistry, pageDefinitions } from "./config";
import { TargetFieldSet, AllPagesMap, PageId, OptimiserPageRepresentation, MasterPageDefinition, PathEntry, DataFieldName, DerivationLogicRegistry, ITransformer, TransformerInput, IDataExtractor, PageExtractionTask, ExtractionOutput, IOptimiser, OptimiserInput, OptimiserOutput, MasterFieldDefinition, ScraperConfig, CollectedData, DomSelector, DerivationFunction, RowMappingConfig, DataFieldSet } from "./types";
import { expandPageDefinitionsForOptimiser, getErrorMessage, setStorage, templateSubstitution } from "./utils";


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
        let derivedSomethingThisPass = false;
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

        for (const fieldDef of masterFieldDefinitions) {
            /** Key to use for the derivation registry */
            const keyForRegistry = (fieldDef.derivationKey || fieldDef.name) as DataFieldName;

            // Initial checks to see if we should attempt derivation for this field
            if (fieldDef.isDerived &&
                keyForRegistry &&
                fieldDef.name && // fieldDef.name is crucial for updating currentData and checking explicitlyTargetedFields
                fieldDef.level === level &&
                explicitlyTargetedFields.has(fieldDef.name as DataFieldName)) {

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
        fieldDef: MasterFieldDefinition, // DerivedFieldDefinition & { sourceFields?: SourcedFieldName[] },
        keyForRegistry: DataFieldName,
        currentData: CollectedData,
        derivationRegistry: DerivationLogicRegistry,
        log: (message: string, ...args: unknown[]) => void,
    ): Promise<boolean> | boolean {
        /** Name of the field being derived. */
        const fieldName = fieldDef.name as DataFieldName;
        const derivationFn = derivationRegistry[keyForRegistry];


        /** Flag indicating if any source fields are available in the current data. */
        const sourcesAvailable = fieldDef.sourceFields?.some(sf => Object.prototype.hasOwnProperty.call(currentData, sf));

        //if there is no derivationFn found but there is a single sourceField, default to attempting a copy of sourceField value to currentData[fieldName]
        if (sourcesAvailable && !derivationFn && fieldDef.sourceFields?.length === 1) {
            /** DataField from the field's sourceFields list. */
            const sourceField = fieldDef.sourceFields[0] as DataFieldName;
            const newValue = (currentData as Record<string, unknown>)[sourceField];
            const oldValue = (currentData as Record<string, unknown>)[fieldName];
            if (newValue !== oldValue) {
                (currentData as Record<string, unknown>)[fieldName] = newValue;
                return true;
            }
            return false;
        }

        if (!derivationFn) {
            return false;
        }

        if (!fieldDef.sourceFields) {
            // Proceed to execute, assuming it's a source-less derivation
            return this._executeDerivationFunction(fieldDef, keyForRegistry, derivationFn, currentData, log);
        }


        // If any of the dependent fields are avaliable, try and derive a value. Derivation functions must handle undefined values.
        if (sourcesAvailable) {
            return this._executeDerivationFunction(fieldDef, keyForRegistry, derivationFn, currentData, log);
        } else {
            return false;
        }
    }

    private async _executeDerivationFunction(
        fieldDef: MasterFieldDefinition,
        keyForRegistry: string,
        derivationFn: DerivationFunction,
        currentData: CollectedData,
        log: (message: string, ...args: unknown[]) => void
    ): Promise<boolean> {
        const fieldName = fieldDef.name as DataFieldName;
        try {

            /** Execute the derivation function and capture the derived value. */
            const derivedValue = await derivationFn(currentData);

            /** If a value was derived, update the current data and log the result. */
            if (derivedValue !== undefined) {
                if (derivedValue === null) {
                    if (Object.prototype.hasOwnProperty.call(currentData, fieldName)) {
                        delete (currentData as Record<string, unknown>)[fieldName];
                        log(`%c              Derived Field (Transformer) '${fieldName}' (key: '${keyForRegistry}'): DELETED (suppressed)`, 'color: orange');
                        return true;
                    }
                    return false;
                }

                const oldValue = (currentData as Record<string, unknown>)[fieldName];
                if (oldValue !== derivedValue) {
                    // Use type assertion to handle dynamic assignment to CollectedData
                    (currentData as Record<string, unknown>)[fieldName] = derivedValue as string | boolean | undefined;
                    log(`%c              Derived Field (Transformer) '${fieldName}' (key: '${keyForRegistry}'): ${JSON.stringify(derivedValue)}`, 'color: green');
                    return true;
                }
            }
            return false; // No value derived or undefined was returned intentionally
        } catch (e) {
            log(`              ERROR deriving field '${fieldName}' (key: '${keyForRegistry}') via registry: ${getErrorMessage(e)}`);
            return false;
        }
    }

    private _logFinalDerivationStatus(
        log: (message: string, ...args: unknown[]) => void,
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
    private log: (message: string, ...args: unknown[]) => void;
    private customFetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    private onPageFetched?: (url: string, content: string, pageId: string) => void;

    constructor(
        environment: string,
        log: (message: string, ...args: unknown[]) => void,
        options?: {
            customFetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
            onPageFetched?: (url: string, content: string, pageId: string) => void;
        }
    ) {
        this.environment = environment;
        this.domParser = new DOMParser();
        this.log = log;
        this.customFetch = options?.customFetch;
        this.onPageFetched = options?.onPageFetched;
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
            for (const dep of pageDef.dependencies) {
                if (dep.stateFields) {
                    for (const stateFieldName of dep.stateFields) {
                        const dataSource = relevantDataSourceForStateFields as Record<string, unknown>;
                        if (Object.prototype.hasOwnProperty.call(dataSource, stateFieldName)) {
                            const value = dataSource[stateFieldName];
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
            const formElement = parsedFullDoc.querySelector('form');
            // Safely handle form data extraction
            const embeddedFormData = new URLSearchParams();
            if (formElement) {
                const formData = new FormData(formElement);
                formData.forEach((value, key) => {
                    if (typeof value === 'string') {
                        embeddedFormData.append(key, value);
                    }
                });
            }
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
            /** Collection of rows from the lookup table. */
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

        /** Column identifier for the primary key. */
        const primaryIdentifierField = "NoticeNumber"; // This should be the key field

        // 2. Iterate through main data rows
        /** Collection of rows from the main data table. */
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
                    let value = '';
                    if (element) {
                        value = fieldConfig.node === 'title' ? element.getAttribute('title')?.trim() || '' : element.textContent?.trim() || '';
                    }
                    (extractedData[fieldName as DataFieldName] as string[]).push(value);
                }
            }

            // 3. Use the primaryId to get the value from the lookup map
            if (config.lookup) {
                const lookedUpValue = lookupMap.get(primaryId) || '';
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
            const formDataObj = Object.fromEntries(nextRequestClientState);
            this.log(`       Extractor: POSTing to ${task.url} with formData:`, formDataObj);
        } else if (fetchOptions.method === 'POST') {
            this.log(`       Extractor: POSTing to ${task.url} with empty body (no formData provided in task).`);
        }

        /** Get HTML page via fetch request */
        const fetchFn = this.customFetch || fetch;
        const pageEntryResponse = await fetchFn(task.url, fetchOptions);

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

        if (this.onPageFetched) {
            this.onPageFetched(task.url, pageEntryHtml, task.id);
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
            try {
                if (typeof field.selector === 'object' && 'type' in field.selector && field.selector.type === 'row-mapped') {
                    this.log(`       (Extractor) Using Row-Mapped extraction for page ${task.id}`);
                    const mappedData = this._extractMappedTableData(field.selector, parsedFullDoc);
                    // Merge the results into the main extractedData object
                    Object.assign(extractedData, mappedData);
                    // Since this one definition handles multiple fields, we can break the loop.
                    // This assumes one 'row-mapped' config per page.
                    break;
                } else {
                    this._extractSimpleField(field as { name: DataFieldName; selector: DomSelector; isList?: boolean; }, parsedFullDoc, extractedData, task.currentDataForStateFields);
                }
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
     * @param field The field definition
     * @param parsedFullDoc The parsed document
     * @param extractedData The output data object
     * @param currentData The current data object to check for existing values
     */
    private _extractSimpleField(field: { name: DataFieldName; selector: DomSelector; isList?: boolean; }, parsedFullDoc: Document, extractedData: ExtractionOutput, currentData?: CollectedData) {
        function extractXPathValue(result: XPathResult | null, selectorNode?: string): (string)[] {
            const ResultTypeConstant: Record<number, string> = {
                0: "ANY_TYPE", 1: "NUMBER_TYPE", 2: "STRING_TYPE", 3: "BOOLEAN_TYPE",
                4: "UNORDERED_NODE_ITERATOR_TYPE", 5: "ORDERED_NODE_ITERATOR_TYPE",
                6: "UNORDERED_NODE_SNAPSHOT_TYPE", 7: "ORDERED_NODE_SNAPSHOT_TYPE",
                8: "ANY_UNORDERED_NODE_TYPE", 9: "FIRST_ORDERED_NODE_TYPE"
            }
            if (!result) return [''];
            if (ResultTypeConstant[result.resultType] === 'STRING_TYPE' && result.stringValue.trim() !== '') return [result.stringValue];
            if (ResultTypeConstant[result.resultType] === 'UNORDERED_NODE_ITERATOR_TYPE') {
                const list = [];
                let node = result.iterateNext();
                while (node) {
                    if (node instanceof HTMLFormElement) {
                        list.push(node.value?.trim() || '')
                    } else if (node instanceof HTMLElement) {
                        list.push(selectorNode === 'title' ? node.title.trim() : node.textContent?.trim() || '')
                    }
                    node = result.iterateNext();
                }
                return list;
            }
            return [''];
        }

        let value: string | string[] | undefined;

        if (field.selector.type === "css") {
            if (field.isList) {
                const elements = parsedFullDoc.querySelectorAll(field.selector.value);
                value = Array.from(elements).map(el => {
                    const htmlEl = el as HTMLElement;
                    return field.selector.node === 'title' ? htmlEl.title?.trim() : htmlEl.textContent?.trim() || (htmlEl as HTMLInputElement).value?.trim() || '';
                });
            } else {
                const element = parsedFullDoc.querySelector(field.selector.value) as HTMLElement;
                if (element) {
                    value = field.selector.node === 'title' ? element.title?.trim() : element.textContent?.trim() || (element as HTMLInputElement).value?.trim();
                }
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
                value = valueInArray.length > 0 ? valueInArray[0] : undefined;
            }
        }


        if (value !== undefined && value !== '') {
            extractedData[field.name] = value;
            const isNew = !currentData || !Object.prototype.hasOwnProperty.call(currentData, field.name);
            if (isNew) {
                this.log(`%c               Extractor: Extracted '${field.name}': ${JSON.stringify(value)}`, 'color: green');
            } else {
                this.log(`               Extractor: Extracted '${field.name}': ${JSON.stringify(value)}`);
            }
        } else {
            this.log(`               Extractor: Selector for '${field.name}' (${field.selector.type}: ${field.selector.value}) found no data.`);
        }
    }

    private getDynamicFieldDataSource(pageDefBeingParsed: MasterPageDefinition, task: PageExtractionTask) {
        let relevantDataSourceForStateFieldsLogic: CollectedData = {};
        if (pageDefBeingParsed.level === "Debtor") {
            relevantDataSourceForStateFieldsLogic = task.currentDataForStateFields || {};
        } else {
            const globalData = task.currentDataForStateFields as CollectedData;
            // Fixed property names to match PageExtractionTask interface
            if (globalData?.a && task.currentObligationNumberForStateFields && task.obligationIdentifierFieldNameForStateFields) {
                relevantDataSourceForStateFieldsLogic = globalData.a.find(
                    (o: CollectedData) => {
                        const identifier = task.obligationIdentifierFieldNameForStateFields;
                        return identifier ? String((o as Record<string, unknown>)[identifier]) === String(task.currentObligationNumberForStateFields) : false;
                    }
                ) || {};
                if (!relevantDataSourceForStateFieldsLogic) {
                    const identifier = task.obligationIdentifierFieldNameForStateFields;
                    if (globalData && identifier && (globalData as Record<string, unknown>)[identifier] === task.currentObligationNumberForStateFields) {
                        relevantDataSourceForStateFieldsLogic = globalData;
                    } else {
                        this.log(`       (Extractor/fetchAndExtract) WARN: Obligation object for ${task.currentObligationNumberForStateFields} not found in currentData.a for stateField sourcing for page ${task.id}.`);
                    }
                }
            } else if (globalData && task.obligationIdentifierFieldNameForStateFields && (globalData as Record<string, unknown>)[task.obligationIdentifierFieldNameForStateFields] === task.currentObligationNumberForStateFields) {
                relevantDataSourceForStateFieldsLogic = globalData;
            } else {
                this.log(`       (Extractor/fetchAndExtract) WARN: Insufficient data to locate specific obligation for stateField sourcing for page ${task.id}. currentDataForStateFields might not be structured as expected or obligation identifiers missing.`);
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
            unreachableFields: Array.from(optimiserResult.unreachableFields)
        };
    }

    private findMinimalLoadSetInternal(targetFieldsSet: TargetFieldSet, allPagesMap: AllPagesMap, pagesToExclude: PageId[] | undefined) {
        const uncoveredFields = new Set(targetFieldsSet);
        const globallySelectedPages: Set<PageId> = new Set();
        const finalPaths = new Map<PageId, PageId[]>();

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
                if (pagesToExclude?.includes(pageId)) continue;
                if (globallySelectedPages.has(pageId)) continue;

                let currentCoveredFieldsCount = 0;
                pageDef.fields.forEach((field) => {
                    if (uncoveredFields.has(field)) currentCoveredFieldsCount++;
                });
                if (currentCoveredFieldsCount === 0) continue;

                try {
                    const { pagesInvolved: candidateTotalPagesInvolved } = getPagesInvolvedForCandidateEval(
                        pageId,
                        candidateMemo,
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
                } catch {
                    continue;
                }
            }

            if (bestCandidate.pageId === null || bestCandidate.coveredCount <= 0) break;

            const chosenPageId = bestCandidate.pageId;
            try {
                const pathToChosenPage = buildPathRecursive(chosenPageId, new Set());
                pathToChosenPage.forEach(p => globallySelectedPages.add(p));

                allPagesMap.forEach((pDef, pId) => {
                    if (globallySelectedPages.has(pId)) {
                        pDef.fields.forEach(field => uncoveredFields.delete(field));
                    }
                });

                pathToChosenPage.forEach(p => candidateMemo.delete(p));

            } catch (e) {
                console.error(`Optimiser: Error committing page ${chosenPageId} and its dependencies: ${(e instanceof Error ? e.message : String(e))}.`);
                break;
            }
        }

        const finalSelectedPaths = new Map<PageId, PageId[]>();
        globallySelectedPages.forEach(pageId => {
            if (finalPaths.has(pageId)) {
                finalSelectedPaths.set(pageId, finalPaths.get(pageId)!);
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

            const processedDependencies = def.dependencies.map((dep, index) => {
                if (typeof dep === 'object' && dep !== null && typeof dep.id === 'string') return dep.id;
                if (typeof dep === 'string') return dep;
                throw new Error(`Optimiser: Page ID "${def.id}" has invalid dependency structure at index ${index}. Expected {id: string} or string.`);
            }).filter(id => id);

            allPages.set(def.id, {
                id: def.id,
                fields: new Set((def._optimiserFields || def.fields.map((f) => f.name).filter(fName => fName)) as DataFieldName[]),
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

    private getOptimizedLoadDetails(
        rawPageDefinitions: MasterPageDefinition[],
        targetFieldStrings: DataFieldName[],
        pagesToExclude: PageId[] | undefined
    ) {
        const allPagesInternal: AllPagesMap = new Map();
        try {
            rawPageDefinitions.forEach(def => {
                const processedDependencies = def.dependencies.map(dep => {
                    if (typeof dep === 'object' && dep !== null && typeof dep.id === 'string') return dep.id;
                    if (typeof dep === 'string') return dep;
                    throw new Error(`Optimiser: Invalid dependency for page ${def.id} during internal processing.`);
                }).filter(id => id);

                allPagesInternal.set(def.id, {
                    id: def.id,
                    fields: new Set((def._optimiserFields || def.fields.map(f => f.name).filter(fName => fName)) as DataFieldName[]),
                    dependencies: processedDependencies
                });
            });
        } catch (e) {
            console.error("Optimiser: Error processing raw page definitions:", getErrorMessage(e));
            throw e;
        }

        const targetFields = new Set(targetFieldStrings.map(f => f.trim()).filter(f => f));

        if (targetFields.size === 0) {
            return { minimalTraversals: [], pagesToLoad: new Set<PageId>(), numberOfLoads: 0, unreachableFields: new Set<DataFieldName>() };
        }
        if (allPagesInternal.size === 0) {
            return { minimalTraversals: [], pagesToLoad: new Set<PageId>(), numberOfLoads: 0, unreachableFields: new Set<DataFieldName>(Array.from(targetFields).sort() as DataFieldName[]) };
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


export class Scraper {
    private optimiser: IOptimiser;
    private extractor: IDataExtractor;
    private transformer?: ITransformer;
    private allPageDefinitions: MasterPageDefinition[];
    private masterFieldDefinitions: MasterFieldDefinition[];
    private allPageDefsMap: Map<PageId, MasterPageDefinition>;
    private masterFieldDefsMap: Map<DataFieldName, MasterFieldDefinition>;
    private environment: string;
    private obligationIdentifierFieldName: DataFieldName;
    private contextSwitchingPageId?: PageId;
    private log: (message: string, ...args: unknown[]) => void;

    constructor(
        optimiser: IOptimiser,
        extractor: IDataExtractor,
        config: ScraperConfig,
        logFunction: (message: string, ...args: unknown[]) => void,
        transformer?: ITransformer,
    ) {
        this.optimiser = optimiser;
        this.extractor = extractor;
        this.transformer = transformer;
        this.allPageDefinitions = expandPageDefinitionsForOptimiser(config.allPageDefinitions);
        this.masterFieldDefinitions = config.masterFieldDefinitions;
        this.allPageDefsMap = new Map(this.allPageDefinitions.map(p => [p.id, p]));
        this.masterFieldDefsMap = new Map(config.masterFieldDefinitions.map(f => [f.name as DataFieldName, f]));
        this.environment = config.environment;
        this.obligationIdentifierFieldName = config.obligationIdentifierFieldName || "NoticeNumber";
        this.contextSwitchingPageId = config.contextSwitchingPageId;
        this.log = logFunction;
    }

    /**
     * Returns the required fields that are still missing from the current data object
     */
    private calculateRemainingFields(
        currentDataObject: CollectedData,
        level: "Debtor" | "Obligation",
        explicitlyTargetedFields: DataFieldName[]
    ): {
        fieldsForOptimiser: DataFieldName[],
        missingOverallTargets: DataFieldName[]
    } {
        const fieldsForOptimiser = new Set<DataFieldName>();
        const missingOverallTargets: DataFieldName[] = [];

        // Clean up data based on conditions for all present fields, not just targets
        for (const key in currentDataObject) {
            if (!Object.prototype.hasOwnProperty.call(currentDataObject, key)) continue;
            const fieldDef = this.masterFieldDefsMap.get(key as DataFieldName);
            if (fieldDef && fieldDef.level === level && fieldDef.condition && fieldDef.condition(currentDataObject)) {
                delete (currentDataObject as Record<string, unknown>)[key];
                this.log(`    Removed field '${key}' from data because condition evaluated to skip.`);
            }
        }

        for (const targetName of explicitlyTargetedFields) {
            const fieldDef = this.masterFieldDefsMap.get(targetName);
            if (!fieldDef || fieldDef.level !== level) continue;

            if (fieldDef.condition && fieldDef.condition(currentDataObject)) {
                continue;
            }

            const isMissing = !Object.prototype.hasOwnProperty.call(currentDataObject, targetName);

            if (isMissing) {
                missingOverallTargets.push(targetName);
            }

            if (isMissing) {
                fieldsForOptimiser.add(targetName);
            }

            if (fieldDef.isDerived && fieldDef.sourceFields) {
                if (isMissing) {
                    for (const sourceFieldName of fieldDef.sourceFields) {
                        const sourceFieldDef = this.masterFieldDefsMap.get(sourceFieldName as DataFieldName);
                        if (sourceFieldDef &&
                            sourceFieldDef.level === level &&
                            !Object.prototype.hasOwnProperty.call(currentDataObject, sourceFieldName) &&
                            !sourceFieldDef.isDerived) {
                            fieldsForOptimiser.add(sourceFieldName as DataFieldName);
                        }
                    }
                }
            }
        }

        return {
            fieldsForOptimiser: Array.from(fieldsForOptimiser),
            missingOverallTargets
        };
    }

    private async integrateData(
        extractedData: ExtractionOutput,
        pageLevel: "Debtor" | "Obligation",
        finalResult: CollectedData,
        currentObligationNumber: string | undefined,
        explicitlyTargetedFields: Set<DataFieldName>,
        optimiserTargetedDirectFields?: string[]
    ): Promise<boolean> {
        let dataActuallyAddedToTargets = false;
        const targetObj = finalResult as Record<string, unknown>;

        for (const fieldName in extractedData) {
            if (fieldName === 'augmentedFormDataFromPage') continue;

            const masterFieldDef = this.masterFieldDefsMap.get(fieldName as DataFieldName);
            if (!masterFieldDef) continue;

            const value = extractedData[fieldName as DataFieldName];

            if (masterFieldDef.level === "Debtor") {
                // Check if the field should be skipped based on its condition
                if (masterFieldDef.condition && masterFieldDef.condition(finalResult)) {
                    continue;
                }
                if (!Object.prototype.hasOwnProperty.call(targetObj, fieldName)) {
                    if (Array.isArray(value)) {
                        if (value.length > 0) {
                            targetObj[fieldName] = value[0] as string | boolean | undefined;
                        }
                    } else {
                        targetObj[fieldName] = value as string | boolean | undefined;
                    }
                    if (explicitlyTargetedFields.has(fieldName as DataFieldName) || optimiserTargetedDirectFields?.includes(fieldName)) {
                        dataActuallyAddedToTargets = true;
                    }
                }
            } else if (masterFieldDef.level === "Obligation") {
                if (currentObligationNumber) {
                    let oblObj = finalResult.a?.find(o => String((o as Record<string, unknown>)[this.obligationIdentifierFieldName]) === currentObligationNumber) as Record<string, unknown> | undefined;
                    if (!oblObj) {
                        oblObj = { [this.obligationIdentifierFieldName]: currentObligationNumber };
                        finalResult.a = [...(finalResult.a || []), oblObj as unknown as CollectedData];
                    }

                    // Check condition against the specific obligation data merged with debtor data
                    if (masterFieldDef.condition && masterFieldDef.condition({ ...finalResult, ...oblObj })) {
                        continue;
                    }

                    if (!Object.prototype.hasOwnProperty.call(oblObj, fieldName)) {
                        if (!Array.isArray(value)) {
                            oblObj[fieldName] = value as string | boolean | undefined;
                            if (explicitlyTargetedFields.has(fieldName as DataFieldName) || optimiserTargetedDirectFields?.includes(fieldName)) {
                                dataActuallyAddedToTargets = true;
                            }
                        }
                    }
                } else if (pageLevel === "Debtor" && Array.isArray(value) && Array.isArray(extractedData[this.obligationIdentifierFieldName as DataFieldName])) {
                    const idArray = extractedData[this.obligationIdentifierFieldName as DataFieldName] as string[];
                    idArray.forEach((oblNum, idx) => {
                        let targetObligation = finalResult.a?.find(o => String((o as Record<string, unknown>)[this.obligationIdentifierFieldName]) === String(oblNum)) as Record<string, unknown> | undefined;
                        if (!targetObligation) {
                            targetObligation = { [this.obligationIdentifierFieldName]: oblNum };
                            finalResult.a = [...(finalResult.a || []), targetObligation as unknown as CollectedData];
                        }

                        // Check condition for this specific obligation
                        if (masterFieldDef.condition && masterFieldDef.condition({ ...finalResult, ...targetObligation })) {
                            return; // Skip this obligation in the forEach loop
                        }

                        const sourceArray = extractedData[fieldName as DataFieldName];
                        if (targetObligation && Array.isArray(sourceArray) && !Object.prototype.hasOwnProperty.call(targetObligation, fieldName) && sourceArray.length > idx) {
                            const valueForObligation = sourceArray[idx];
                            if (valueForObligation !== null && valueForObligation !== undefined && !Array.isArray(valueForObligation)) {
                                targetObligation[fieldName] = valueForObligation as string | boolean | undefined;
                                if (explicitlyTargetedFields.has(fieldName as DataFieldName) || optimiserTargetedDirectFields?.includes(fieldName)) {
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

    private async forceProcessPageInternal(
        pageId: PageId,
        context: { NoticeNumber?: string },
        finalResult: CollectedData,
        explicitlyTargetedFields: Set<DataFieldName>,
        allRequiredFields: DataFieldName[],
        logContext: string,
        initialFormDataForRequest?: URLSearchParams
    ): Promise<(ExtractionOutput & { augmentedFormDataFromPage?: URLSearchParams }) | undefined> {
        const pageDef = this.allPageDefsMap.get(pageId);
        if (!pageDef) return undefined;

        const fieldsOnPage = pageDef._optimiserFields || [];
        let currentDataToCheck: CollectedData | undefined;
        if (pageDef.level === "Debtor") {
            currentDataToCheck = finalResult;
        } else if (context.NoticeNumber) {
            currentDataToCheck = finalResult.a?.find(o => String((o as Record<string, unknown>)[this.obligationIdentifierFieldName]) === context.NoticeNumber);
        }

        const relevantTargets = fieldsOnPage.filter(f => {
            if (!explicitlyTargetedFields.has(f as DataFieldName)) return false;
            if (currentDataToCheck && Object.prototype.hasOwnProperty.call(currentDataToCheck, f)) return false;
            return true;
        });

        const reason = relevantTargets.length > 0 ? `(for ${relevantTargets.join(', ')})` : `(${logContext})`;
        this.log(`    Force-processing page: ${pageId} ${reason}`);

        const resolvedUrl = templateSubstitution(pageDef.url, { environment: this.environment, ...context });
        const fieldsOnPageToExtract = pageDef.fields.map(f => ({ name: f.name, selector: f.selector, isList: f.isList }));
        const requestMethodForForceProcess: 'GET' | 'POST' = initialFormDataForRequest ? 'POST' : (pageDef.method || 'GET');

        let dataSourceForStateFields: CollectedData | undefined;
        if (pageDef.level === "Debtor") {
            dataSourceForStateFields = finalResult;
        } else if (context.NoticeNumber) {
            dataSourceForStateFields = finalResult.a?.find(o => String((o as Record<string, unknown>)[this.obligationIdentifierFieldName]) === context.NoticeNumber) || {};
        } else {
            dataSourceForStateFields = finalResult;
        }

        try {
            // Using a safe cast to avoid ESLint warnings while fixing property mismatches
            const extractionResult = await (this.extractor as VIEWDataExtractor).fetchAndExtract({
                ...pageDef,
                id: pageId,
                url: resolvedUrl,
                fields: fieldsOnPageToExtract,
                requestMethod: requestMethodForForceProcess,
                formData: initialFormDataForRequest,
                pageDefForGetParsedContent: pageDef,
                currentDataForStateFields: dataSourceForStateFields,
                currentObligationNumberForStateFields: context.NoticeNumber,
                obligationIdentifierFieldNameForStateFields: this.obligationIdentifierFieldName
            });

            await this.integrateData(extractionResult, pageDef.level, finalResult, context.NoticeNumber, explicitlyTargetedFields);

            if (this.transformer) {
                const dataObjectToTransform = pageDef.level === "Debtor" ?
                    finalResult :
                    finalResult.a?.find(o => String((o as Record<string, unknown>)[this.obligationIdentifierFieldName]) === context.NoticeNumber);

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
     */
    public async scrape(
        inputObligationData: CollectedData[],
        explicitlyTargetedFields: Set<DataFieldName>
    ): Promise<CollectedData> {
        // Fix: Cast to handle structural mismatch during initialization
        const finalResult: CollectedData = { a: [] as unknown as CollectedData[] } as CollectedData;

        // Pre-populate finalResult with inputObligationData so transformer can use it immediately
        inputObligationData.forEach(obl => {
            if (finalResult.a) finalResult.a.push({ ...obl });
        });

        this.log(`--- Scraping Started (Env: ${this.environment}) ---`);
        this.log(`Input Data:`, inputObligationData);

        const workingTargets = new Set(explicitlyTargetedFields);
        this.log(`Targeting fields: ${Array.from(workingTargets).join(', ')}`);

        const expandedTargetFields = this.deriveDependentFields(new Set(workingTargets));

        if (this.transformer) this.log("Derived fields processing is ENABLED.");

        // Run transformer on initial data to derive fields like challenge_code before pathfinding
        if (this.transformer && finalResult.a) {
            for (const obl of finalResult.a) {
                await this.transformer.deriveFields({
                    currentData: obl,
                    level: "Obligation",
                    masterFieldDefinitions: this.masterFieldDefinitions,
                    explicitlyTargetedFields: expandedTargetFields,
                    derivationRegistry: derivationFunctionsRegistry,
                    log: this.log
                });
            }
        }

        let formDataForNextRequest: URLSearchParams | undefined = undefined;

        const allDebtorPageObligationFields: DataFieldSet = this.getDebtorLevelObligationFields();

        // Phase 1: Debtor
        this.log("\n--- Phase 1: Debtor Data ---");
        let debtorIteration = 0;
        const visitedDebtorPages = new Set<PageId>();

        while (true) {
            debtorIteration++;
            const { fieldsForOptimiser: remainingDebtorFieldsForOptimiser, missingOverallTargets } =
                this.calculateRemainingFields(finalResult, "Debtor", Array.from(expandedTargetFields));

            const relevantPreCollectableFields = Array.from(allDebtorPageObligationFields)
                .filter(fieldName => expandedTargetFields.has(fieldName))
                .filter(fieldName =>
                    inputObligationData.some(initialObl => {
                        const existing = finalResult.a?.find(fa => String((fa as Record<string, unknown>)[this.obligationIdentifierFieldName]) === String((initialObl as Record<string, unknown>)[this.obligationIdentifierFieldName])) as Record<string, unknown> | undefined;
                        return existing ? !Object.prototype.hasOwnProperty.call(existing, fieldName) : true;
                    })
                );

            const combinedDebtorPhaseTargets = Array.from(new Set([...remainingDebtorFieldsForOptimiser, ...relevantPreCollectableFields]));

            if (missingOverallTargets.length === 0 && relevantPreCollectableFields.length === 0) {
                this.log("All targeted Debtor and pre-collectable Obligation fields collected.");
                break;
            }

            this.log(`Debtor Iteration ${debtorIteration}: Targeting direct: ${combinedDebtorPhaseTargets.join(', ') || 'None'}. Missing overall (debtor-level): ${missingOverallTargets.join(', ')}`);

            if (combinedDebtorPhaseTargets.length === 0) {
                if (this.transformer && missingOverallTargets.length > 0) {
                    const initialMissingCount = missingOverallTargets.length;
                    await this.transformer.deriveFields({
                        currentData: finalResult, level: "Debtor", masterFieldDefinitions: this.masterFieldDefinitions, explicitlyTargetedFields: expandedTargetFields, derivationRegistry: derivationFunctionsRegistry, log: this.log
                    });
                    const { missingOverallTargets: newMissingTargets } = this.calculateRemainingFields(finalResult, "Debtor", Array.from(expandedTargetFields));
                    if (newMissingTargets.length === initialMissingCount || newMissingTargets.length === 0) break;
                } else { break; }
            }

            const optOutput = await this.optimiser.getOptimalPaths({
                targetFields: combinedDebtorPhaseTargets,
                allPageDefinitions: this.allPageDefinitions,
                collectedData: finalResult,
                masterFieldDefinitions: this.masterFieldDefinitions,
                pagesToExclude: Array.from(visitedDebtorPages)
            });

            if (!optOutput.pathsToVisit || optOutput.pathsToVisit.length === 0) break;

            const paths = optOutput.pathsToVisit;
            let collectedAnyPath = false;

            await Promise.all(paths.map(async (path) => {
                path.forEach(pageId => visitedDebtorPages.add(pageId));

                const pathWithReasons = path.map(pageId => {
                    const pageDef = this.allPageDefsMap.get(pageId);
                    if (!pageDef) return `${pageId} (Unknown)`;
                    const fieldsOnPage = pageDef._optimiserFields || [];
                    const relevantTargets = fieldsOnPage.filter(f => combinedDebtorPhaseTargets.includes(f as DataFieldName));
                    if (relevantTargets.length > 0) {
                        return `${pageId} (for ${relevantTargets.join(', ')})`;
                    }
                    return `${pageId} (dependency)`;
                }).join(' -> ');
                this.log(`    Processing Debtor path: ${pathWithReasons}`);

                let pathFormData = formDataForNextRequest;

                for (const pageId of path) {
                    const pageDef = this.allPageDefsMap.get(pageId);
                    if (!pageDef || pageDef.level !== "Debtor") continue;

                    if (pageDef.condition && !pageDef.condition(finalResult)) {
                        this.log(`    Skipping Debtor page ${pageId} due to condition.`);
                        continue;
                    }

                    const resolvedUrl = templateSubstitution(pageDef.url, { environment: this.environment, ...finalResult });
                    const fieldsOnPageToExtract = pageDef.fields.map(f => ({ name: f.name, selector: f.selector, isList: f.isList }));
                    const actualRequestMethod = (pageDef.method || (pageDef.dependencies?.length > 0 && pathFormData)) ? 'POST' : 'GET';

                    const task = {
                        ...pageDef,
                        id: pageId,
                        url: resolvedUrl,
                        fields: fieldsOnPageToExtract,
                        requestMethod: actualRequestMethod,
                        formData: pathFormData,
                        pageDefForGetParsedContent: pageDef,
                        currentDataForStateFields: finalResult,
                        obligationIdentifierFieldNameForStateFields: this.obligationIdentifierFieldName
                    } as PageExtractionTask;

                    try {
                        const extractionResult = await (this.extractor as VIEWDataExtractor).fetchAndExtract(task);
                        let processedResult = extractionResult;
                        if (extractionResult[this.obligationIdentifierFieldName] && Array.isArray(extractionResult[this.obligationIdentifierFieldName])) {
                            const targetIds = new Set(inputObligationData.map(o => (o as Record<string, unknown>)[this.obligationIdentifierFieldName]));
                            const extractedIds = extractionResult[this.obligationIdentifierFieldName] as string[];
                            const indicesToKeep = extractedIds.map((id, i) => targetIds.has(id) ? i : -1).filter(i => i !== -1);

                            if (indicesToKeep.length < extractedIds.length) {
                                const filtered: ExtractionOutput = {};
                                for (const key in extractionResult) {
                                    if (key === 'augmentedFormDataFromPage') continue;
                                    const val = extractionResult[key as DataFieldName];
                                    filtered[key as DataFieldName] = Array.isArray(val) ? indicesToKeep.map(i => val[i]) : val;
                                }
                                processedResult = filtered;
                            }
                        }

                        const changed = await this.integrateData(processedResult, "Debtor", finalResult, undefined, expandedTargetFields, combinedDebtorPhaseTargets);
                        if (changed) collectedAnyPath = true;
                        pathFormData = (processedResult as Record<string, unknown>).augmentedFormDataFromPage as URLSearchParams | undefined;
                    } catch (e) {
                        this.log(`    Error extracting from Debtor page ${pageId}: ${getErrorMessage(e)}`);
                    }
                }
            }));

            if (this.transformer && collectedAnyPath) {
                await this.transformer.deriveFields({
                    currentData: finalResult, level: "Debtor", masterFieldDefinitions: this.masterFieldDefinitions, explicitlyTargetedFields: expandedTargetFields, derivationRegistry: derivationFunctionsRegistry, log: this.log
                });

                // Also derive obligation fields, as Debtor pages might have populated obligation data (e.g. via row-mapped tables)
                if (finalResult.a) {
                    for (const obl of finalResult.a) {
                        await this.transformer.deriveFields({
                            currentData: obl,
                            level: "Obligation",
                            masterFieldDefinitions: this.masterFieldDefinitions,
                            explicitlyTargetedFields: expandedTargetFields,
                            derivationRegistry: derivationFunctionsRegistry,
                            log: this.log
                        });
                    }
                }
            }
            if (debtorIteration > this.allPageDefinitions.length + 5) break;
        }

        // Phase 2: Obligations
        this.log("\n--- Phase 2: Obligation Data ---");

        let obligationsCount = inputObligationData.length;
        setStorage("obligationsCount", obligationsCount);

        for (const oblInput of inputObligationData) {
            // Update storage for the progress bar
            obligationsCount--;
            setStorage("obligationsCount", obligationsCount);

            const oblNum = (oblInput as Record<string, unknown>)[this.obligationIdentifierFieldName] as string;
            if (!oblNum) continue;

            this.log(`\n    --- Processing Obligation: ${oblNum} ---`);
            // Check if obligation object already exists (it should, from initialization)
            let oblData = finalResult.a?.find(o => String((o as Record<string, unknown>)[this.obligationIdentifierFieldName]) === oblNum);
            if (!oblData) {
                const newObl = { [this.obligationIdentifierFieldName]: oblNum } as unknown as CollectedData;
                if (finalResult.a) finalResult.a.push(newObl); else finalResult.a = [newObl];
                oblData = newObl;
            }

            for (const key in oblInput) {
                if (this.masterFieldDefsMap.has(key as DataFieldName)) {
                    (oblData as Record<string, unknown>)[key] = (oblInput as Record<string, unknown>)[key];
                }
            }

            const { missingOverallTargets: initialMissingTargets } = this.calculateRemainingFields(oblData!, "Obligation", Array.from(expandedTargetFields));
            if (initialMissingTargets.length === 0) {
                this.log(`    Skipping Obligation ${oblNum}: All targets already collected.`);
                continue;
            }

            formDataForNextRequest = undefined;
            const visitedPages = new Set<PageId>();

            if (this.contextSwitchingPageId) {
                const contextResult = await this.forceProcessPageInternal(
                    this.contextSwitchingPageId, { NoticeNumber: oblNum }, finalResult, expandedTargetFields, Array.from(expandedTargetFields), `Context Switch`
                );
                visitedPages.add(this.contextSwitchingPageId);
                if (contextResult?.augmentedFormDataFromPage) formDataForNextRequest = contextResult.augmentedFormDataFromPage;
            }

            let oblIteration = 0;
            while (true) {
                oblIteration++;
                const { fieldsForOptimiser, missingOverallTargets } = this.calculateRemainingFields(oblData!, "Obligation", Array.from(expandedTargetFields));

                if (missingOverallTargets.length === 0) break;

                if (fieldsForOptimiser.length === 0) {
                    if (this.transformer) {
                        await this.transformer.deriveFields({
                            currentData: oblData!, level: "Obligation", masterFieldDefinitions: this.masterFieldDefinitions, explicitlyTargetedFields: expandedTargetFields, derivationRegistry: derivationFunctionsRegistry, log: this.log
                        });
                        const { missingOverallTargets: newMissing } = this.calculateRemainingFields(oblData!, "Obligation", Array.from(expandedTargetFields));
                        if (newMissing.length === missingOverallTargets.length) break;
                        continue;
                    }
                    break;
                }

                const optOutput = await this.optimiser.getOptimalPaths({
                    targetFields: fieldsForOptimiser, allPageDefinitions: this.allPageDefinitions.filter(p => p.level === "Obligation"), collectedData: finalResult, masterFieldDefinitions: this.masterFieldDefinitions, pagesToExclude: Array.from(visitedPages)
                });

                if (!optOutput.pathsToVisit?.length) break;

                const paths = optOutput.pathsToVisit;
                let collectedAnyPath = false;

                await Promise.all(paths.map(async (path) => {
                    path.forEach(p => visitedPages.add(p));

                    const pathWithReasons = path.map(pageId => {
                        const pageDef = this.allPageDefsMap.get(pageId);
                        if (!pageDef) return `${pageId} (Unknown)`;
                        const fieldsOnPage = pageDef._optimiserFields || [];
                        const relevantTargets = fieldsOnPage.filter(f => fieldsForOptimiser.includes(f as DataFieldName));
                        if (relevantTargets.length > 0) {
                            return `${pageId} (for ${relevantTargets.join(', ')})`;
                        }
                        return `${pageId} (dependency)`;
                    }).join(' -> ');
                    this.log(`    Processing Obligation path: ${pathWithReasons}`);

                    let pathFormData = formDataForNextRequest;

                    for (const pageId of path) {
                        if (pageId === this.contextSwitchingPageId) continue;
                        const pageDef = this.allPageDefsMap.get(pageId);
                        if (!pageDef) continue;

                        if (pageDef.condition && !pageDef.condition({ ...finalResult, ...oblData })) {
                            this.log(`    Skipping Obligation page ${pageId} due to condition.`);
                            continue;
                        }

                        const task: PageExtractionTask = {
                            ...pageDef,
                            id: pageId,
                            url: templateSubstitution(pageDef.url, { environment: this.environment, ...finalResult, ...oblData, NoticeNumber: oblNum }),
                            fields: pageDef.fields.map(f => ({ name: f.name, selector: f.selector, isList: f.isList })),
                            requestMethod: pageDef.method || ((pageDef.dependencies?.length > 0 && pathFormData) ? 'POST' : 'GET'),
                            formData: pathFormData,
                            pageDefForGetParsedContent: pageDef,
                            currentDataForStateFields: oblData!,
                            currentObligationNumberForStateFields: oblNum,
                            obligationIdentifierFieldNameForStateFields: this.obligationIdentifierFieldName
                        };

                        try {
                            const extractionResult = await (this.extractor as VIEWDataExtractor).fetchAndExtract(task);
                            const changed = await this.integrateData(extractionResult, "Obligation", finalResult, oblNum, expandedTargetFields, fieldsForOptimiser);
                            if (changed) collectedAnyPath = true;
                            pathFormData = (extractionResult as Record<string, unknown>).augmentedFormDataFromPage as URLSearchParams | undefined;
                        } catch (e) {
                            this.log(`    Error extracting from ${pageId}: ${getErrorMessage(e)}`);
                        }
                    }
                }));

                if (this.transformer && collectedAnyPath) {
                    await this.transformer.deriveFields({
                        currentData: oblData!, level: "Obligation", masterFieldDefinitions: this.masterFieldDefinitions, explicitlyTargetedFields: expandedTargetFields, derivationRegistry: derivationFunctionsRegistry, log: this.log
                    });
                }
                if (oblIteration > this.allPageDefinitions.length + 5) break;
            }
        }

        this.log("\n--- Scraping Finished ---");
        return finalResult;
    }

    private getDebtorLevelObligationFields(): DataFieldSet {
        const fields = new Set<DataFieldName>();
        this.allPageDefinitions.forEach(p => {
            if (p.level === 'Debtor') {
                const fieldNames = p._optimiserFields || p.fields.map(f => f.name);
                fieldNames.forEach(fName => {
                    const def = this.masterFieldDefsMap.get(fName as DataFieldName);
                    if (def?.level === 'Obligation') fields.add(def.name as DataFieldName);
                });
            }
        });
        return fields;
    }

    private deriveDependentFields(targetFields: Set<DataFieldName>): Set<DataFieldName> {
        let addedNew;
        do {
            addedNew = false;
            targetFields.forEach(fieldName => {
                const fieldDef = this.masterFieldDefsMap.get(fieldName);
                if (fieldDef?.isDerived && fieldDef.sourceFields) {
                    fieldDef.sourceFields.forEach(source => {
                        if (!targetFields.has(source as DataFieldName)) {
                            targetFields.add(source as DataFieldName);
                            addedNew = true;
                        }
                    });
                }
            });
        } while (addedNew);
        this.log(`Expanded targets to include source fields: ${Array.from(targetFields).join(', ')}`);
        return targetFields;
    }
}

export async function getData(
    initialObligations: CollectedData[],
    targetFields: Set<DataFieldName> | DataFieldName[] = [],
    currentEnvironment: string,
    customLog: (message: string, ...args: unknown[]) => void,
    options?: { customFetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>; onPageFetched?: (url: string, content: string, pageId: string) => void; }
) {
    const obligationsCountFixed = initialObligations.length;
    setStorage("obligationsCountFixed", obligationsCountFixed);
    setStorage("obligationsCount", obligationsCountFixed - 0.5);

    if (!Array.isArray(initialObligations)) throw new Error("Initial Obligations must be a JSON array.");

    const obligationIdKey = "NoticeNumber" as DataFieldName;
    if (initialObligations.some(obl => typeof (obl as Record<string, unknown>)[obligationIdKey] !== 'string')) {
        throw new Error(`Each object in Initial Obligations array must have an '${obligationIdKey}' string property.`);
    }

    let validatedTargets: Set<DataFieldName>;
    if (targetFields instanceof Set) {
        validatedTargets = targetFields;
    } else if (Array.isArray(targetFields)) {
        validatedTargets = new Set(targetFields);
    } else {
        // Handle unexpected input by defaulting to all fields or a known safe subset
        validatedTargets = new Set(allDataFields.map(f => f.name as DataFieldName));
    }

    if (validatedTargets.size === 0) {
        throw new Error(`Target Fields validation failed. No fields targeted.`);
    }

    const scraper = new Scraper(
        new SimpleOptimiser(),
        new VIEWDataExtractor(currentEnvironment, customLog, options),
        {
            allPageDefinitions: pageDefinitions,
            masterFieldDefinitions: allDataFields,
            environment: currentEnvironment,
            contextSwitchingPageId: "NoticeDetails" as PageId,
            obligationIdentifierFieldName: obligationIdKey
        },
        customLog,
        new Transformer()
    );

    return await scraper.scrape(initialObligations, validatedTargets);
}