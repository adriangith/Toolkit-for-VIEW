import { DataParams } from "./VIEWsubmit.js";
import { emailMaker, getDates } from "./emailmaker";

// Declare external global libraries/variables if not properly typed via imports/types
declare const JSZipUtils: {
    getBinaryContent(url: string, callback: (err: Error | null, data: ArrayBuffer) => void): void;
};

// Import types or functions from other modules
// Assuming VIEWsubmit takes config and properties and returns a Promise
import VIEWsubmit from "./VIEWsubmit"; // Adjust if it has a default export or named exports

// Assuming makeLetter takes data, template buffer, and filename
import { makeLetter } from './genLetter-module'; // Adjust if default export
type MakeLetterType = (data: any, template: ArrayBuffer, filename: string) => void;
import { Data } from "pizzip"
type FetchRetryTimeoutType = (url: string, options?: RequestInit) => Promise<Response>;

// --- Interfaces and Type Definitions ---

interface ObligationRowData {
    "Notice Number": string;
    "Input Type": string; // e.g., "1A", "1C"
    "Balance Outstanding": string; // e.g., "$123.45"
    "Infringement No.": string;
    "Offence": string;
    "Offence Date": string; // e.g., "DD/MM/YYYY"
    "Issued": string; // e.g., "DD/MM/YYYY"
    "Notice Status/Previous Status": string; // e.g., "CHLGLOG", "SELDEA", "WARRNT", "NFDP"
    "Due Date": string; // e.g., "DD/MM/YYYY"
    // Properties added later
    "Obligation"?: string;
    "Balance_Outstanding"?: string;
    "Infringement"?: string;
    "OffenceDate"?: string;
    "IssueDate"?: string;
    "altname"?: string; // Agency Code/Name
    "NoticeStatus"?: string;
    "ProgressionDate"?: string;
    "NFDlapsed"?: boolean;
    "Challenge"?: string; // Added from reviewTableData
}

interface AgencyInfo {
    key: string; // Notice Number
    value: string; // Agency Code/Name
}

interface AddressInfo {
    Address_1: string;
    Town: string;
    State: string;
    Post_Code?: string;
}

interface TemplateMeta {
    kind: 'Agency' | 'Debtor';
    letter: string; // Letter name, e.g., 'Agency Enforcement Cancelled'
    template: Promise<ArrayBuffer>; // Promise resolving to the template binary data
}

interface Properties {
    obligationRows: ObligationRowData[];
    source: string; // e.g., "finesvictoria"
    agency: boolean; // Flag indicating if agency letters are needed
    letters: string[]; // Array of letter names, e.g., ['Enforcement Confirmed']
    extended: boolean; // Flag for extended processing?
    SharePoint: boolean; // Flag to load templates from SharePoint
    // Properties added during processing
    agencies?: AgencyInfo[];
    obligationsCountFixed?: number;
    obligationsCount?: number;
    agenciesList?: Promise<Response>; // Promise for agency address list fetch
    reviewList?: Promise<Response>; // Promise for review list fetch
    templates?: TemplateMeta[];
    DebtorId?: string;
    lastName?: string;
    firstName?: string;
    companyName?: string;
    Is_Company?: boolean;
    Address?: AddressInfo;
    challengeType?: string; // Added from getChallenge group
    letterData?: any[]; // Array of data objects for makeLetter
}

// Type for the message received by the listener
// Using 'any' for indices as the structure isn't strictly defined by an interface in the JS
// A more robust approach would be to send an object with named properties instead of an array.
type IncomingMessage = [
    any, // 0: Unknown
    string, // 1: Some string identifier (checked for 'Bulk', 'Export')
    any, // 2: Unknown
    any, // 3: Unknown
    boolean, // 4: Boolean flag (checked for false)
    string, // 5: source
    ObligationRowData[], // 6: obligationRows
    boolean, // 7: agency flag
    string[], // 8: letters array
    boolean, // 9: extended flag
    boolean // 10: SharePoint flag
];

// Type for parsed table data (flexible key-value pairs)
type ParsedTableRow = Record<string, string>;

// Type for the structure returned by letterGen
interface SubmitStep {
    url?: string | ((parsedDocument: Document, properties: Properties) => string);
    urlParams?: (parsedDocument: Document | null, set: any, properties: Properties) => void | Record<string, any> | ((parsedDocument: Document | null, dynamicParams: any) => Record<string, any>);
    after?: (parsedDocument: Document | null, properties: Properties) => void;
    group?: string; // Identifier for groupRepeats
    clearVIEWFormData?: boolean;
    // Allow 'this' context modification for URL
    [key: string]: any; // Allow dynamic properties like 'this.url' assignment
}

interface LetterGenConfig extends DataParams {
    groupRepeats?: Record<string, () => Record<string, string>[]>;
}

// Type for Chrome storage local data
interface ChromeStorageData {
    obligationsCount?: number;
    obligationsCountFixed?: number;
    value?: Record<string, any[]>; // Structure from getAppData
    userName?: string;
}

interface LetterTypeDef {
    filename: string;
    Props?: string[];
}

// --- Global State ---
let running: boolean = false; // Simple lock state

// --- Chrome Message Listener ---
chrome.runtime.onMessage.addListener(
    (message: IncomingMessage, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void): boolean | undefined => {
        // Basic check for message structure - consider adding more validation
        if (!Array.isArray(message) || message.length < 11) {
            console.warn("Received unexpected message format:", message);
            return;
        }

        const source = message[5];
        const expectedUrlPart = `https://${source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorObligations`.toUpperCase();

        if (sender.url && sender.url.toUpperCase().includes(expectedUrlPart) &&
            !message[1].includes('Bulk') && !message[1].includes('Export') &&
            message[4] === false) {

            const properties: Partial<Properties> = {}; // Start with partial, will be filled
            properties.obligationRows = message[6];
            properties.source = message[5];
            properties.agency = message[7];
            properties.letters = message[8];
            properties.extended = message[9];
            properties.SharePoint = message[10];

            // Ensure all required properties are present before launching
            if (properties.obligationRows && properties.source && properties.letters) {
                launch(properties as Properties)
                    .then(() => {
                        console.log("Launch completed successfully.");
                        // sendResponse({ status: "success" }); // Optional: respond if needed
                    })
                    .catch(error => {
                        console.error("Error during launch:", error);
                        // sendResponse({ status: "error", message: error instanceof Error ? error.message : String(error) }); // Optional: respond on error
                        // Re-throw if necessary for higher-level handlers
                        // throw error;
                    });
                return true; // Indicates that sendResponse will be called asynchronously (optional)
            } else {
                console.error("Missing required properties in message:", message);
            }
        }
        // Return false or undefined if not handling the message or not responding asynchronously
        return undefined;
    }
);

// --- Main Launch Function ---
async function launch(properties: Properties): Promise<void> {
    try {
        // Assuming VIEWsubmit matches the inferred type
        await (VIEWsubmit)({}, 0, undefined, letterGen(properties), properties);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (errorMessage !== 'Scraper already running') {
            running = false; // Reset lock only if it's not the 'already running' error
        }
        // Re-throw the original error to propagate it
        throw err;
    }
}

// --- Letter Generation Configuration ---
function letterGen(properties: Properties): LetterGenConfig {
    if (running === true) {
        throw new Error('Scraper already running'); // Throw an actual Error object
    }
    running = true;

    return {
        groupRepeats: {
            "obligationsGroup": (): Record<string, string>[] => {
                properties.agencies = properties.agencies ?? []; // Initialize if undefined
                let paramArray: Record<string, string>[] = [];
                if (properties.agency || properties.extended) {
                    properties.obligationRows.forEach(data => {
                        const params: Record<string, string> = {};
                        if (data["Input Type"]?.includes('1A')) {
                            properties.agencies!.push({ key: data["Notice Number"], value: "TRAFFIC CAMERA OFFICE" });
                        } else if (data["Input Type"]?.includes('1C')) {
                            properties.agencies!.push({ key: data["Notice Number"], value: "VICTORIA POLICE TOLL ENFORCEMENT OFFICE" });
                        } else {
                            params["txtNoticeNo"] = data["Notice Number"];
                            paramArray.push(params);
                        }
                    });
                }
                properties.obligationsCountFixed = paramArray.length;
                properties.obligationsCount = paramArray.length;
                return paramArray;
            },
            "getChallenge": (): Record<string, string>[] => {
                const paramArray: Record<string, string>[] = [];
                // Ensure obligationRows exists and has at least one element
                if (properties.obligationRows?.[0]?.['Notice Status/Previous Status'] &&
                    !properties.obligationRows[0]['Notice Status/Previous Status'].includes('CHLGLOG')) {
                    paramArray.push({ "txtNoticeNo": properties.obligationRows[0]["Notice Number"] });
                }
                return paramArray;
            }
        },
        submit: [{
            url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorAddresses.aspx`,
            urlParams: (parsedDocument: Document | null, set: any, props: Properties): void => {
                // Ensure chrome storage types are correct
                const storageData: ChromeStorageData = { 'obligationsCount': 10, "obligationsCountFixed": 10 };
                chrome.storage.local.set(storageData);

                // Assuming fetchRetryTimeout matches the inferred type
                props.agenciesList = (fetch as FetchRetryTimeoutType)('https://vicgov.sharepoint.com/:u:/s/msteams_3af44a/ETiKQS5uTzxHnTmAV6Zpl9oBvhNZexZFmJrJxLNZLD6L4A?download=1');
                props.reviewList = (fetch as FetchRetryTimeoutType)(`https://${props.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorDecisionReview.aspx`);
                props.templates = props.letters.map((letter): TemplateMeta => {
                    const urlKey = letter as keyof typeof letterURL; // Type assertion
                    const trimRecordId = letterURL[urlKey];
                    if (!trimRecordId) {
                        console.error(`No URL found for letter type: ${letter}`);
                        // Handle error appropriately - maybe return a dummy template promise?
                        throw new Error(`Missing URL configuration for letter: ${letter}`);
                    }
                    const letterTemplateURL = `https://trimapi.justice.vic.gov.au/record/${trimRecordId}/File/document2`;
                    // Assuming the SharePoint URL structure is consistent and uses the same ID
                    const SharePointletterTemplateURL = `https://vicgov-my.sharepoint.com/:w:/g/personal/adrian_zafir_justice_vic_gov_au/${trimRecordId}?download=1`;

                    return {
                        "kind": letter === 'Agency Enforcement Cancelled' ||
                            letter === 'Agency Fee Removal' ||
                            letter === 'FVS Eligible Agency' ||
                            letter === 'Agency FR Granted' ||
                            letter === 'Agency Enforcement Cancelled Updated' || // Ensure this is in letterURL
                            letter === "Notice of Deregistration" ? 'Agency' : 'Debtor',
                        "letter": letter,
                        "template": props.SharePoint === true ? loadLetter(SharePointletterTemplateURL) : loadLetter(letterTemplateURL)
                    };
                });
            },
            after: (parsedDocument: Document | undefined): void => {
                if (!parsedDocument) return; // Guard against null document

                // Use optional chaining and nullish coalescing for safer access
                properties.DebtorId = (parsedDocument.querySelector("#DebtorDetailsCtrl_DebtorIdSearch") as HTMLInputElement)?.value?.trim() ?? '';
                properties.lastName = parsedDocument.querySelector("#DebtorDetailsCtrl_surnameTxt")?.textContent?.trim() ?? '';
                properties.firstName = parsedDocument.querySelector("#DebtorDetailsCtrl_firstnameTxt")?.textContent?.trim() ?? '';
                properties.companyName = parsedDocument.querySelector("#DebtorDetailsCtrl_companyNameTxt")?.textContent?.trim() ?? '';
                properties.Is_Company = !!properties.companyName; // Simpler boolean check

                const addressTable = parsedDocument.querySelector("#DebtorAddressesCtrl_gridDebtorAddresses_tblData") as HTMLTableElement | null;
                if (!addressTable) {
                    console.warn("Address table not found.");
                    properties.Address = { Address_1: "", Town: "", State: "", Post_Code: "" }; // Default empty address
                    return;
                }

                let addressTableData = parseTable(addressTable);
                let addressParts: string[] = []; // Initialize as empty array

                addressTableData = addressTableData.filter(row => row["Best Address"] === "Y");

                const addressObject = convertArrayToObject(addressTableData, "Type");

                for (const priority of addressPriority) {
                    if (addressObject[priority]?.Address) { // Check if priority exists and has Address
                        addressParts = addressObject[priority].Address.split(",");
                        addressParts.push(addressObject[priority].Postcode ?? ''); // Use nullish coalescing for postcode
                        break;
                    }
                }

                // Clean up address parts (ensure strings before trimming)
                addressParts = addressParts.map(part => String(part || '').trim());

                // Handle unit numbers etc. combined with street name
                if (addressParts.length > 0 && addressParts.length > 4) { // Check length before accessing index 1
                    addressParts[1] = `${addressParts[0]} ${addressParts[1]}`; // Add space
                    addressParts.shift();
                }

                properties.Address = {
                    "Address_1": addressParts[0] ?? '', // Provide defaults
                    "Town": addressParts[1] ?? '',
                    "State": addressParts[2] ?? '',
                    "Post_Code": addressParts[3] ?? undefined
                };
            }
        }, {
            group: "obligationsGroup",
            urlParams: function (this: SubmitStep, parsedDocument: Document | undefined, dynamicParams: Record<string, string>): Record<string, any> {
                // Modify the URL on the 'this' context (the step object)
                this.url = `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/forms/NoticesManagement/SearchNotice.aspx?&NoticeNo=${dynamicParams.txtNoticeNo}`;
                return {}; // Return empty object as params are in URL
            },
            after: (parsedDocument: Document | undefined): void => {
                if (!parsedDocument || !properties.obligationsCountFixed || properties.obligationsCount === undefined) return;

                const progress = ((properties.obligationsCountFixed - properties.obligationsCount + 1) / properties.obligationsCountFixed) * 10; // Correct progress calculation
                properties.obligationsCount--;
                const storageData: ChromeStorageData = { 'obligationsCount': progress, "obligationsCountFixed": 10 }; // Consider if fixed should be dynamic
                chrome.storage.local.set(storageData);

                const noticeNo = (parsedDocument.getElementById("NoticeInfo_txtNoticeNo") as HTMLInputElement)?.value;
                const agencyCode = parsedDocument.getElementById("NoticeInfo_lblAgencyCode")?.textContent;

                if (noticeNo && agencyCode) {
                    properties.agencies = properties.agencies ?? [];
                    properties.agencies.push({ key: noticeNo, value: agencyCode });
                } else {
                    console.warn("Could not extract notice number or agency code.");
                }
            },
            clearVIEWFormData: true
        }, {
            group: "getChallenge",
            urlParams: function (this: SubmitStep, parsedDocument: Document | undefined, dynamicParams: Record<string, string>): Record<string, any> {
                this.url = `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/forms/NoticesManagement/SearchNotice.aspx?&NoticeNo=${dynamicParams.txtNoticeNo}`;
                return {};
            },
            clearVIEWFormData: true
        }, {
            group: "getChallenge",
            url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/Forms/NoticesManagement/NoticeChallengeHistory.aspx`,
            after: (parsedDocument: Document | undefined): void => {
                if (!parsedDocument) return;
                const challengeText = parsedDocument.querySelector("#lblChallengeCodeVal")?.textContent ?? '';
                const match = challengeText.match(/Enforcement - (.*)/);
                properties.challengeType = match ? match[1] : 'No Challenge Logged';
            },
            clearVIEWFormData: true
        }
        ],
        afterAction: async (doc?, props?): Promise<void> => {
            // Ensure required promises exist before proceeding
            if (!props || !props.agenciesList || !props.reviewList || !props.templates) {
                console.error("Prerequisite data (agenciesList, reviewList, templates) missing in afterAction.");
                running = false; // Reset lock on error
                throw new Error("Missing prerequisite data for afterAction.");
            }

            // Combine agency info into a lookup object
            const agencyLookup: Record<string, string> = (props.agencies ?? []).reduce((obj: { [x: string]: any; }, item: { key: string | number; value: any; }) => {
                obj[item.key] = item.value;
                return obj;
            }, {} as Record<string, string>);

            try {
                // Resolve all promises concurrently
                const results = await Promise.all([
                    props.agenciesList.then((response: { json: () => any; }) => response.json()), // Assuming JSON response
                    props.reviewList.then((response: { text: () => any; }) => response.text()),   // Assuming text/HTML response
                    // Resolve template promises (already initiated)
                    ...props.templates.map((t: { template: any; }) => t.template)
                ]);

                const agenciesListData = results[0]; // Type this if structure is known (e.g., { addresses: any[] })
                const reviewListHtml = results[1] as string;
                const templateBuffers = results.slice(2) as ArrayBuffer[];

                // Assign resolved templates back to properties.templates
                props.templates.forEach((templateMeta: { template: Promise<ArrayBuffer>; }, index: number) => {
                    // Re-wrap in a resolved promise if needed elsewhere, or just store buffer
                    templateMeta.template = Promise.resolve(templateBuffers[index]);
                });

                // Process obligation rows
                props.obligationRows = props.obligationRows.map((row: ObligationRowData): ObligationRowData => {
                    const noticeNumber = row['Notice Number'];
                    const dueDate = row['Due Date'];
                    const noticeStatus = row['Notice Status/Previous Status'];

                    let isLapsed = false;
                    if (dueDate) {
                        const dateParts = dueDate.split("/");
                        if (dateParts.length === 3) {
                            // Check date format before creating Date object
                            const year = parseInt(dateParts[2], 10);
                            const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
                            const day = parseInt(dateParts[0], 10);
                            if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                                isLapsed = new Date(year, month, day).getTime() < Date.now();
                            }
                        }
                    }

                    return {
                        ...row, // Spread existing row data
                        Obligation: noticeNumber,
                        Balance_Outstanding: row['Balance Outstanding'],
                        Infringement: row['Infringement No.'],
                        Offence: row['Offence'],
                        OffenceDate: row['Offence Date'],
                        IssueDate: row['Issued'],
                        altname: agencyLookup[noticeNumber] ?? 'Unknown Agency', // Use lookup
                        NoticeStatus: noticeStatus,
                        ProgressionDate: dueDate,
                        NFDlapsed: noticeStatus === 'SELDEA' || noticeStatus === 'WARRNT' || (isLapsed && noticeStatus === 'NFDP')
                    };
                });

                // Parse review list HTML
                const parser = new DOMParser();
                const reviewDoc = parser.parseFromString(reviewListHtml, 'text/html');
                const reviewTable = reviewDoc.querySelector("#DebtorDecisionCtrl_DebtorNoticesTable_tblData") as HTMLTableElement | null;

                if (reviewTable) {
                    const reviewTableData = parseTable(reviewTable);
                    reviewTableData.forEach(reviewdata => {
                        const challengeCode = reviewdata['Challenge Code'] as keyof typeof challengeList;
                        const ob = props.obligationRows.find((data: { Obligation: string; }) => reviewdata['Notice Number'] == data.Obligation);
                        if (ob) {
                            ob.Challenge = challengeList[challengeCode] ?? 'Unknown Challenge'; // Use lookup
                        }
                    });
                } else {
                    console.warn("Review table not found in fetched HTML.");
                }

                // Prepare base letter data
                const baseLetterData: any = { // Use 'any' for flexibility initially, refine if possible
                    "First_Name": toTitleCaseHypen(toTitleCase(props.firstName ?? '')).trim().split(" ")[0],
                    "Last_Name": toTitleCaseHypen(toTitleCase(props.lastName ?? '')).trim(),
                    "Company_Name": props.Is_Company ? toTitleCase(props.companyName ?? '').trim() : undefined,
                    "Is_Company": props.Is_Company ?? false,
                    "Address_1": toTitleCase(props.Address?.Address_1 ?? '').trim(),
                    "Town": props.Address?.Town ?? '',
                    "Town2": toTitleCase(props.Address?.Town ?? ''), // Duplicate?
                    "State": props.Address?.State ?? '',
                    "Post_Code": props.Address?.Post_Code,
                    "Debtor_ID": props.DebtorId,
                    "Challenge": props.obligationRows?.[0]?.Challenge ?? props.challengeType ?? 'No Challenge Logged',
                    "UserID": await getData('userName') // Assuming getData returns Promise<string | undefined>
                };

                baseLetterData.OnlyNFDLapsed = !(props.obligationRows?.some((row: { NFDlapsed: boolean; }) => row.NFDlapsed === false) ?? false);

                // Enhance base data with AppData
                await getAppData(baseLetterData); // Modifies baseLetterData in place

                // Address formatting (make safer)
                const replacements: [RegExp, string][] = [
                    [/ Gr$/i, " Grove"], [/ St$/i, " Street"], [/ Dr$/i, " Drive"], [/ Ct$/i, " Court"],
                    [/ Rd$/i, " Road"], [/ Ave?$/i, " Avenue"], [/ Cre?s?$/i, " Crescent"], [/ Pl$/i, " Place"],
                    [/ Tce$/i, " Terrace"], [/ Bvd$/i, " Boulevard"], [/ Cl$/i, " Close"], [/ Cir$/i, " Circle"],
                    [/ Pde$/i, " Parade"], [/ Cct$/i, " Circuit"], [/ Wy$/i, " Way"], [/ Esp$/i, " Esplanade"],
                    [/ Sq$/i, " Square"], [/ Hwy$/i, " Highway"], [/^Po /i, "PO "]
                ];
                let address1 = baseLetterData.Address_1 || '';
                replacements.forEach(([regex, replacement]) => {
                    address1 = address1.replace(regex, replacement);
                });
                baseLetterData.Address_1 = address1;


                // Prepare final letter data array
                props.letterData = [];

                if (props.agency && agenciesListData?.addresses) { // Check agenciesListData structure
                    let groupedByAgency = groupBy(props.obligationRows ?? [], 'altname');
                    // Ensure mergeById handles potential missing data gracefully
                    groupedByAgency = mergeById(groupedByAgency, agenciesListData.addresses, "altname", "altname"); // Assuming 'altname' matches key in addresses
                    props.letterData.push(...groupedByAgency.map((item: any) => ({ ...item, ...baseLetterData, kind: "Agency" })));
                }

                if (!props.letters.includes("Notice of Deregistration")) { // Check if debtor letter is needed
                    // Ensure 'a' property is expected by downstream consumers
                    props.letterData.push({ ...baseLetterData, a: props.obligationRows, kind: "Debtor" });
                }

                const storageUpdate: ChromeStorageData = { 'obligationsCount': 0, "obligationsCountFixed": 10 };
                chrome.storage.local.set(storageUpdate);

                // Generate letters
                if (!props.letterData || props.letterData.length === 0) {
                    console.log("No letter data generated.");
                    running = false; // Reset lock
                    return;
                }

                for (const data of props.letterData) {
                    // Determine letter type and find corresponding template meta
                    const userId = String(data.UserID ?? 'UnknownUser'); // Ensure UserID is string
                    const nameForFilename = data.Is_Company ? data.Company_Name : `${data.First_Name?.charAt(0)} ${data.Last_Name}`;
                    const letterTypeMap = letterTypes(data.a ?? [], data.enforcename ?? 'UnknownAgency', nameForFilename ?? 'UnknownName', userId); // Provide defaults

                    const templateMeta = props.templates?.find((template: { kind: any; }) => template.kind === data.kind);

                    if (!templateMeta) {
                        console.warn(`No template found for kind: ${data.kind}`);
                        continue; // Skip if no template
                    }

                    const letterTypeName = templateMeta.letter as keyof typeof letterTypeMap;
                    const specificLetterType = letterTypeMap[letterTypeName];

                    if (!specificLetterType) {
                        console.warn(`No letter type definition found for: ${letterTypeName}`);
                        continue; // Skip if no definition
                    }

                    // Calculate selected obligation value
                    data.selectedObValue = '$' + formatMoney((data.a ?? []).reduce((t: number, o: ObligationRowData) => t + Number(String(o.Balance_Outstanding || '0').replace(/[^0-9.-]+/g, "")), 0));

                    // Add dynamic properties based on letter type Props
                    if (specificLetterType.Props) {
                        const dates = getDates(); // Get dates once if needed
                        specificLetterType.Props.forEach(prop => {
                            data[prop] = true; // Default value
                            if (prop === "todayplus14") data[prop] = dates.todayplus14;
                            if (prop === "todayplus28") data[prop] = dates.todayplus28;
                            if (prop === "todayplus21") data[prop] = dates.todayplus21;
                            // Add other specific prop handlers if necessary
                        });
                    }

                    // Resolve the template promise before calling makeLetter
                    const templateBuffer = await templateMeta.template;

                    // Assuming makeLetter matches the inferred type
                    (makeLetter as MakeLetterType)(data, templateBuffer, specificLetterType.filename);

                    // Email generation logic (ensure emailMaker is defined and typed)
                    if (data.MOU === true &&
                        !props.letters.some((type: string) => type === 'Agency Fee Removal' || type === "Notice of Deregistration")) {
                        const agencyTemplateMeta = props.templates?.find((template: { kind: string; }) => template.kind === 'Agency');
                        if (agencyTemplateMeta) {
                            emailMaker(data, [data.AgencyEmail, 'MOU', agencyTemplateMeta.letter]);
                        }
                    }
                }

            } catch (error) {
                console.error("Error during afterAction processing:", error);
                // Rethrow or handle as appropriate
                throw error;
            } finally {
                running = false; // Ensure lock is always reset
            }
        }
    };
}

// --- Helper Functions with Types ---

function getAppData(data: any): Promise<Record<string, any[]>> { // Improve 'any' if possible
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['value'], (items: ChromeStorageData) => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
                return reject(chrome.runtime.lastError);
            }
            const applicationData = items.value ?? {};
            data.tParty = false; // Default
            data.legalCentre = false; // Default

            for (const applicationKey in applicationData) {
                const appDetails = applicationData[applicationKey];
                // Check array length before accessing indices
                if (Array.isArray(appDetails) && appDetails.length > 18 && appDetails[0] === data.Debtor_ID) {
                    data.legalCentre = false; // Reset per application check
                    if (appDetails[1] === true) { // Assuming index 1 indicates tParty status
                        data.tParty = true;
                        data.applicantName = appDetails[2];
                        data.appOrganisation = appDetails[3];
                        data.appStreet = appDetails[4];
                        data.appTown = appDetails[5];
                        data.appState = appDetails[6];
                        data.appPost = appDetails[7];
                        data.legalCentre = appDetails[17]; // Potential Legal Centre flag for main 3rd party

                        // Determine recipient based on flags at indices 8, 9, 10
                        if (appDetails[8] === true) {
                            data.recipient = '3rd Party';
                        } else if (appDetails[9] === true) {
                            data.recipient = 'Debtor';
                        } else if (appDetails[10] === true) {
                            data.recipient = 'Alt 3rd Party';
                            data.altApplicantName = appDetails[11];
                            data.altAppOrganisation = appDetails[12];
                            data.altAppStreet = appDetails[13];
                            data.altAppTown = appDetails[14];
                            data.altAppState = appDetails[15];
                            data.altAppPost = appDetails[16];
                            // Assuming index 18 is the legal centre flag specifically for Alt 3rd Party
                            data.legalCentre = appDetails[18]; // Overwrite if Alt 3rd party is chosen
                        } else {
                            // Default recipient if no flag is set?
                            data.recipient = 'Unknown'; // Or Debtor/3rd Party based on data.tParty?
                        }
                        break; // Found matching debtor, stop searching
                    } else {
                        // Debtor ID matched, but tParty flag (index 1) is false
                        data.tParty = false;
                        // Potentially break here too if only one entry per Debtor_ID is expected
                        break;
                    }
                }
            }
            // Resolve with the original retrieved items.value structure
            resolve(items.value ?? {});
        });
    });
}


function loadLetter(url: string): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        JSZipUtils.getBinaryContent(url, (err, data) => {
            if (err) {
                console.error("Error loading letter template:", err);
                running = false; // Reset lock on error
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

const addressPriority: string[] = ["Postal Address", "Residential Address", "Unknown Address"];

const challengeList: Record<string, string> = {
    "E_EXCIRCUM": "Exceptional circumstances",
    "E_PERUNAWR": "Person unaware",
    "E_SPCIRCUM": "Special circumstances",
    "E_CONTRLAW": "Contrary to the law",
    "E_MISTAKID": "Mistake of identity"
};

// Ensure all keys used in code exist here
const letterURL: Record<string, string> = {
    'Agency Enforcement Cancelled': "21860542",
    'Agency Fee Removal': "12918361",
    'Enforcement Confirmed': "21908189",
    'Enforcement Cancelled': "21864380",
    "ER Confirm/ FW Grant": "21922728",
    'Report Needed': "12918375",
    'Wrong person applying. No grounds': "12918368",
    'Paid in full. Ineligible': "12918367",
    'Outside Person Unaware. Ineligible': "12918370", // Used twice in original JS? Check logic
    'Offence n/e Person Unaware. No grounds': "12918370", // Used twice in original JS? Check logic
    'Unable to Contact Applicant': "12918377",
    'Claim of payment adv contact agency': "14513448",
    'Notice of Deregistration': "14688539",
    'Further Information Required': "15102090",
    'FVS Eligible Debtor': "15104893",
    'FVS Eligible Agency': "15104895",
    'FVS Ineligible': "15111337",
    'FVS Further Information Required': "15111404",
    'PSL': "15119430",
    'Suspension of driver licence': "15531068",
    "Suspension of vehicle registration - Ind": "17470564",
    "Suspension of vehicle registration - Corp": "17470563",
    'Court Fine Fee Waive Granted': "EXKiK2Ln98ZFq1RNxyVlAuIB9XFcwmEu0u-wn-u9xLRaeg", // Different format?
    "Special Circumstances No grounds": "18754905", // Duplicate key? Check logic
    "POI - direction to produce": "21266650",
    "PA Refused - Active 7DN": "21379969",
    "No Grounds": "21781572", // Duplicate key? Check logic
    "PA Refused": "21780824",
    "EOT Refused": "21781515",
    "PA Refused-Sanction": "21538164",
    "PA App Incomplete": "21543595",
    "Company PA Ineligible SZWIP": "21543668",
    "EOT Refused - Infringements stage": "21547909",
    "PA Refused Expired 7DN": "21554295",
    "Fee Removal PIF": "21569882",
    "CF Fee Removal Granted": "21588427",
    "CF Fee Removal Refused": "21623835",
    'Fee Removal Refused': "21625790", // Duplicate key? Check logic
    'FR Refused - Active 7DN': "21630687",
    'FW Refused - Sanction': "21642104",
    "FR Granted": "21602358",
    "Agency FR Granted": "21609844",
    "FR Granted - Active 7DN": "21575815",
    "FR Granted - Sanction": "21582960",
    "Ineligible for ER - offence type": "21720126",
    "Court not an option": "21746214",
    "ER Ineligible Deregistered Company": "21758558",
    "Ineligible Paid in full": "21761625", // Duplicate key? Check logic
    "Appeal not available": "21761877",
    "Nomination Not Grounds": "21767490",
    "ER Ineligible Court Fine": "21771157",
    "Spec Circ Options": "21774656",
    "ER Additional Info": "21738969",
    "Ineligible for ER enforcement action": "21745145",
    "Ineligible PU - Outside Time": "21787906",
    "Ineligible for ER previous review": "21790863",
    "ER Ineligible PU": "21794412",
    "Claim of payment to agency": "21797592", // Duplicate key? Check logic
    "Request for photo evidence": "21811532",
    "Ineligible Incorrect company applying": "21815023",
    "Spec Circ No Grounds": "21825433", // Duplicate key? Check logic
    "Spec Circ Report Required": "21827269",
    "Unauthorised 3rd party applying": "21834939",
    "Ineligible Incorrect person applying": "21846719",
    "Spec Circ App Required": "21976745",
    "Spec Circ Report Insufficient": "21979090",
    "SC 3P Lawyer - Report Insufficient": "21977719",
    "ER Application Incomplete": "21982730",
    "SC 3P Lawyer - Report Required": "21991100",
    "ER Confirm/FW Grant - Active 7DN": "21993681",
    "ER Confirm/FW Grant - 7DN Expired option": "21993728",
    // Add any missing ones like 'Agency Enforcement Cancelled Updated' if needed
    'Agency Enforcement Cancelled Updated': "MISSING_ID", // Placeholder
};

function padTo2Digits(num: number): string {
    return num.toString().padStart(2, '0');
}

function formatDate(date: Date = new Date()): string {
    return [
        date.getFullYear(),
        padTo2Digits(date.getMonth() + 1), // Month is 0-indexed
        padTo2Digits(date.getDate()),
    ].join('');
}

// Returns a map of letter names to their definitions (filename, props)
function letterTypes(
    obligationRows: ObligationRowData[],
    enforcename: string,
    name: string,
    UserID: string
): Record<string, LetterTypeDef> {
    const o = obligationRows ?? [];
    const OBL = o.length === 1 ? " OBL " + o[0]?.Obligation : " x " + o.length;
    const firstChallenge = o[0]?.Challenge;
    const ReviewType = firstChallenge === "Special circumstances" ? "ER Special" : firstChallenge !== undefined ? "ER General" : undefined;
    const dt = formatDate(); // Calculate date once

    // Build the map directly
    const types: Record<string, LetterTypeDef> = {
        'Agency Enforcement Cancelled': { filename: `${enforcename} - Cancelled${OBL} ${name} - ${UserID} - ${dt}` },
        'Agency Fee Removal': { filename: `${enforcename} - Fee Removal - Granted${OBL} ${name} - ${UserID} - ${dt}` },
        'Enforcement Confirmed': { filename: `${ReviewType ?? 'Review'} - Confirmed${OBL} ${name} - ${UserID} - ${dt}` },
        'Enforcement Cancelled': { filename: `${ReviewType ?? 'Review'} - Cancelled${OBL} ${name} - ${UserID} - ${dt}` },
        'ER Confirm/ FW Grant': { filename: `${ReviewType ?? 'Review'} - Confirmed With Fee Removal - Granted${OBL} ${name} - ${UserID} - ${dt}`, Props: ["ECCV"] },
        'Report Needed': { filename: `Report Needed${OBL} ${name} - ${UserID} - ${dt}`, Props: ["todayplus14"] },
        'Further Information Required': { filename: `Further Information Required${OBL} ${name} - ${UserID} - ${dt}`, Props: ["todayplus14"] },
        'Wrong person applying. No grounds': { filename: `No Grounds${OBL} ${name} - ${UserID} - ${dt}` },
        'Paid in full. Ineligible': { filename: `Paid In Full${OBL} ${name} - ${UserID} - ${dt}` },
        'Outside Person Unaware. Ineligible': { filename: `Outside Person Unware${OBL} ${name} - ${UserID} - ${dt}`, Props: ["Person_unaware_1"] },
        'Offence n/e Person Unaware. No grounds': { filename: `No Grounds Person Unware${OBL} ${name} - ${UserID} - ${dt}`, Props: ["Person_unaware_2"] },
        'Unable to Contact Applicant': { filename: `Unable To Contact Applicant${OBL} ${name} - ${UserID} - ${dt}` },
        'Special Circumstances No grounds': { filename: `No Grounds${OBL} ${name} - ${UserID} - ${dt}` }, // Duplicate?
        'Claim of payment adv contact agency': { filename: `Cont Agency${OBL} ${name} - ${UserID} - ${dt}` },
        'Notice of Deregistration': { filename: `Notice Of Deregistration${OBL} ${name} - ${UserID} - ${dt}` },
        'FVS Eligible Debtor': { filename: `${name} - FVS Eligible${OBL}`, Props: ["todayplus28"] },
        'FVS Eligible Agency': { filename: `${name} - ${enforcename} - FVS Eligible${OBL}` },
        'FVS Ineligible': { filename: `${name} - ${enforcename} - FVS Ineligible${OBL}` },
        'FVS Further Information Required': { filename: `${name} - ${enforcename} - FVS Further Information Required${OBL}`, Props: ["todayplus21"] },
        'Suspension of driver licence': { filename: `${name} - Suspension of driver licence${OBL}` },
        'Suspension of vehicle registration - Ind': { filename: `${name} - Suspension of vehicle registration${OBL}` },
        'Suspension of vehicle registration - Corp': { filename: `${name} - Suspension of vehicle registration${OBL}` },
        'PSL': { filename: `${name} - PSL${OBL}` },
        'Court Fine Fee Waive Granted': { filename: `Court Fine - Fee Removal - Granted${OBL} ${name} - ${UserID} - ${dt}` },
        'POI - direction to produce': { filename: `${name} - POI - direction to produce${OBL}`, Props: ["todayplus28"] },
        'PA Refused - Active 7DN': { filename: `${name} - PA Refused - Active 7DN${OBL}`, Props: ["todayplus28"] },
        'No Grounds': { filename: `No Grounds${OBL} ${name} - ${UserID} - ${dt}`, Props: ["No_Grounds"] }, // Duplicate?
        'PA Refused': { filename: `PA Refused${OBL} ${name} - ${UserID} - ${dt}` },
        'EOT Refused': { filename: `EOT Refused${OBL} ${name} - ${UserID} - ${dt}` },
        'PA Refused-Sanction': { filename: `PA Refused-Sanction${OBL} ${name} - ${UserID} - ${dt}` },
        'PA App Incomplete': { filename: `PA App Incomplete${OBL} ${name} - ${UserID} - ${dt}` },
        'Company PA Ineligible SZWIP': { filename: `Company PA Ineligible SZWIP${OBL} ${name} - ${UserID} - ${dt}` },
        'EOT Refused - Infringements stage': { filename: `EOT Refused - Infringements stage${OBL} ${name} - ${UserID} - ${dt}` },
        'PA Refused Expired 7DN': { filename: `PA Refused Expired 7DN${OBL} ${name} - ${UserID} - ${dt}` },
        'Fee Removal PIF': { filename: `Fee Removal PIF${OBL} ${name} - ${UserID} - ${dt}` },
        'CF Fee Removal Granted': { filename: `CF Fee Removal Granted${OBL} ${name} - ${UserID} - ${dt}` },
        'CF Fee Removal Refused': { filename: `CF Fee Removal Refused${OBL} ${name} - ${UserID} - ${dt}` },
        'Fee Removal Refused': { filename: `Fee Removal Refused${OBL} ${name} - ${UserID} - ${dt}` }, // Duplicate?
        'FR Refused - Active 7DN': { filename: `FR Refused - Active 7DN${OBL} ${name} - ${UserID} - ${dt}` },
        'FW Refused - Sanction': { filename: `FW Refused - Sanction${OBL} ${name} - ${UserID} - ${dt}` },
        'FR Granted': { filename: `FR Granted${OBL} ${name} - ${UserID} - ${dt}` },
        'Agency FR Granted': { filename: `${enforcename} - Agency FR Granted${OBL} ${name} - ${UserID} - ${dt}` },
        'FR Granted - Active 7DN': { filename: `FR Granted - Active 7DN${OBL} ${name} - ${UserID} - ${dt}` }, // Enforce name was here?
        'FR Granted - Sanction': { filename: `FR Granted - Sanction${OBL} ${name} - ${UserID} - ${dt}` },
        'Ineligible for ER - offence type': { filename: `Ineligible for ER - offence type${OBL} ${name} - ${UserID} - ${dt}` },
        'Court not an option': { filename: `Court not an option${OBL} ${name} - ${UserID} - ${dt}` },
        'ER Ineligible Deregistered Company': { filename: `ER Ineligible Deregistered Company${OBL} ${name} - ${UserID} - ${dt}` },
        'Ineligible Paid in full': { filename: `Ineligible Paid in full${OBL} ${name} - ${UserID} - ${dt}` }, // Duplicate?
        'Appeal not available': { filename: `Appeal not available${OBL} ${name} - ${UserID} - ${dt}` },
        'Nomination Not Grounds': { filename: `Nomination Not Grounds${OBL} ${name} - ${UserID} - ${dt}` },
        'ER Ineligible Court Fine': { filename: `ER Ineligible Court Fine${OBL} ${name} - ${UserID} - ${dt}` },
        'Spec Circ Options': { filename: `Spec Circ Options${OBL} ${name} - ${UserID} - ${dt}` },
        'ER Additional Info': { filename: `ER Additional Info${OBL} ${name} - ${UserID} - ${dt}` },
        'Ineligible for ER enforcement action': { filename: `Ineligible for ER enforcement action${OBL} ${name} - ${UserID} - ${dt}` },
        'Ineligible PU - Outside Time': { filename: `Ineligible PU - Outside Time${OBL} ${name} - ${UserID} - ${dt}` },
        'Ineligible for ER previous review': { filename: `Ineligible for ER previous review${OBL} ${name} - ${UserID} - ${dt}` },
        'ER Ineligible PU': { filename: `ER Ineligible PU${OBL} ${name} - ${UserID} - ${dt}` },
        'Claim of payment to agency': { filename: `Claim of payment to agency${OBL} ${name} - ${UserID} - ${dt}` }, // Duplicate?
        'Request for photo evidence': { filename: `Request for photo evidence${OBL} ${name} - ${UserID} - ${dt}` },
        'Ineligible Incorrect company applying': { filename: `Ineligible Incorrect company applying${OBL} ${name} - ${UserID} - ${dt}` },
        'Spec Circ No Grounds': { filename: `Spec Circ No Grounds${OBL} ${name} - ${UserID} - ${dt}` }, // Duplicate?
        'Spec Circ Report Required': { filename: `Spec Circ Report Required${OBL} ${name} - ${UserID} - ${dt}` },
        'Unauthorised 3rd party applying': { filename: `Unauthorised 3rd party applying${OBL} ${name} - ${UserID} - ${dt}` },
        'Ineligible Incorrect person applying': { filename: `Ineligible Incorrect person applying${OBL} ${name} - ${UserID} - ${dt}` },
        'Spec Circ App Required': { filename: `Spec Circ App Required${OBL} ${name} - ${UserID} - ${dt}` },
        'Spec Circ Report Insufficient': { filename: `Spec Circ Report Insufficient${OBL} ${name} - ${UserID} - ${dt}` },
        'SC 3P Lawyer - Report Insufficient': { filename: `SC 3P Lawyer - Report Insufficient${OBL} ${name} - ${UserID} - ${dt}` },
        'ER Application Incomplete': { filename: `ER Application Incomplete${OBL} ${name} - ${UserID} - ${dt}` },
        'SC 3P Lawyer - Report Required': { filename: `SC 3P Lawyer - Report Required${OBL} ${name} - ${UserID} - ${dt}` },
        'ER Confirm/FW Grant - Active 7DN': { filename: `ER Confirm/FW Grant - Active 7DN${OBL} ${name} - ${UserID} - ${dt}` },
        'ER Confirm/FW Grant - 7DN Expired option': { filename: `ER Confirm/FW Grant - 7DN Expired option${OBL} ${name} - ${UserID} - ${dt}` },
        // Add any missing letter types referenced elsewhere
        'Agency Enforcement Cancelled Updated': { filename: `${enforcename} - Cancelled Updated${OBL} ${name} - ${UserID} - ${dt}` }, // Example
    };

    return types;
}

// Generic types T and U, K is key property name
function mergeById<
    // IDType: The type of the property used for matching (e.g., string, number)
    IDType extends PropertyKey, // PropertyKey is string | number | symbol
    K extends PropertyKey,      // Type of the key in T
    L extends PropertyKey,      // Type of the key in U
    // T may have an optional property K of type IDType
    T extends { [P in K]?: IDType },
    // U must have a property L of type IDType
    U extends Record<L, IDType>
>(
    a1: T[],
    a2: U[],
    property1: K,
    property2: L
    // The return type implies all items from a1 are returned,
    // potentially merged with properties from a matching U item.
    // Using Partial<U> because a match isn't guaranteed for every T.
): (T & Partial<U>)[] {

    // Create a Map for efficient lookups based on property2 values from a2
    const mapU = new Map<IDType, U>();
    for (const item of a2) {
        // Ensure item has the property before setting
        if (Object.prototype.hasOwnProperty.call(item, property2)) {
            mapU.set(item[property2], item);
        }
    }

    return a1.map(itm => {
        // Look up the corresponding item from a2 using the map
        // Skip undefined properties
        const propValue = itm[property1];
        if (propValue === undefined) {
            return itm as T & Partial<U>;
        }
        const matchingItem = mapU.get(propValue as IDType);

        // Spread itm first, then add/override with properties from matchingItem if it exists.
        // If matchingItem is undefined, spreading it results in no added properties.
        // The type assertion `{} as U` is no longer needed due to Partial<U> return type.
        return { ...itm, ...(matchingItem ?? {}) };
    });
}

function toTitleCase(str: string): string {
    if (!str) return "";
    return str.replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
    );
}

function toTitleCaseHypen(str: string): string {
    if (!str) return "";
    return str.toLowerCase().replace(/(?:^|\s|\/|-)\w/g, (match) => match.toUpperCase());
}

// Specify return type more accurately if known (e.g., string | number | undefined)
function getData(sKey: keyof ChromeStorageData): Promise<any> {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(sKey, (items: Partial<ChromeStorageData>) => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
                reject(chrome.runtime.lastError);
            } else {
                resolve(items[sKey]);
            }
        });
    });
}

// --- HTML Table Parsing Utilities ---

function mapRow(headings: string[]): (row: HTMLTableRowElement) => ParsedTableRow {
    return ({ cells }: HTMLTableRowElement): ParsedTableRow => {
        return Array.from(cells).reduce((result, cell, i) => {
            const input = cell.querySelector<HTMLInputElement | HTMLSelectElement>("input,select");
            let value: string | boolean;

            if (input) {
                value = input.type === "checkbox" ? (input as HTMLInputElement).checked : input.value;
            } else {
                // Use textContent for potentially better consistency than innerText
                value = cell.textContent?.trim() ?? '';
            }

            // Use heading if available, otherwise use index as key
            const key = headings[i] ?? `column_${i}`;
            result[key] = String(value); // Convert boolean/number to string for consistency? Or allow mixed types? Let's keep string for now.
            return result;
        }, {} as ParsedTableRow);
    };
}

export function parseTable(table: HTMLTableElement | null): ParsedTableRow[] {
    if (!table?.tHead?.rows?.[0]?.cells || !table?.tBodies?.[0]?.rows) {
        console.warn("Table structure incomplete for parsing:", table);
        return [];
    }
    // Header parsing with robust check and fallback
    const headings = Array.from(table.tHead.rows[0].cells).map(
        heading => (heading.textContent ?? '').replace(/ ▲ \d| ▼ \d/g, "").trim() // Use textContent and trim
    );
    // Body parsing with robust check
    return Array.from(table.tBodies[0].rows).map(mapRow(headings));
}


function convertArrayToObject<T extends Record<string, any>>(array: T[], key: keyof T): Record<string, T> {
    const initialValue: Record<string, T> = {};
    return array.reduce((obj, item) => {
        const keyValue = String(item[key]); // Ensure key is a string
        obj[keyValue] = item;
        return obj;
    }, initialValue);
}


function groupBy(arr: any[], property: string) {
    return arr.reduce(function (memo, x) {
        console.log()
        if (!memo.some((item: { [x: string]: any; }) => item[property] === x[property])) { memo.push({ [property]: x[property], a: [] }) }
        memo.map((itm: { [x: string]: any; a: any[]; }) => itm[property] === x[property] && itm.a.push(x))
        return memo;
    }, []);
}

function formatMoney(amount: number | string | null | undefined, decimalCount: number = 2, decimal: string = ".", thousands: string = ","): string {
    try {
        decimalCount = Math.abs(decimalCount);
        decimalCount = isNaN(decimalCount) ? 2 : decimalCount;

        const amountNum = Math.abs(Number(amount) || 0); // Ensure number and positive
        const negativeSign = Number(amount) < 0 ? "-" : "";

        const i = parseInt(amountNum.toFixed(decimalCount), 10).toString();
        const j = i.length > 3 ? i.length % 3 : 0;

        return (
            negativeSign +
            (j ? i.substring(0, j) + thousands : '') +
            i.substring(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands) +
            (decimalCount ? decimal + Math.abs(amountNum - parseInt(i, 10)).toFixed(decimalCount).slice(2) : "")
        );
    } catch (e) {
        console.error("Error formatting money:", e);
        return String(amount ?? ''); // Return original string or empty on error
    }
}