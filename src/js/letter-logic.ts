/*eslint no-implicit-coercion: ["error", { "disallowTemplateShorthand": true }]*/
import { getDates } from "./emailmaker";
import { ChromeStorageData, letterDataProps, Message, paramArrayObject, ParsedTableRow, ProcessConfig, Properties, Template } from "./types";
// Assuming makeLetter takes data, template buffer, and filename
import { DebtorData } from './sharedUtils'; // Adjust import path as needed
import { initialiseWorkbookProcesser } from './xlsxConverter'; // Adjust import path as needed
import { saveAs } from 'file-saver';
import { CONFIG_WORKBOOK_URL } from "./config";

const workbook = initialiseWorkbookProcesser(CONFIG_WORKBOOK_URL)

// --- Letter Generation Configuration ---
export function letterGen(properties: Properties): ProcessConfig {
    return {
        stepGroup: {
            obligationsGroup: () => {
                properties.agencies = properties.agencies ?? []; // Initialize if undefined
                if (properties.IncludesAgencyCorrespondence || properties.RequiresExtendedAttributes) {
                    const obligations = properties.VIEWObligationData
                    properties.obligationsCountFixed = 0;
                    properties.obligationsCount = 0;
                    if (!obligations) {
                        console.error("Obligations are undefined or empty.");
                        return [] as paramArrayObject[]; // Return empty array if obligations are not available
                    }
                    obligations.filter(obligation => obligation["Input Type"].includes('1A'))
                        .forEach(obligation => properties.agencies!.push({ key: obligation["Notice Number"], value: "TRAFFIC CAMERA OFFICE" }));
                    obligations.filter(obligation => obligation["Input Type"].includes('1B'))
                        .forEach(obligation => properties.agencies!.push({ key: obligation["Notice Number"], value: "VICTORIA POLICE TOLL ENFORCEMENT OFFICE" }));
                    return obligations.filter(obligation => !obligation["Input Type"].includes('1B') && !obligation["Input Type"].includes('1A'))
                        .map(data => {
                            if (!properties?.obligationsCountFixed) {
                                console.error("obligationCountFixed is undefined.");
                                return {} as paramArrayObject; // Return empty array if obligationCountFixed is not available
                            }
                            if (!properties?.obligationsCount) {
                                console.error("obligationsCount is undefined.");
                                return {} as paramArrayObject; // Return empty array if obligationCountFixed is not available
                            }
                            properties.obligationsCountFixed++
                            properties.obligationsCount++
                            return {
                                "txtNoticeNo": data["Notice Number"]
                            } as paramArrayObject;
                        });
                } else {
                    return [] as paramArrayObject[];
                }
            },
            getUserId: async () => {
                const userId = await chrome.runtime.sendMessage<Message>({ type: 'getStorage', data: { key: "UserId" } });
                if (!userId) {
                    return [{}] as paramArrayObject[]; // Return empty array if UserId is not available
                }
                return [] as paramArrayObject[];
            },
            /**
             * Sets the default challenge type based on the first selected obligation if no challenge is logged.
             * @returns {txtNoticeNo: string}[] - Returns an array of obligation objects with the obligation number.
             */
            "getDefaultChallenge": () => {
                const paramArray = [];
                // Ensure obligationRows exists and has at least one element
                if (properties.VIEWObligationData?.[0]?.['Notice Status/Previous Status'] &&
                    !properties.VIEWObligationData[0]['Notice Status/Previous Status'].includes('CHLGLOG')) {
                    paramArray.push({ "txtNoticeNo": properties.VIEWObligationData[0]["Notice Number"] });
                }
                return paramArray;
            }
        },
        steps: [
            {
                url: `https://${properties.VIEWEnvironment}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorAddresses.aspx`,
                urlParams: async ({ properties }): Promise<void> => {
                    // Ensure chrome storage types are correct
                    chrome.runtime.sendMessage<Message>({ type: 'setStorage', data: { key: "obligationsCount", value: 10 } });
                    chrome.runtime.sendMessage<Message>({ type: 'setStorage', data: { key: "obligationsCountFixed", value: 10 } });
                    if (!properties) {
                        throw new Error("Properties are undefined.");
                    }
                    properties.agenciesList = await (await workbook).fetchAndConvertXlsxToJson({
                        Sheet: "Agencies"
                    })

                    properties.reviewList = fetch(`https://${properties.VIEWEnvironment}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorDecisionReview.aspx`);
                    if (!properties.letters) {
                        throw new Error(`Letters are undefined.`);
                    }

                    /** Get templates and associated metadata */
                    properties.templates = properties.letters.map(async (letter): Promise<Template> => {

                        const getColumnData = (await workbook).fetchAndConvertXlsxToJson

                        const templateURL = await getColumnData({
                            Sheet: "Templates",
                            Column: "Link"
                        })

                        const templateKind = await getColumnData<Record<string, Template["kind"]>, "Recipient">({
                            Sheet: "Templates",
                            Column: "Recipient"
                        })

                        const templateKindValue = Object.values(templateKind)[0];

                        const urlKey = letter as keyof typeof templateURL; // Type assertion

                        const downloadCode = templateURL[urlKey];

                        if (!downloadCode) {
                            console.error(`No URL found for letter type: ${letter}`);
                            // Handle error appropriately - maybe return a dummy template promise?
                            throw new Error(`Missing URL configuration for letter: ${letter}`);
                        }
                        // if (downloadCode.includes("https://")) {

                        const letterTemplateURL = `https://vicgov.sharepoint.com/:w:/s/VG002447/${downloadCode}?download=1`;
                        return {
                            "kind": templateKindValue,
                            "letter": letter,
                            "template": loadLetter(letterTemplateURL, letter)
                        };
                    });

                },
                afterAction: ({ document, properties }) => {
                    if (!properties) {
                        throw new Error("Properties are undefined.");
                    }

                    if (!document) {
                        throw new Error("Document is undefined.");
                    }
                    const elementValueGetterById = createElementValueGetterById(document);
                    properties.DebtorId = elementValueGetterById("DebtorDetailsCtrl_DebtorIdSearch");
                    properties.lastName = elementValueGetterById("DebtorDetailsCtrl_surnameTxt");
                    properties.firstName = elementValueGetterById("DebtorDetailsCtrl_firstnameTxt");
                    properties.companyName = elementValueGetterById("DebtorDetailsCtrl_companyNameTxt");
                    properties.Is_Company = true;
                    if (properties.companyName === "") properties.Is_Company = false;
                    if (properties.companyName === undefined) properties.Is_Company = false;
                    let addressTableData = parseTable(document.querySelector("#DebtorAddressesCtrl_gridDebtorAddresses_tblData"));
                    let addressParts;

                    addressTableData = addressTableData.filter(function (row) {
                        return row["Best Address"] === "Y"
                    });

                    const addressObject = convertArrayToObject(addressTableData, "Type");

                    for (const priority of addressPriority) {
                        if (addressObject[priority] !== undefined) {
                            addressParts = addressObject[priority].Address.split(",")
                            addressParts.push(addressObject[priority].Postcode)
                            break;
                        }
                    }

                    if (addressParts === undefined) {
                        console.error("Address parts are undefined.");
                        return; // Exit if addressParts is not found
                    }

                    if (addressParts.length > 4) {
                        addressParts[1] = `${addressParts[0]}${addressParts[1]}`;
                        addressParts.shift();
                    }
                    properties.Address = {
                        "Address_1": addressParts[0].trim(),
                        "Town": addressParts[1].trim(),
                        "State": addressParts[2].trim(),
                        "Post_Code": addressParts[3] ? addressParts[3].trim() : undefined
                    }
                }
            },
            {
                group: "obligationsGroup",
                urlParams: function ({ iterationReference }) {
                    if (!iterationReference?.txtNoticeNo) {
                        throw new Error("iterationReference.txtNoticeNo is undefined. This is required to switch notices");
                    }

                    this.url = `https://${properties.VIEWEnvironment}.view.civicacloud.com.au/Traffic/Notices/forms/NoticesManagement/SearchNotice.aspx?&NoticeNo=${iterationReference.txtNoticeNo}`;
                    return {}; // Return empty object as params are in URL
                },
                afterAction: ({ document }): void => {
                    if (!document || !properties.obligationsCountFixed || properties.obligationsCount === undefined) return;

                    const progress = ((properties.obligationsCountFixed - properties.obligationsCount + 1) / properties.obligationsCountFixed) * 10; // Correct progress calculation
                    properties.obligationsCount--;
                    const storageData: ChromeStorageData = { 'obligationsCount': progress, "obligationsCountFixed": 10 }; // Consider if fixed should be dynamic
                    chrome.storage.local.set(storageData);

                    const noticeNo = (document.getElementById("NoticeInfo_txtNoticeNo") as HTMLInputElement)?.value;
                    const agencyCode = document.getElementById("NoticeInfo_lblAgencyCode")?.textContent;

                    if (noticeNo && agencyCode) {
                        properties.agencies = properties.agencies ?? [];
                        properties.agencies.push({ key: noticeNo, value: agencyCode });
                    } else {
                        console.warn("Could not extract notice number or agency code.");
                    }
                },
                clearVIEWFormData: true
            }, {
                group: "getDefaultChallenge",
                urlParams: function ({ iterationReference }) {
                    if (!iterationReference) {
                        throw new Error("iterationReference is undefined.");
                    }
                    this.url = `https://${properties.VIEWEnvironment}.view.civicacloud.com.au/Traffic/Notices/forms/NoticesManagement/SearchNotice.aspx?&NoticeNo=${iterationReference.txtNoticeNo}`;
                    return {};
                },
                clearVIEWFormData: true
            }, {
                group: "getDefaultChallenge",
                url: `https://${properties.VIEWEnvironment}.view.civicacloud.com.au/Traffic/Notices/Forms/NoticesManagement/NoticeChallengeHistory.aspx`,
                afterAction: ({ document }): void => {
                    if (!document) return;
                    const challengeText = document.querySelector("#lblChallengeCodeVal")?.textContent ?? '';
                    const match = challengeText.match(/Enforcement - (.*)/);
                    properties.challengeType = match ? match[1] : 'No Challenge Logged';
                },
                clearVIEWFormData: true
            }, {
                group: "getUserId",
                url: `https://${properties.VIEWEnvironment}.view.civicacloud.com.au/Taskflow/Forms/Management/TaskList.aspx?ProcessMode=User`,
                afterAction: ({ document }): void => {
                    if (!document) {
                        throw new Error("Document is undefined.");
                    }
                    const UserId = createElementValueGetterById(document)("ctl00_mainContentPlaceHolder_taskListOwnerLabel");
                    chrome.runtime.sendMessage<Message>({ type: 'setStorage', data: { key: "UserId", value: UserId } });
                },
                clearVIEWFormData: true
            }
        ],
        afterAction: async ({ properties }) => {
            if (!properties) {
                throw new Error("Properties are undefined");
            }
            if (properties.agencies === undefined) {
                throw new Error("Agencies are undefined");
            }

            const reduced = properties.agencies.reduce<Record<string, string>>((obj, item) => (obj[item.key] = item.value, obj), {});

            if (properties.agenciesList === undefined) {
                throw new Error("Agency list is undefined");
            }

            if (properties.obligationRows === undefined) {
                throw new Error("Obligation rows are undefined");
            }

            properties.obligationRows = properties.VIEWObligationData.map(row => {
                const infData = {
                    Obligation: row['Notice Number'],
                    Balance_Outstanding: row['Balance Outstanding'],
                    Infringement: row['Infringement No.'],
                    Offence: row['Offence'],
                    OffenceDate: row['Offence Date'],
                    IssueDate: row['Issued'],
                    altname: reduced[row['Notice Number']],
                    NoticeStatus: row['Notice Status/Previous Status'],
                    ProgressionDate: row['Due Date'],
                    NFDlapsed: false
                };

                const dateParts = infData.ProgressionDate.split("/");
                //convert dataParts to an object with year, month and day as numbers
                const datePartsObj = {
                    year: Number(dateParts[2]),
                    month: Number(dateParts[1]) - 1, // Month is 0-indexed in JS Date
                    day: Number(dateParts[0])
                };

                infData.NFDlapsed =
                    infData.NoticeStatus === 'SELDEA' || infData.NoticeStatus === 'WARRNT' ||
                    (new Date(datePartsObj.year, datePartsObj.month, datePartsObj.day).getTime() < new Date().getTime() && infData.NoticeStatus === 'NFDP')
                return infData;
            });

            const parser = new DOMParser()
            if (!properties.reviewList) {
                throw new Error("Review list is not available");
            }

            if (properties.reviewList instanceof Promise) {
                properties.reviewList = await properties.reviewList.then(response => { return response.text() });
            }

            if (typeof properties.reviewList !== 'string') {
                throw new Error("Review list is undefined or not a string");
            }

            const reviewDoc = parser.parseFromString(properties.reviewList, 'text/html');
            const reviewTableData = parseTable(reviewDoc.querySelector("#DebtorDecisionCtrl_DebtorNoticesTable_tblData"));

            reviewTableData.forEach(reviewdata => {
                if (!properties.obligationRows) {
                    throw new Error("Obligation rows are undefined");
                }
                const ob = properties.obligationRows.find(data => (reviewdata['Notice Number'] == data['Obligation']))
                if (ob !== undefined) ob.Challenge = challengeList[reviewdata['Challenge Code']]
            })

            //check if getData('userName') is a string after resolving. If it is not a string throw error:
            const userName = await chrome.runtime.sendMessage<Message>({ type: 'getStorage', data: { key: "userName" } }).then((res) => res.value);

            if (typeof userName !== 'string') {
                throw new Error("User name is not a string");
            }
            const letterData = {
                "First_Name": toTitleCaseHypen(toTitleCase(properties.firstName)).trim().split(" ")[0],
                "Last_Name": toTitleCaseHypen(toTitleCase(properties.lastName)).trim(),
                "Company_Name": properties.Is_Company ? toTitleCase(properties.companyName).trim() : undefined,
                "Is_Company": properties.Is_Company,
                "Address_1": toTitleCase(properties?.Address?.Address_1).trim(),
                "Town": properties.Address?.Town,
                "Town2": toTitleCase(properties.Address?.Town),
                "State": properties.Address?.State,
                "Post_Code": properties.Address?.Post_Code,
                "Debtor_ID": properties.DebtorId,
                "Challenge": properties.obligationRows[0].Challenge || properties.challengeType,
                "UserID": userName,
                "OnlyNFDLapsed": false
            }

            letterData.OnlyNFDLapsed = !properties.obligationRows.some(row => row.NFDlapsed === false);

            await getAppData(letterData);

            const replacements: [RegExp, string][] = [
                [/ Gr$/i, " Grove"],
                [/ St$/i, " Street"],
                [/ Dr$/i, " Drive"],
                [/ Ct$/i, " Court"],
                [/ Rd$/i, " Road"],
                [/ Ave?$/i, " Avenue"],
                [/ Cre?s?$/i, " Crescent"],
                [/ Pl$/i, " Place"],
                [/ Tce$/i, " Terrace"],
                [/ Bvd$/i, " Boulevard"],
                [/ Cl$/i, " Close"],
                [/ Cir$/i, " Circle"],
                [/ Pde$/i, " Parade"],
                [/ Cct$/i, " Circuit"],
                [/ Wy$/i, " Way"],
                [/ Esp$/i, " Esplanade"],
                [/ Sq$/i, " Square"],
                [/ Hwy$/i, " Highway"],
                [/^Po /i, "PO "]
            ];

            // Apply each replacement sequentially
            for (const [regex, replacementString] of replacements) {
                if (letterData.Address_1) { // Ensure Address_1 is not null or undefined
                    letterData.Address_1 = letterData.Address_1.replace(regex, replacementString);
                }
            }
            properties.letterData = []

            if (properties.IncludesAgencyCorrespondence) {
                properties.letterData = groupByArray(properties.obligationRows, 'altname');

                const mergeByIdProps = {
                    baseArray: properties.letterData,
                    matchArray: properties.agenciesList,
                    baseArrayKey: "altname",
                    matchArrayKey: "altname",
                }
                properties.letterData = mergeById(mergeByIdProps)

                properties.letterData = properties.letterData.map(item => ({ ...item, ...letterData, kind: "Agency" }));
            }
            if (!properties.letters) {
                throw new Error(`Letters are undefined.`);
            }

            if (properties.letters[0] !== "Notice of Deregistration") {
                properties.letterData.push({ ...letterData, a: properties.obligationRows, kind: "Debtor" })
            }

            await chrome.runtime.sendMessage<Message>({ type: 'setStorage', data: { key: "obligationsCount", value: 0 } });
            await chrome.runtime.sendMessage<Message>({ type: 'setStorage', data: { key: "obligationsCountFixed", value: 10 } });
            if (!properties.letterData) {
                throw new Error("Letter data is undefined");
            }

            const documentFilenames = await (await workbook).fetchAndConvertXlsxToJson({
                Sheet: "Templates",
                Column: "Filename"
            })



            const letterGenerationResultPromise = properties.letterData.map(async data => {
                if (!properties.templates) {
                    throw new Error("Templates is not defined");
                }
                if (!properties.obligationRows) {
                    throw new Error("Obligation rows are undefined in letter data");
                }
                if (!data.First_Name) {
                    throw new Error("First name is undefined in letter data");
                }

                // First, resolve all template promises
                const resolvedTemplates = await Promise.all(properties.templates);
                // Then find the matching template
                const selectedTemplate = resolvedTemplates.find(template => template.kind === data.kind);
                console.log(properties.templates);
                const documentFileName = documentFilenames[selectedTemplate?.letter as keyof typeof documentFilenames]
                if (!documentFileName) {
                    throw new Error(`Document filename is undefined for letter: ${selectedTemplate?.letter}`);
                }

                const o = properties.obligationRows ?? [];
                const OBL = o.length === 1 ? " OBL " + o[0]?.Obligation : " x " + o.length;
                const firstChallenge = o[0]?.Challenge;
                const ReviewType = firstChallenge === "Special circumstances" ? "ER Special" : firstChallenge !== undefined ? "ER General" : "Review";
                const dt = formatDate(); // Calculate date once


                const letterType = templateSubstitution<{ name?: string, UserID?: string, OBL?: string, ReviewType?: string, dt?: string }>(documentFileName, { ...data, name: data.Is_Company ? data.Company_Name : data.First_Name.charAt(0) + " " + data.Last_Name, OBL, dt, ReviewType });



                if (!selectedTemplate) {
                    throw new Error("Unable to match data with template.");
                }

                const documentProps = await (await workbook).fetchAndConvertXlsxToJson({
                    Sheet: "Templates",
                    Column: "Props"
                })

                data.selectedObValue = '$' + formatMoney(data.a?.reduce((t, o) => t + Number(o.Balance_Outstanding?.replace(/[^0-9.-]+/g, "")), 0));

                if (documentProps[selectedTemplate.letter] !== undefined) {
                    documentProps[selectedTemplate.letter]?.split(",").forEach((prop) => {
                        if (prop === "todayplus14") {
                            data[prop] = getDates().todayplus14;
                        }
                        if (prop === "todayplus28") {
                            data[prop] = getDates().todayplus28;
                        }
                        if (prop === "todayplus21") {
                            data[prop] = getDates().todayplus21;
                        }
                    })
                }

                const template = await selectedTemplate.template;

                const message = { data, template, letterType };

                return new Promise((resolve, reject) => {
                    // Create and append the iframe
                    const sandbox = document.createElement('iframe');
                    sandbox.id = 'theFrame';
                    sandbox.src = 'genLetter-module.html';
                    document.body.appendChild(sandbox);

                    // Create a timeout to reject the promise if it takes too long
                    const timeoutId = setTimeout(() => {
                        cleanup();
                        reject(new Error(`Letter generation timeout for ${letterType}`));
                    }, 30000); // 30 second timeout

                    // Function to clean up resources
                    const cleanup = () => {
                        clearTimeout(timeoutId);
                        window.removeEventListener('message', messageHandler);

                        if (sandbox) {
                            // Clear any references to the iframe's contentWindow
                            sandbox.src = 'about:blank';
                            // Remove from DOM
                            if (sandbox.parentNode) {
                                sandbox.parentNode.removeChild(sandbox);
                            }
                        }
                    };

                    // Message handler that resolves the promise when a message is received
                    const messageHandler = (event: MessageEvent<{
                        type: string;
                        correspondence: string;
                    }>) => {
                        if (event.data.type === letterType) {
                            const correspondence = event.data.correspondence;
                            saveAs(correspondence, letterType + ".docx");

                            // Clean up resources
                            cleanup();

                            // Resolve the promise with the correspondence data
                            resolve(correspondence);
                        }
                    };

                    // Add the message handler
                    window.addEventListener('message', messageHandler);

                    // Set up the onload handler
                    sandbox.onload = () => {
                        // Post your message
                        sandbox.contentWindow?.postMessage(message, '*');
                    };
                });

                /*if (data.MOU === true &&
                    !properties.letters?.some(type => type === 'Agency Fee Removal' || type === "Notice of Deregistration")) {
                    const agencyTemplates = await properties.templates.find(async template => {
                        const temp = await template;
                        return (temp.kind === 'Agency' && temp.letter);
                    })
                    if (!agencyTemplates) {
                        throw new Error("Agency templates are undefined");
                    }
                    if (!data.AgencyEmail) {
                        throw new Error("Agency email is undefined");
                    }
                    emailMaker(data, [data.AgencyEmail, 'MOU', agencyTemplates]);
                }*/
            })

            const letterGenerationResults = await Promise.all(letterGenerationResultPromise);
            if (process.env.IS_DEV) console.log("Letter generation results:", letterGenerationResults);
        }
    }
}

// --- Helper Functions with Types ---

function getAppData(data: Partial<letterDataProps>): Promise<Record<string, string[]>> {
    return new Promise((resolve) => {
        return chrome.runtime.sendMessage<Message>({ type: 'getStorage', data: { key: "value" } })
            .then((items) => {
                let applicationData: DebtorData[] = [];
                // Check if items.value is actually an array before assigning it
                if (Array.isArray(items.value)) {
                    // If it is an array, assign it.
                    // We use 'as DebtorData[]' as a type assertion, telling TypeScript
                    // to trust that the elements within items.value conform to DebtorData.
                    // This is necessary because items.value might be typed as unknown[] or any[].
                    applicationData = items.value as DebtorData[];
                } else if (items.value != null) {
                    // Log an error if items.value exists but is not an array,
                    // as the subsequent code expects an array.
                    console.error(`Storage data ('items.value') was expected to be an array, but received type: ${typeof items.value}`);
                    // applicationData remains []
                }
                // If items.value was null or undefined, applicationData remains []

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
                resolve((items.value ?? {}) as Record<string, string[]>);
            });
    });
}


async function loadLetter(url: string, letterName: string): Promise<string | null> {
    return fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            if (response.headers.get('Content-Type') !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                throw new Error(`File not found for '${letterName}' template. Please verify the URL is correct - ${url}`);
            }
            return response.blob(); // Get response body as a Blob
        })
        .then((blob) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = function () {
                    if (typeof reader.result === 'string') {
                        resolve(reader.result);
                    } else {
                        reject(new Error("Expected string result from FileReader"));
                    }
                }
                reader.onerror = function () {
                    reject(new Error("Failed to read blob"));
                }
                reader.readAsDataURL(blob);
            });
        });
}

const addressPriority = ["Postal Address", "Residential Address", "Unknown Address"];

const challengeList: Record<string, string> = {
    "E_EXCIRCUM": "Exceptional circumstances",
    "E_PERUNAWR": "Person unaware",
    "E_SPCIRCUM": "Special circumstances",
    "E_CONTRLAW": "Contrary to the law",
    "E_MISTAKID": "Mistake of identity"
}

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



const mergeById =
    <
        T extends Record<L, unknown>,
        U extends Record<K, unknown>,
        K extends PropertyKey,
        L extends PropertyKey,
    >({
        baseArray,
        matchArray,
        baseArrayKey,
        matchArrayKey
    }:
        {
            baseArray: T[],
            matchArray: U[],
            baseArrayKey: L,
            matchArrayKey: K
        }) =>
        baseArray.map(itm => ({
            ...matchArray.find((item) => (item[matchArrayKey] === itm[baseArrayKey] as PropertyKey)),
            ...itm
        }));

function toTitleCase(str: string | undefined): string {
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

/**
 * Groups an array of objects by the value of a specified property.
 * @template T The type of objects in the array.
 * @template K The key of T to group by.
 * @param arr The array of objects to group.
 * @param property The property key (must be a key of T) to group by.
 * @returns A Record where keys are the string representations of the property values
 *          and values are arrays of objects belonging to that group.
 */
export function groupByObject<T, K extends keyof T>(arr: T[], property: K) {
    // Use Record<string, T[]> as the accumulator type
    return arr.reduce((memo: Record<string, T[]>, currentItem) => {
        // Get the value of the property for the current item
        const groupValue = currentItem[property];

        // Convert the group value to a string to use as the object key.
        // Handles null/undefined by grouping them under the key "undefined".
        // Adjust this logic if you need different handling (e.g., separate "null" key).
        const key = String(groupValue ?? "undefined");

        // If this group key doesn't exist in the memo object yet, initialize it with an empty array
        if (!memo[key]) {
            memo[key] = [];
        }

        // Push the current item into the array for its group
        memo[key].push(currentItem);

        // Return the updated memo object for the next iteration
        return memo;
    }, {}); // Start with an empty object as the initial value for the accumulator
}


export function groupByArray<O extends object, K extends keyof O>(arr: O[], property: K) {
    return arr.reduce<(Record<K, O[K]> & Record<"a", O[]>)[]>(function (memo, x) {
        if (!memo.some(item => item[property] === x[property])) { memo.push({ [property]: x[property], a: [] } as unknown as (Record<K, O[K]> & Record<"a" | K, O[]>)) }
        memo.map(itm => itm[property] === x[property] && itm.a.push(x))
        return memo;
    }, []);
}

const objectA = { foo: 'foo' };
const objectB = { bar: 'bar' };

const merged = { ...objectA, ...objectB };

merged['foo'] = 'newFoo'; // This will overwrite the value of 'foo' in the merged object

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

/**
 * Creates a function that retrieves trimmed element values/content by ID
 * from a specific document.
 *
 * @param doc The Document object to search within.
 * @returns A function that accepts an element ID and returns its trimmed value/content.
 */
function createElementValueGetterById(doc: Document): (id: string) => string {
    /**
     * Selects an element by ID from the pre-configured document,
     * retrieves its value or text content, checks for null/undefined, and trims it.
     * Throws an error if the element is not found or its value/content is null/undefined.
     *
     * @param id The ID of the element (without the leading '#').
     * @returns The trimmed string value or text content of the element.
     * @throws Error if the element is not found or its value/content is null or undefined.
     */
    return function getTrimmedValueById(id: string): string {
        // Construct the CSS selector
        const selector = `#${id}`;

        // Query for the element within the captured 'doc'
        const element = doc.querySelector<HTMLElement>(selector); // Use HTMLElement as a base type

        // Check if the element exists
        if (!element) {
            throw new Error(`Element with ID "${id}" not found in the document.`);
        }

        let content: string | null | undefined;

        // Check if it's an element type that typically uses .value
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
            content = element.value;
        } else {
            // Otherwise, use textContent
            content = element.textContent;
        }

        // Check if the retrieved content is null or undefined
        if (content === null || content === undefined) {
            // Provide a more specific error message based on what was attempted
            const attemptedProperty = (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) ? 'value' : 'textContent';
            throw new Error(`Element with ID "${id}" found, but its ${attemptedProperty} is null or undefined.`);
        }

        // Trim and return the content
        return content.trim();
    };
}


const convertArrayToObject = <T extends keyof A, A extends Record<string, string>>(array: A[], key: T) => {
    const initialValue: Record<string, A> = {};
    return array.reduce((obj, item) => {
        return {
            ...obj,
            [item[key]]: item,
        };
    }, initialValue);
};

/**
 * Substitutes values into a template string.
 * @param {string} template 
 * @param {Object} values 
 * @returns {string} 
 */
type NestedObject = {
    [key: string]: string | number | boolean | NestedObject;
};

function templateSubstitution<T extends NestedObject>(template: string, values: T): string {
    return template.replace(/\${([^{}]*)}/g, (match, expression: string) => {
        const value = expression.split('.').reduce<unknown>((obj, key) => {
            if (obj && typeof obj === 'object' && key in obj) {
                return (obj as Record<string, unknown>)[key];
            }
            return undefined;
        }, values);

        return value !== undefined ? String(value) : match;
    });
}
