import { Table } from "@tanstack/react-table";
import { VIEWObligationListHeadings } from "./obligations";
import { OptionsResult } from "./xlsxConverter";
import { allDataFields, pageDefinitions } from "./config";
import { afterAction, BulkActionProperties, CollectedData, DerivedFieldName, ExtractedFieldName, Properties, urlParamsType } from "./types";

export type ObligationPreviewProcess = <T extends Message>(message: T, sender: chrome.runtime.MessageSender, sendResponse: (response?: WDPResponse) => void) => void | boolean;
interface SuccessResponse {
    type: "success";
    data: CollectedData[] | boolean;
}
export interface ErrorResponse {
    type: "error";
    error: string;
}

export type WDPResponse = SuccessResponse | ErrorResponse;

export interface backgroundData {
    type: "generateCorrespondence" | 'prepareCorrespondenceData';
    data: {
        obligations?: CollectedData[];
        VIEWEnvironment?: string;
        selectedCorrespondenceAttributes?: OptionsResult;
        IsEmail?: boolean;
        dataSet?: CollectedData;
        documentTemplateProperties: TemplateSheetRecord[];
        targetFields?: DataFieldArray
        debtorId?: string;
    };
    response?: string; // Added to handle the response check in UI
}
interface VIEWsubmitMessage {
    type: "VIEWsubmit";
    data: VIEWsubmitParams;
}

export interface VIEWsubmitParams {
    properties: BulkActionProperties;
    scraperStepsOption: 'ObligationSummaryScraperRuleSet' | 'Bulk Update';
    incrementor?: number;
    additionalData?: string;
    initialParsedDocument?: Document;
}
interface ChromeStorage {
    type: "getStorage" | "setStorage";
    data: {
        key: string | undefined;
        value?: string | number | boolean;
    };
}
interface ObligationNumberList {
    type: "bulkAction" | "obligationScrapeInitialise" | "generateXLSX" | "WDPPreviewInitialise" | "WDPPreviewProcess" | "WDPBatchProcess";
    data: {
        obligations: CollectedData[];
        VIEWEnvironment: string;
        targetFields?: (DerivedFieldName | ExtractedFieldName)[];
        subType?: 'Bulk Notes Update' | 'Bulk Hold Update' | 'Bulk Writeoff Update';
        [key: string]: unknown;
    };
}
type BulkActionProperties = {
    popupWindow?: chrome.windows.Window | null;
    port?: chrome.runtime.Port | null;
    portDisconnected: boolean;
    txtNoticeCheck: string | string[];
    obligations: CollectedData[];
    debtorId?: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    VIEWEnvironment: string;
    page: string;
    agencies?: string[]
};

interface BulkAction {
    type: "processBulkAction";
    data: {
        properties: BulkActionProperties;
        VIEWEnvironment: string;
    };
    subType: "Bulk Notes Update" | "Bulk Hold Update" | "Bulk Writeoff Update";
}
export interface fetchParams {
    type: "fetchJSON" | "fetchBase64";
    data: Parameters<typeof fetch>;
}

export type Message = BulkAction | VIEWsubmitMessage | ObligationNumberList | backgroundData | ChromeStorage | ObligationNumberList | fetchParams;

export type DropDownType = {
    description: string;
    letters: string[];
    element?: HTMLOptionElement;
};

export type VIEWObligationRowData = {
    Obligation: string;
    Balance_Outstanding: string;
    Infringement: string;
    Offence: string;
    OffenceDate: string;
    IssueDate: string;
    altname: string;
    NoticeStatus: string;
    ProgressionDate: string;
};

export interface ObligationPreview {
    [key: string]: string,
    "Notice Number": string;
    "Issued": string;
    "Balance Outstanding": string;
    "Notice Status": string;
    "Offence": string;
}

export interface ObligationData {
    [key: string]: string | number | boolean;
    "Obligation": string;
    "Infringement": string;
    "Agency": string;
    "issuingAgency": string;
    "Offence_Description": string;
    "Balance_Outstanding": string;
    "Status": string;
    "Date_of_Offence": string;
    "Date of Issue": string;
    "Input Source": string;
    "PRN Issue Date": string;
    "NFD Issue Date": string;
    "VRM Number": string;
    "Driver License State": string;
    "Driver License No.": string;
    "PRN Address": string;
    "Offence Location": string;
    "Offence Time": string;
    "Hold": string;
    "Challenge Date": string;
    "Challenge": string;
    "Date_of_Birth": string;
    "Reduced_Charge": string;
    "Penalty_Reminder_Fee": string;
    "Registration_Fee": string;
    "Enforcement_Fee": string;
    "Warrant_Issue_Fee": string;
    "Amount_Waived": string;
    "Amount_Paid": string;
    "Court_Costs": string;
    "Court_Fine": string;
    "enforcementAgencyCode": string;
    "enforcementAgencyID": string;
    "Offence_Code": string;
    "First_Name": string;
    "Last_Name": string;
    "Address_1": string;
}

export interface DebtorData {
    [key: string]: string | number | boolean | ObligationData[]; // Allowing for dynamic keys and array of ObligationData
    "DebtorID": string;
    "First_Name": string;
    "Last_Name": string;
    "Address_1": string;
    "Town": string;
    "State": string;
    "Post_Code": string;
    "a": ObligationData[];
}

export interface obligationStatusMap {
    [key: string]: "NFDP" | "CHLGLOG" | "PAID" | "SELENF" | "SELDEA" | "WARRNT" | "INF" | "INFP" | "PRN" | "PRNP" | "CANCL"
}
export type WDPBatchPayloadType = (WDPBatchPayload & {
    addObligationToWDPVariationCommand: never;
    addExternalEnforcementAgenciesObligationCommand: WDPApplicationPayload & {
        externalEnforcementAgenciesObligation: WDPObligationPayload;
    };
}) | {
    addExternalEnforcementAgenciesObligationCommand: never;
    addObligationToWDPVariationCommand: WDPApplicationPayload & {
        obligation: WDPObligationPayload;
    };
};
interface WDPObligationPayload {
    "debtorID": string;
    "debtorDateOfBirth": string;
    "infringementNumber": string;
    "infringementNoticeIssueDate": string;
    "issuingAgency": string;
    "infringementIndicator": string;
    "enforcementAgencyID": string;
    "enforcementAgencyCode": string;
    "offenceCode": string;
    "offenceCodeDescription": string;
    "enforcementAgencyName": string;
    "offenceStreetSuburb": string | undefined;
    "offenceStreetandSuburb": string | undefined;
    "offenceDateTime": string;
    "registrationStatePlate": string | undefined;
    "amountDueAndFee": number;
    "amountDue": number;
    "amountFee": number;
    "debtorName": string;
    "debtorAddressLine1": string;
    "debtorAddressSuburb": string;
    "debtorAddressState": string;
    "debtorAddressPostCode": string;
    "debtorLicenceState": string | undefined;
    "wdpHoldStatusID": number;
    "eligibility": "ELIGIBLE" | "INELIGIBLE";
    "workedOffAmount": number;
    "manualAdjustmentAmount": number;
    "wdpVariationID"?: number;
    "obligation"?: {
        "obligationNumber": string;
    };
}
interface WDPApplicationPayload {
    "aggregateId": number;
    "commandEventType": number;
    "commandTimeStamp": string;
    "latestTimeStamp": string;
    [x: string]: number | string | WDPObligationPayload;

}
interface WDPBatchPayload {
    "commandTimeStamp": string;
    "eventType": number;
    [x: string]: number | string | WDPApplicationPayload;
}export type WDPCommands = "addExternalEnforcementAgenciesObligationCommand" | "addObligationToWDPVariationCommand";
export type WDPSequence = "externalEnforcementAgenciesObligation" | "obligation";
// --- Interfaces and Type Definitions ---

export interface ObligationRowData {
    "Obligation"?: string;
    "Balance_Outstanding"?: string;
    "Infringement"?: string;
    "OffenceDate"?: string;
    "IssueDate"?: string;
    "altname"?: string;
    "NoticeStatus"?: string;
    "ProgressionDate"?: string;
    "NFDlapsed"?: boolean;
    "Challenge"?: string; // Added from reviewTableData
}
/**
 * Associates an obligation with its corresponding agency name.
 */
interface AgencyInfo {
    key: string; // Notice Number
    value: string; // Agency Name
}
interface AddressInfo {
    Address_1: string;
    Town: string;
    State: string;
    Post_Code?: string;
}
/** Templates and associated metadata*/
export interface Template {
    /** 'Agency', if the correspondence is for an Enforcement agency, 'Debtor' if the correspondence is for a debtor. */
    kind: 'Agency' | 'Debtor';
    /** The name of the letter type, e.g., 'Agency Enforcement Cancelled' as it appears in the Chrome tool configuration workbook*/
    letter: string;
    /** A docx template stored as a base64 string */
    template: Promise<string | null | void>; // Promise resolving to the template binary data
}

export type VIEWObligationRow = {
    [key in (typeof VIEWObligationListHeadings)[number]]: string;
};

export type Properties = {
    VIEWObligationData: VIEWObligationRow[];
    obligationRows?: ObligationRowData[];
    VIEWEnvironment: string; // e.g., "finesvictoria"
    IncludesAgencyCorrespondence: boolean; // Flag indicating if agency letters are needed
    letters?: string[]; // Array of letter names, e.g., ['Enforcement Confirmed']
    RequiresExtendedAttributes: boolean; // Flag for extended processing?
    SharePoint: boolean; // Flag to load templates from SharePoint

    // Properties added during processing
    agencies?: AgencyInfo[];
    obligationsCountFixed?: number;
    obligationsCount?: number;
    agenciesList?: Record<string, string>[]; // Promise for agency address list fetch
    reviewList?: Promise<Response> | string | Response; // Changed Array<string> to string based on usage
    templates?: Promise<Template>[] | Template[];
    DebtorId?: string;
    lastName?: string;
    firstName?: string;
    companyName?: string;
    Is_Company?: boolean;
    Address?: AddressInfo;
    challengeType?: string; // Added from getDefaultChallenge group
    letterData?: Partial<letterDataProps>[]; // Array of data objects for makeLetter

    // Added properties based on usage in getAppData and letterTypes
    tParty?: boolean;
    legalCentre?: boolean;
    applicantName?: string;
    appOrganisation?: string;
    appStreet?: string;
    appTown?: string;
    appState?: string;
    appPost?: string;
    recipient?: '3rd Party' | 'Debtor' | 'Alt 3rd Party' | 'Unknown';
    altApplicantName?: string;
    altAppOrganisation?: string;
    altAppStreet?: string;
    altAppTown?: string;
    altAppState?: string;
    altAppPost?: string;
    OnlyNFDLapsed?: boolean;
    UserID?: string;
    selectedObValue?: string;
    MOU?: boolean; // Assuming this comes from merged agenc/y data
    AgencyEmail?: string; // Assuming this comes from merged agency data
    enforcename?: string; // Assuming this comes from merged agency data
    portDisconnected?: boolean; // Assuming this comes from merged agency data
};
export type ScraperPageConfig = {
    url: string;
    extract?: string;
    name: string;
    description: string;
    type?: "table",
    otherData: { "MOU": true }[];
    active?: boolean;
    setActive?: (active: boolean) => void;
    controlID?: string;
    targetTags: {
        method: "text" | "callback" | "value" | "title";
        field: string;
        tag?: string;
        callback?: (htmlPage: HTMLElement, getTextFromSelector: (htmlElement: HTMLElement, selector: string) => string) => string;
    }[];
    name: string;
};
export interface VIEWDebtorSummaryObligation {
    [key: string]: string | undefined; // Added Index Signature to satisfy CollectedData
    NoticeNumber: string;
    InfringementNo: string;
    NoticeType: string;
    OffenceDate: string;
    Issued: string;
    BalanceOutstanding: string;
    NoticeStatus: string;
    ContraventionCode: string;
    HoldCodeEndDate: string;
    EOTCount: string;
    CurrentChallengeLogged: string;
    VRM: string;
    DueDate: string;
    EnforcementActionIds: string;
    KeyActiveWarrantExecutionActions: string;
    RecentDEBTDVSANCholds: string;
}

export interface Button {
    name: string;
    type: "button";
    description: string;
    text?: string;
    attributes?: { [key: string]: string; };
    onClick?: (selectedOption: string | null, table: Table<VIEWDebtorSummaryObligation>) => void;
}
export interface RadioButton {
    name: string;
    type: "radio";
    description: string;
    value: string;
    attributes?: { [key: string]: string; };
}
export interface DropDown {
    name: string;
    type: "dropdown";
    description: string;
    options: string[] | string;
    attributes?: { [key: string]: string; };
}
export interface SplitButton {
    type: "split_button";
    buttons: Button[];
}

/**
 * Represents a user input element in the UI.
 * Can be a button, radio button, or dropdown.
 * @property name - The name of the input element, used for identification.
 */
export type Input = Button | RadioButton | DropDown | SplitButton;

export interface TemplateSheetRecord {
    Correspondence: string;
    Filename: string;
    Props: string;
    Link: string;
    Recipient: 'Agency' | 'Debtor';
    FieldSet: string;
    [key: string]: string;
}

export interface FieldSetSheetRecord {
    FieldSet: "Default" | "Standard" | "XLSXExport" | "WDP" | "FeeRemoval" | "EnforcementAction";
    Fields: string;
    [key: string]: string;
}

export type PageDefinition = typeof pageDefinitions[number]

export type FieldDefinition = typeof allDataFields[number];

export type DataFieldName = FieldDefinition['name'];

export type DataFieldSet = Set<DataFieldName>

export type DataFieldArray = DataFieldName[]


export type DerivedFieldDefinition = {
    [K in keyof typeof allDataFields]: typeof allDataFields[K] extends { readonly isDerived: true }
    ? typeof allDataFields[K]
    : never;
}[keyof typeof allDataFields]


type ValueOf<T> = T[keyof T];

export type SourcedFieldDefinition = Extract<DerivedFieldDefinition, { readonly sourceFields: string[] }>;

export type SourcedFieldName = SourcedFieldDefinition['sourceFields'][number];

export type DerivedFieldName = DerivedFieldDefinition['name'];

export type ExtractedFieldName = PageDefinition['fields'][number]['name'] | keyof PageDefWithSelectorFields['fields'][number]['selector']['fields'];

type PageDefWithSelectorFields = Extract<typeof pageDefinitions[number],
    {
        fields: readonly {
            selector: {
                fields: Record<string, { selector: string }>;
            };
        }[];
    }
>;

export type PageId = 'DebtorProfileSummary' | 'NoticeVehicleDetails' | 'DebtorCourtFines' | 'DebtorCourtFines2' | 'NoticeAudit2' | 'NoticeKeeper' | 'DebtorDecisionReview' | 'DebtorDetails' | 'DebtorAddresses' | 'DebtorObligationsSummary' | 'NoticeDetails' | 'NoticeAudit' | 'FinancialSummary' | 'TaskList' | 'DebtorFurtherDetails'

export interface DomSelector {
    type: "css" | "xpath";
    value: string;
    /** Optional node type to extract from the DOM element. */
    node?: 'title' | 'text' | 'value' | 'href';
}
export interface OptimiserPageRepresentation {
    /**
     * The unique identifier for the page.
     */
    id: PageId;

    /**
     * A Set containing the names (strings) of all data fields
     * that this page can directly provide. This is derived from the
     * `name` property of each item in the `fields` array of the
     * input `RawPageDefinition` or `PageDefinition`.
     */
    fields: Set<DataFieldName>;

    /**
     * An array of strings, where each string is the ID of another
     * page definition that this page directly depends on.
     */
    dependencies: PageId[];
}
// Master definition for all fields (direct and derived)

/** 
 * Represents a single field definition.
 * @property name - The name of the field, e.g., 'debtor_id'. This will be used as a key in the final data output.
 * @property level - The level this field belongs to, either 'Debtor' or 'Obligation'. An obligation field that is directly scraped from a debtor page must be handled as a list.
 * @property selector - The DOM selector used to extract the field from a page.
 * @property isList - Indicates if the field is a list (e.g., multiple obligations for a debtor).
 * @property isDerived - Indicates if the field is derived from other fields.
 * @property sourceFields - Names of fields this derived field depends on, if applicable.
 * @property derivationKey - Key to look up function in a derivation registry, if the field is derived. If not provided and isDerived is true, name will be used to look up the function instead.
 * @property notes - Optional notes about the field, e.g., "This field is derived from multiple sources".
 * */
export type MasterFieldDefinition = {
    name: string;
    level: "Debtor" | "Obligation";
    isList?: boolean; // For fields extracted from pages that return multiple items
    isDerived?: boolean; // Indicates if the field is derived
    sourceFields?: string[]; // Names of fields this derived field depends on
    derivationKey?: string; // Key to look up function in a derivation registry
    notes?: string;
    /**
     * A predicate function to determine if this field should be skipped.
     * 
     * If this function returns `true`, the field is **excluded** from the scraping/derivation process for the current data context.
     * Use this to conditionally target fields based on other data (e.g., only scrape 'CourtRef' if 'NoticeType' is '2B').
     * 
     * @param data The current data collected so far for the debtor or obligation.
     * @returns `true` to SKIP this field, `false` (or undefined) to proceed with targeting it.
     */
    condition?: (data: CollectedData) => boolean; // If true, the field is removed from the optimiser targets
}


/**
 * Represents page specific attributes of a field.
 * @property name - The name of the field, e.g., 'debtor_id'.
 * @property selector - The DOM selector used to extract the field from a page.
 * @property isList - Optional flag indicating if the field is a list (e.g., multiple obligations for a debtor).
 */
interface PageDataField {
    name: DataFieldName;
    selector: DomSelector | RowMappingConfig;
    isList?: boolean;
}

/**
 * Represents a page definition for the Optimiser.
 * @property id - Unique identifier for the page definition.
 * @property url - URL template for the page, e.g., "https://{environment}.example.com/path?id={obligation_number}".
 * @property level - The level this page primarily belongs to, either 'Debtor' or 'Obligation'.
 * @property fields - An array of field definitions this page provides, each with a name, selector, and optional isList flag.
 * @property method - Optional HTTP method for the page, either 'GET' or 'POST'.
 */
export interface MasterPageDefinition {
    id: PageId; // Unique identifier for the page definition
    /** URL template for the page. @example "https://{environment}.example.com/path?id={obligation_number}" */
    url: string;
    level: "Debtor" | "Obligation"; // Level this page primarily belongs to
    fields: PageDataField[];
    /** An array of page IDs this page depends on, with optional stateFields for dynamic values and literalParams for hardcoded key-value pairs. */
    dependencies: PageDependency[];
    method?: 'GET' | 'POST';
    _optimiserFields?: string[]; // To hold the pre-processed list
    /**
     * A predicate function to determine if this page should be visited.
     * 
     * If this function returns `false`, the page is **skipped** during the scraping process.
     * 
     * @param data The current data collected so far.
     * @returns `true` to visit this page, `false` to skip it.
     */
    condition?: (data: CollectedData) => boolean;
}

/** Represents a dependency on another page */
interface PageDependency {
    /** PageId of the page this page depends on */
    id: PageId;
    /** Optional array of state fields to use for dynamic values. */
    stateFields?: string[];
    /** Optional array of hardcoded key-value pairs */
    literalParams?: { name: string; value: string; }[];
}

/**
 * Represents a task for the Data Extractor to fetch and extract data from a specific page.
 * @property level - The level this page primarily belongs to, either 'Debtor' or 'Obligation'.
 * @property dependencies - An array of dependencies this page has, each with an ID and optional stateFields and literalParams.
 * @property pageDefForGetParsedContent - The definition of the page being fetched/parsed.  
 * @property currentDataForStateFields - Global/current data state or specific obligation object to use for dynamic values. 
 * @property currentObligationNumberForStateFields - Specific obligation context to use for dynamic values.
 * @property obligationIdentifierFieldNameForStateFields - Key for the obligation ID to use for dynamic values.
 * @property formData - Optional form data to send with the request, if applicable.
 * @property requestMethod - Optional HTTP method to use for the request, either 'GET' or 'POST'.
 * @property pageDefForGetParsedContent - The definition of the page being fetched/parsed.
 * @property currentDataForStateFields - Global/current data state or specific obligation object to use for dynamic values. 
 * @property currentObligationNumberForStateFields - Specific obligation context to use for dynamic values. 
 */
export interface PageExtractionTask extends MasterPageDefinition {
    level?: "Debtor" | "Obligation"; // The level this page primarily belongs to    
    dependencies?: {
        id?: PageId;
        stateFields?: string[];
        literalParams?: { name: string; value: string; }[];
    }[];
    pageDefForGetParsedContent: MasterPageDefinition;
    currentDataForStateFields?: CollectedData;
    currentObligationNumberForStateFields?: string;
    obligationIdentifierFieldNameForStateFields?: DataFieldName
    formData?: URLSearchParams;
    requestMethod?: "GET" | "POST";
    pageDefForGetParsedContent: MasterPageDefinition
    currentDataForStateFields?: CollectedData;
    currentObligationNumberForStateFields?: string;
    obligationIdentifierFieldNameForStateFields?: DataFieldName;
}

/** Input for the Optimiser module */
export interface OptimiserInput {
    /** Names of concrete, non-derived fields to obtain. */
    targetFields: DataFieldName[];
    /** List of all page definitions. */
    allPageDefinitions: MasterPageDefinition[];
    /** List of field definitions. */
    masterFieldDefinitions: MasterFieldDefinition[];
    /** Data collected for the current debtor or obligation. */
    collectedData: CollectedData;
    /** List of pages that should be excluded from the optimisation process. */
    pagesToExclude?: PageId[];
}

/** Optimal paths for the current obligation number or debtor. */
export interface OptimiserOutput {
    /** Optimal paths for the current obligation number or debtor. */
    pathsToVisit: PageId[][];
    unreachableFields: string[];
}

/**
 * Contract for an Optimiser module
 */
export interface IOptimiser {
    getOptimalPaths(input: OptimiserInput): Promise<OptimiserOutput>;
}

export interface RowMappingConfig {
    type: 'row-mapped';
    // Selector to get all rows in the main data table (e.g., 'tbody > tr')
    rowSelector: string;
    // Defines the columns to extract from each row
    fields: {
        [fieldName in DataFieldName]?: {
            // Selector for the specific data point, relative to the row element
            selector: string;
            node?: 'title' | 'text' | 'value' | 'href';
        }
    };
    // Defines a lookup table for data that exists outside the main rows
    lookup?: {
        // Selector to get all rows in the lookup table
        rowSelector: string;
        // Selector to get the key (e.g., Notice Number) from a lookup row
        keySelector: string;
        // Selector to get the value (e.g., CaseRef) from a lookup row
        valueSelector: string;
        // The name of the field this lookup provides
        valueFieldName: DataFieldName;
    };
}


// Output from a single page extraction

export type ExtractionOutput = Partial<Record<DataFieldName, string[] | string>>;
// Contract for a Data Extractor module

export interface IDataExtractor {
    // Constructor might take environment for URL templating or HTTP client config
    // constructor(environment: string, /* other configs */);
    fetchAndExtract(task: PageExtractionTask): Promise<ExtractionOutput>;
}
// Input for the Transformer

export interface TransformerInput {
    currentData: CollectedData; // The data object to potentially add derived fields to (either finalResult or an obligation object)
    level: "Debtor" | "Obligation";
    masterFieldDefinitions: MasterFieldDefinition[];
    explicitlyTargetedFields: DataFieldSet; // Which derived fields are we actually trying to compute?
    derivationRegistry: DerivationLogicRegistry; // The registry of derivation functions
    log: (message: string, ...args: unknown[]) => void;
}
// Contract for a Transformer module (optional)

export interface ITransformer {
    deriveFields(input: TransformerInput): Promise<boolean>; // Returns true if any new data was derived
}
// Registry for derivation functions
export type DerivationFunction = (sources: CollectedData) => string | boolean | undefined | null | Promise<unknown>;

export type DerivationLogicRegistry = Partial<Record<DataFieldName, DerivationFunction>>;

// Configuration for the main Scraper class

export interface ScraperConfig {
    allPageDefinitions: MasterPageDefinition[];
    readonly masterFieldDefinitions: MasterFieldDefinition[];
    environment: string;
    obligationIdentifierFieldName?: DataFieldName;
    contextSwitchingPageId?: PageId;
}

export type ObligationInput = { "NoticeNumber": string } & Partial<Record<DataFieldName, string>>;
// Represents the data collected so far

export type CollectedData =
    Partial<Record<DataFieldName, string | boolean | undefined>>
    & {
        documentTemplateURL?: string,
    }
    & {
        a?: ObligationArray;
    }
    & Partial<RecipientDetails>

type RecipientDetails = {
    tParty: boolean;
    legalCentre: boolean;
    recipient: '3rd Party' | 'Debtor' | 'Alt 3rd Party';
    applicantName: string;
    appOrganisation: string;
    appStreet: string;
    appTown: string;
    appState: string;
    appPost: string;
    altApplicantName: string;
    altAppOrganisation: string;
    altAppStreet: string;
    altAppTown: string;
    altAppState: string;
    altAppPost: string;
    altIsLegalCentre: boolean;
    correspondenceDescription: string,

}

export interface RecipientAddress {
    contactName: string;
    organisation: string;
    street: string;
    town: string;
    state: string;
    postcode: string;
}

export interface StoredRecipientDetails {
    isThirdParty: boolean;
    isLegalCentre: boolean;
    addressTo: "Debtor" | "3rd Party" | "Alt 3rd Party"
    altIsLegalCentre: boolean;
    mainAddress: RecipientAddress;
    altAddress: RecipientAddress;
}

export type ObligationArray = Partial<Record<DataFieldName, string | boolean | undefined>>[]

export interface PathEntry {
    pageId: PageId;
    path: PageId[];
}
export type TargetFieldSet = Set<string>; // Set of target field names to be covered by the optimisation
export type AllPagesMap = Map<PageId, OptimiserPageRepresentation>; // Map of all pages by their ID
export type ErrorWithMessage = {
    message: string;
};
export type ChromeMessageListenerCallback = Parameters<chrome.runtime.ExtensionMessageEvent['addListener']>[0];
// --- Type Definitions ---
// Type for the object created from FormData
export type FormDataObject = Record<string, FormDataEntryValue>; // FormDataEntryValue is string | File
// Interface for individual submission steps
interface SubmitInstruction {
    url: string; // URL to fetch
    group?: string | "Ungrouped"; // Used by groupBy function. Default: "Ungrouped"
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD"; // Default: "POST"
    body?: boolean; // Default: true, whether to include body
    urlParams?: Record<string, string | number> | ((doc?: Document, set?: string, props?: BulkActionProperties) => Record<string, string | number> | Promise<Record<string, string>>);
    formDataTarget?: number; // Index in previousFormData to use
    clearWizardFormData?: boolean; // Flag to clear current page's form data
    clearVIEWFormData?: boolean; // Flag to clear accumulated form data
    optional?: (doc?: Document, props?: BulkActionProperties) => boolean; // Condition to skip this step
    after?: (doc?: Document) => void; // Callback after successful fetch/parse
    next?: boolean; // Flag for early return from the entire function
    attempts?: number; // Retries for parsePage
    sameorigin?: boolean; // Determines fetch method (content script vs background)
}
// Type for dynamic grouping parameters
// The value can be a function returning an array of parameters, or just an array.
export type GroupedRepeat = Record<string, (props?: Properties) => Record<string, string>[]>;
// Interface for the main configuration object

export interface ScraperSteps {
    steps: SubmitInstruction[]; // Array of submission steps - Changed from 'submit' to 'steps'
    action?: (doc?: Document) => void; // Initial action
    groupRepeats?: GroupedRepeat; // Dynamic parameters for groups
    afterAction?: (doc?: Document, props?: Properties) => void; // Action after all loops complete
    next?: boolean; // Final return flag for the entire function
}
export type ChromeOnUpdatedHandler = Parameters<(typeof chrome.tabs)['onUpdated']['addListener']>[0];
/**
 * A process has three main components:
 * @property stepGroup - Defines named groups. Steps associated with a group will be repeated for each item returned by the group function.
 * @property steps - Defines the steps to be executed in the process. If a step's group is not defined, it will be added to the default group.
 * @property afterAction - A function to be executed after all steps are completed.
 */


export type ProcessConfig = {
    stepGroup: stepGroup;
    steps: Step[];
    afterAction: afterAction; // Use the defined afterAction type
    next?: boolean; // Optional property to indicate if the process should continue to the next step
};
// Type for parsed table data (flexible key-value pairs)
export type ParsedTableRow = Record<string, string>;
// Type for Chrome storage local data
export interface ChromeStorageData {
    obligationsCount?: number;
    obligationsCountFixed?: number;
    value?: Record<string, unknown[]>; // Structure from getAppData
    userName?: string;
}
// Type definition for the parameters passed to the afterAction function
type AfterActionParams = {
    document?: Document | null; // Make document optional as it might not always be present
    properties?: BulkActionProperties;
};
/**
 * By default a step must navigate to a new URL (via the step's url property). An optional afterAction function will be called after the URL is loaded.
 * The afterAction function can be used to perform additional actions after the URL is loaded, such as parsing the document or updating properties.
 * @param params - The parameters passed to the function, including the document and properties
 * @returns A Promise or void, depending on the implementation of the function.
*/


export type afterAction = (params: AfterActionParams) => Promise<void> | void;

export type urlParamsType = Record<string, string | number> | (({ document, iterationReference, properties }: { document?: Document; iterationReference?: paramArrayObject; properties?: BulkActionProperties; }) =>
    Record<string, string | number> |
    void |
    Promise<Record<string, string | number>> |
    Promise<void>);
// Type definition for a single step in the process configuration

export type Step = {
    url?: string;
    urlParams?: urlParamsType;
    afterAction?: afterAction;
    group?: string; // Identifier for stepGroup
    clearVIEWFormData?: boolean;
    optional?: (initialParsedDocument?: Document, properties?: BulkActionProperties) => boolean; // Optional property to indicate if the step is optional
    formDataTarget?: string; // Target for form data
    clearWizardFormData?: boolean; // Flag to clear form data
    method?: string; // HTTP method (GET, POST, etc.)
    body?: boolean; // Request body for POST requests
    sameorigin?: boolean; // Flag for same-origin policy
    next?: boolean;
};

export type stepGroup = {
    [key: string]: (properties: BulkActionProperties) => paramArrayObject[] | Promise<paramArrayObject[]>; // Function returning an array of paramArrayObject
};
/** Parameter object returned by a step group. Step groups will iterate over each object.
 * An empty object will cause the group to be executed with no parameters.
*/


export type paramArrayObject = {
    txtNoticeNo?: string;
    txtNoticeCheck?: string;
};

export type DebtorSummaryObligationTable = Table<VIEWDebtorSummaryObligation>;

export type GenerateDocumentMessage = {
    type: 'generate-email' | 'generate-document';
    data: {
        dataSet: CollectedData;
        base64Template: string;
        correspondenceDescription: string;
        emailAttachments?: Record<string, string>;
    }
};
export type XlSXExportColumnDefinition = Array<{
    header: DerivedFieldName | ExtractedFieldName;
    width: number;
    name?: string;
    isCurrency?: boolean;
    isDate?: boolean;
}>;
