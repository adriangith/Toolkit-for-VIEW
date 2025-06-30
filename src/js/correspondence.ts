import { CollectedData, TemplateSheetRecord as TemplateSheetRecord, StoredRecipientDetails } from './types'
import { saveAs } from 'file-saver';
import { getStorage, groupByArray, templateSubstitution } from './utils';

/**
 * Merges specified properties from the source object into the target object.
 * @param source The source object containing the properties to merge.
 * @param target The target object to merge properties into.
 * @param properties The list of properties to merge.
 * @returns The updated target object.
 */
const mergeProperties = <T extends CollectedData>(target: T, source: CollectedData, properties: (keyof T & keyof CollectedData)[]) => {
    properties.forEach(prop => {
        if (source[prop] !== undefined) {
            if (prop === 'a' || prop === 'recipient') {
                throw new Error("Cannot merge 'a' property directly, it should be handled separately.");
            }
            target[prop] = source[prop];
        }
    });
    return target;
};


const transformCorrespondenceDataSet = async (dataSet: CollectedData, wordTemplateProperties: TemplateSheetRecord[]) => {
    dataSet.recipient = 'Debtor';
    dataSet.tParty = false;
    dataSet.OnlyNFDLapsed = dataSet.a?.some(obligation => obligation.NFDlapsed);
    if (!dataSet.First_Name) {
        dataSet.First_Name = ''
    }
    if (!dataSet.Last_Name) {
        dataSet.Last_Name = ''
    }
    /** Id of the active debtor. */
    const debtorId = dataSet.debtor_id || dataSet.Debtor_ID;
    await getStorage<StoredRecipientDetails | undefined>(debtorId).then(async (result) => {
        if (result) {
            // Alias fields for clarity
            const {
                isThirdParty: tParty,
                isLegalCentre: legalCentre,
                addressTo: recipient,
                altIsLegalCentre,
                mainAddress: {
                    contactName: applicantName,
                    organisation: appOrganisation,
                    street: appStreet,
                    town: appTown,
                    state: appState,
                    postcode: appPost
                },
                altAddress: {
                    contactName: altApplicantName,
                    organisation: altAppOrganisation,
                    street: altAppStreet,
                    town: altAppTown,
                    state: altAppState,
                    postcode: altAppPost
                },
            } = result;

            // Create a temporary object with all fields
            const allFields = {
                tParty,
                legalCentre,
                recipient,
                applicantName,
                appOrganisation,
                appStreet,
                appTown,
                appState,
                appPost,
                altApplicantName,
                altAppOrganisation,
                altAppStreet,
                altAppTown,
                altAppState,
                altAppPost,
                altIsLegalCentre
            };

            // Filter out empty strings, but keep booleans
            const filteredFields = Object.entries(allFields).reduce((acc, [key, value]) => {
                if (typeof value === 'boolean' || (typeof value === 'string' && value !== '') || key === 'appOrganisation') {
                    acc[key] = value;
                }
                return acc;
            }, {} as Record<string, string | boolean>);


            dataSet = { ...dataSet, ...filteredFields };
        }
    });

    return wordTemplateProperties.reduce<CollectedData[]>(function (templateRecords, templateRecord) {
        dataSet.correspondenceDescription = templateRecord.Filename
        dataSet.wordTemplateURL = templateRecord.Link

        if (!dataSet.a) {
            throw new Error("DataSet is missing the 'a' property");
        }

        if (templateRecord.Recipient === 'Agency') {
            let agencyTemplateRecords = groupByArray(dataSet.a, 'altname');

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { a, ...topLevelProperties } = dataSet
            agencyTemplateRecords = agencyTemplateRecords.map(item => {
                /** Count the number of obligations for the agency.*/
                const obligationCount = item.a.length;
                /** Obligation string to be displayed in the template filename. */
                const OBL = obligationCount === 1 ? " OBL " + item.a[0]?.Obligation : " x " + obligationCount;
                /** Combined outstanding amount. */
                const selectedObValue = '$' + item.a.reduce((acc, item) => {
                    const balanceOutstanding = ["BalanceOutstanding", "Balance_Outstanding"].find(field => item[field as keyof typeof item] !== undefined);
                    return acc + parseFloat(String(item[balanceOutstanding as keyof typeof item] || '').replace(/[$,]/g, '') || "0");
                }, 0).toFixed(2);

                /** Agency template record with the top-level properties merged back in. */
                const agencyTemplateRecord = { ...topLevelProperties, ...item, OBL, selectedObValue }
                /** Agency template record updated with agency properties */
                const agencyTemplateRecordsAgency = mergeProperties(agencyTemplateRecord, agencyTemplateRecord.a[0], ['enforcename', 'Address2', 'Address3', 'Address2', 'enforcementAgencyCode', 'MOU', 'Email', 'EmailAddress', 'Challenge'])
                /** Agency template record updated with a templated description. */
                const agencyTemplateRecordTemplated = { ...agencyTemplateRecordsAgency, correspondenceDescription: templateSubstitution(templateRecord.Filename, agencyTemplateRecordsAgency) }
                return agencyTemplateRecordTemplated;
            })
            return [...templateRecords, ...agencyTemplateRecords]
        }

        if (templateRecord.Recipient === 'Debtor') {
            /** Count the number of obligations for the debtor.*/
            const obligationCount = dataSet.a.length;
            /** Obligation string to be displayed in the template filename. */
            const OBL = obligationCount === 1 ? " OBL " + dataSet.a[0]?.Obligation : " x " + obligationCount;
            /** Combined outstanding amount. */
            const selectedObValue = '$' + dataSet.a.reduce((acc, item) => {
                const balanceOutstanding = ["BalanceOutstanding", "Balance_Outstanding"].find(field => item[field as keyof typeof item] !== undefined);
                return acc + parseFloat(String(item[balanceOutstanding as keyof typeof item] || '').replace(/[$,]/g, '') || "0");
            }, 0).toFixed(2);
            /** Flag for when all obligations are in a payment arrangement */
            const hasPaymentArrangement = dataSet.a.every(item => item.InActivePaymentArrangement === 'Y');
            /** Debtor template record updated with obligationsproperties with the dataSet.  */
            const debtorRecord = { ...mergeProperties(dataSet, dataSet.a[0], ['enforcename', 'ReviewType', 'Challenge']), OBL, selectedObValue, hasPaymentArrangement }
            templateRecords.push({ ...debtorRecord, correspondenceDescription: templateSubstitution(templateRecord.Filename, debtorRecord) })
        }

        return templateRecords;
    }, []);
}

const fetchTemplate = (url: string): Promise<string | null> => {
    return fetch(url)
        .then((response) => {
            if (!response.ok) {
                // want to return a rejected promise if the response is not ok
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            if (response.headers.get('Content-Type') !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                throw new Error(`File is not a Word template. Please verify the URL is correct - ${url}`);
            }
            return response.blob(); // Get response body as a Blob
        })
        .then((blob) => {
            return new Promise<string>((resolve, reject) => {
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
        })
}

/**
 * Generates correspondence documents based on the provided data set and word template properties.
 * @param {Object} CorrespondenceParams - The parameters for generating correspondence.
 * @param {CollectedData} CorrespondenceParams.dataSet - The dataset containing correspondence data.
 * @param {TemplateSheetRecord[]} CorrespondenceParams.wordTemplateProperties - The properties of the word template.
 * @returns A promise that resolves to an array of correspondence data.
 */
export async function getCorrespondence(
    { dataSet, wordTemplateProperties }: { dataSet: CollectedData, wordTemplateProperties: TemplateSheetRecord[] }) {
    const correspondenceDataSet = transformCorrespondenceDataSet(dataSet, wordTemplateProperties);

    return (await correspondenceDataSet).map(
        /**
         * @param data - The correspondence data object containing properties like wordTemplateURL and correspondenceDescription.
         * @returns A promise that resolves to the generated correspondence document.
         * @throws Error if the wordTemplateURL is missing or if the fetch operation fails.
         */
        async data => {
            if (!data.wordTemplateURL) {
                throw new Error("DataSet is missing the 'wordTemplateURL' property");
            }
            const wordTemplateDownloadURL = data.wordTemplateURL.split('?')[0] + '?download=1'
            const base64Template = await fetchTemplate(wordTemplateDownloadURL);

            return new Promise((resolve, reject) => {
                // Create and append the iframe
                const sandbox = document.createElement('iframe');
                sandbox.src = 'doc-generator.html';
                document.body.appendChild(sandbox);

                // Create a timeout to reject the promise if it takes too long
                const timeoutId = setTimeout(() => {
                    cleanup();
                    reject(new Error(`Letter generation timeout for ${data.correspondenceDescription}`));
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
                    if (event.data.type === data.correspondenceDescription) {
                        const correspondence = event.data.correspondence;
                        saveAs(correspondence, data.correspondenceDescription + ".docx");

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
                    sandbox.contentWindow?.postMessage({ dataSet: data, base64Template, correspondenceDescription: data.correspondenceDescription }, '*');
                };
            });
        });
}
