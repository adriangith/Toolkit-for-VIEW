import { CollectedData, TemplateSheetRecord, StoredRecipientDetails, GenerateDocumentMessage } from './types'
import { saveAs } from 'file-saver';
import { getAttachments, getStorage, groupByArray, templateSubstitution } from './utils';
import { downloadEmail } from './utils';

/**
 * Merges specified properties from the source object into the target object.
 * @param source The source object containing the properties to merge.
 * @param target The target object to merge properties into.
 * @param properties The list of properties to merge.
 * @returns The updated target object.
 */
const mergeProperties = <T extends Record<string, unknown>>(target: T, source: Record<string, unknown>, properties: (keyof T)[]) => {
    properties.forEach(prop => {
        const value = source[prop as string];
        if (value !== undefined) {
            if (prop === 'a' || prop === 'recipient') {
                return; // Skip these to avoid structural errors
            }
            target[prop] = value as T[keyof T];
        }
    });
    return target;
};

const transformCorrespondenceDataSet = async (dataSet: CollectedData, documentTemplateProperties: TemplateSheetRecord[]): Promise<CollectedData[]> => {
    const mutableDataSet = dataSet as unknown as Record<string, unknown>;
    mutableDataSet.recipient = 'Debtor';
    mutableDataSet.tParty = false;
    mutableDataSet.legalCentre = false;
    mutableDataSet.OnlyNFDLapsed = dataSet.a?.every(obligation => obligation.NFDlapsed);

    if (!dataSet.First_Name) mutableDataSet.First_Name = '';
    if (!dataSet.Last_Name) mutableDataSet.Last_Name = '';

    const debtorId = dataSet.debtor_id || dataSet.Debtor_ID;

    if (typeof debtorId === 'boolean') {
        throw new Error("Invalid debtor ID provided. It should be a string or number.");
    }

    if (debtorId) {
        const result = await getStorage<StoredRecipientDetails | undefined>(debtorId);
        if (result && result.isThirdParty === true) {
            const hasMainAddress = result.mainAddress && Object.values(result.mainAddress).some(val => val && val.trim().length > 0);
            if (!hasMainAddress) {
                throw new Error("3rd Party Application is selected but 3rd party details are empty. Please check Application Options.");
            }

            const {
                isThirdParty: tParty,
                isLegalCentre: legalCentre,
                addressTo: recipient,
                altIsLegalCentre,
                mainAddress,
                altAddress
            } = result;

            const filteredFields: Record<string, unknown> = {
                tParty,
                legalCentre,
                recipient,
                applicantName: mainAddress.contactName,
                appOrganisation: mainAddress.organisation,
                appStreet: mainAddress.street,
                appTown: mainAddress.town,
                appState: mainAddress.state,
                appPost: mainAddress.postcode,
                altApplicantName: altAddress.contactName,
                altAppOrganisation: altAddress.organisation,
                altAppStreet: altAddress.street,
                altAppTown: altAddress.town,
                altAppState: altAddress.state,
                altAppPost: altAddress.postcode,
                altIsLegalCentre
            };

            Object.assign(mutableDataSet, filteredFields);
        }
    }

    return documentTemplateProperties.reduce<CollectedData[]>((templateRecords, templateRecord) => {
        if (!dataSet.a) throw new Error("DataSet is missing the 'a' property");

        if (templateRecord.Recipient === 'Agency') {
            const groups = groupByArray(dataSet.a, 'altname');
            const topLevelProperties = { ...dataSet } as Record<string, unknown>;
            delete topLevelProperties.a;

            const agencyRecords = groups.map(item => {
                const obligationCount = item.a.length;
                const OBL = obligationCount === 1 ? " OBL " + item.a[0]?.Obligation : " x " + obligationCount;

                const rawObValue = item.a.reduce((acc: number, ob: Record<string, unknown>) => {
                    const val = String(ob.BalanceOutstanding || ob.Balance_Outstanding || "0").replace(/[$,]/g, '');
                    return acc + parseFloat(val || "0");
                }, 0);
                const selectedObValue = '$' + rawObValue.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

                const agencyRecord = { ...topLevelProperties, ...item, OBL, selectedObValue } as Record<string, unknown>;
                mergeProperties(agencyRecord, item.a[0] as unknown as Record<string, unknown>, ['enforcename', 'Address2', 'Address3', 'enforcementAgencyCode', 'MOU', 'Email', 'EmailAddress', 'Challenge'] as (keyof typeof agencyRecord)[]);

                const documentType = templateRecord.Link?.toLowerCase().includes('.docx') ? 'document' : 'email';
                if (agencyRecord.Email !== 'TRUE' && documentType === 'email' && templateRecord.Filename.toLowerCase().includes('email')) {
                    return null;
                }

                agencyRecord.correspondenceDescription = templateSubstitution(templateRecord.Filename, agencyRecord as unknown as CollectedData);
                agencyRecord.documentTemplateURL = templateRecord.Link;
                return agencyRecord as unknown as CollectedData;
            }).filter((r): r is CollectedData => r !== null);

            return [...templateRecords, ...agencyRecords];
        }

        if (templateRecord.Recipient === 'Debtor') {
            const obligationCount = dataSet.a.length;
            const OBL = obligationCount === 1 ? " OBL " + dataSet.a[0]?.Obligation : " x " + obligationCount;

            const rawObValue = dataSet.a.reduce((acc, item: Record<string, unknown>) => {
                const val = String(item.BalanceOutstanding || item.Balance_Outstanding || "0").replace(/[$,]/g, '');
                return acc + parseFloat(val || "0");
            }, 0);
            const selectedObValue = '$' + rawObValue.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            const hasPaymentArrangement = dataSet.a.every(item => item.InActivePaymentArrangement === 'Y');

            const debtorRecord = { ...dataSet } as unknown as Record<string, unknown>;
            debtorRecord.OBL = OBL;
            debtorRecord.selectedObValue = selectedObValue;
            debtorRecord.hasPaymentArrangement = hasPaymentArrangement;
            debtorRecord.correspondenceDescription = templateSubstitution(templateRecord.Filename, debtorRecord as unknown as CollectedData);
            debtorRecord.documentTemplateURL = templateRecord.Link;

            mergeProperties(debtorRecord, dataSet.a[0] as unknown as Record<string, unknown>, ['enforcename', 'ReviewType', 'Challenge'] as (keyof typeof debtorRecord)[]);

            templateRecords.push(debtorRecord as unknown as CollectedData);
        }

        return templateRecords;
    }, []);
};

const fetchTemplate = (url: string): Promise<string> => {
    return fetch(url)
        .then((response) => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const contentType = response.headers.get('Content-Type');
            if (!contentType?.includes('word') && !contentType?.includes('octet-stream')) {
                throw new Error(`File is not a valid template format - ${url}`);
            }
            return response.blob();
        })
        .then((blob) => {
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error("Failed to read blob"));
                reader.readAsDataURL(blob);
            });
        });
};

export async function getCorrespondence(
    { dataSet, documentTemplateProperties }: { dataSet: CollectedData, documentTemplateProperties: TemplateSheetRecord[] }) {

    const correspondenceList = await transformCorrespondenceDataSet(dataSet, documentTemplateProperties);

    return correspondenceList.map(async (data: CollectedData) => {
        if (process.env.IS_DEV) {
            console.log('Correspondence Data Structure:', data);
        }
        if (!data.documentTemplateURL) {
            throw new Error("DataSet is missing the 'documentTemplateURL' property");
        }

        const isDocx = data.documentTemplateURL.toLowerCase().includes('.docx');
        const messageType = isDocx ? 'generate-document' : 'generate-email';
        const downloadUrl = data.documentTemplateURL.split('?')[0] + '?download=1';

        const base64Template = await fetchTemplate(downloadUrl);
        const emailAttachments = messageType === 'generate-email'
            ? await getAttachments(atob(base64Template.split(',')[1]))
            : new Map<string, string>();

        return new Promise((resolve, reject) => {
            const sandbox = document.createElement('iframe');
            sandbox.style.display = 'none';
            sandbox.src = 'doc-generator.html';
            document.body.appendChild(sandbox);

            const timeoutId = setTimeout(() => {
                cleanup();
                reject(new Error(`Timeout generating: ${data.correspondenceDescription}`));
            }, 30000);

            const cleanup = () => {
                clearTimeout(timeoutId);
                window.removeEventListener('message', messageHandler);
                if (sandbox.parentNode) sandbox.parentNode.removeChild(sandbox);
            };

            const messageHandler = (event: MessageEvent) => {
                if (event.data.type === data.correspondenceDescription) {
                    const output = event.data.correspondence;
                    if (isDocx) {
                        saveAs(output, `${data.correspondenceDescription}.docx`);
                    } else {
                        downloadEmail({ emlContent: output, filename: data.correspondenceDescription! });
                    }
                    cleanup();
                    resolve(output);
                }
            };

            window.addEventListener('message', messageHandler);

            sandbox.onload = () => {
                const message: GenerateDocumentMessage = {
                    type: messageType,
                    data: {
                        dataSet: data,
                        base64Template: base64Template,
                        correspondenceDescription: data.correspondenceDescription!,
                        emailAttachments: Object.fromEntries(emailAttachments)
                    }
                };
                sandbox.contentWindow?.postMessage(message, '*');
            };
        });
    });
}