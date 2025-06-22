//import { emailMaker } from "./js/emailmaker";
import { ObligationNumberList, WDPResponse, ObligationPreviewProcess as WDPPreviewProcess, ChromeMessageListenerCallback, CollectedData, DerivedFieldName, ExtractedFieldName, BulkActionProperties, BulkAction, ChromeOnUpdatedHandler } from "./js/types"
import { table } from "./js/tablemaker";
import { Message } from "./js/types";
import { addMessageListeners, createWindow, customFetch, setupOffscreenDocument } from "./js/utils";

/**
 * Message listener to initiate the correspondence generation process.
 */
const handleGenerateCorrespondence: ChromeMessageListenerCallback = ({ type, data }: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void
) => {
    if (type !== 'generateCorrespondence') return;
    (async () => {
        await setupOffscreenDocument('html/offscreen.html');
        const scrapeMessage: ObligationNumberList = {
            type: 'obligationScrapeInitialise',
            data: {
                obligations: data.obligations || [],
                VIEWEnvironment: 'djr' // Provide default value
            }
        };
        const scrapeResponse = await chrome.runtime.sendMessage(scrapeMessage);
        if (scrapeResponse.error) {
            sendResponse({ response: scrapeResponse.error });
            return;
        };
        const correspondenceMessage: Message = {
            type: 'prepareCorrespondenceData',
            data: {
                dataSet: scrapeResponse,
                wordTemplateProperties: data.wordTemplateProperties,
            }
        };
        const correspondenceResponse = await chrome.runtime.sendMessage(correspondenceMessage);
        sendResponse({ response: correspondenceResponse });
    })();
    return true; // keep the messaging channel open for sendResponse
}




/** Initialise Chrome Storage  */
const handleChromeStorage: ChromeMessageListenerCallback = ({ type, data }: Message, sender, sendResponse) => {
    if (type === 'getStorage') {
        chrome.storage.local.get([data.key])
            .then((result) => {
                sendResponse({ success: true, value: result[data.key] });
            });
    }
    if (type === 'setStorage') {
        chrome.storage.local.set({ [data.key]: data.value }).then(() => {
            sendResponse({ success: true });
        });
    }
    return true;
}

//** Initialise Background Fetch */
const handleBackgroundFetch: ChromeMessageListenerCallback = ({ type, data }: Message, sender, sendResponse) => {
    if (type === 'fetchJSON') {
        const handleAsJson = (response: Response) => response.json();
        customFetch(data[0], handleAsJson, data[1]).then(JSONdata => {
            sendResponse(JSONdata);
        });
        return true; // keep the messaging channel open for sendResponse

    }
    if (type === 'fetchBase64') {
        const handleAsBase64 = (response: Response) => response.blob().then(blob => {
            const reader = new FileReader();
            return new Promise((resolve, reject) => {
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = () => reject(reader.error);
                reader.readAsDataURL(blob); // Read the Blob as Base64 Data URL
            });
        });
        customFetch(data[0], handleAsBase64).then(base64Data => {
            sendResponse(base64Data);
        }).catch(error => {
            console.error("Fetch error:", error);
            // Send an error indicator back if desired
            sendResponse({ error: error.message || "Fetch failed" });
        });
        return true; // keep the messaging channel open for sendResponse
    }
}


const handleGenerateXLSX: ChromeMessageListenerCallback = ({ type, data }: Message, sender, sendResponse) => {
    if (type !== "generateXLSX") return;
    const fieldsForXLSXexport: (DerivedFieldName | ExtractedFieldName)[] = [
        "Obligation", "Infringement", "name", "Agency", "Offence_Description", "Balance_Outstanding", "Status", "enforcename", "Date_of_Offence", "Date of Issue", "Input Source", "PRN Issue Date", "NFD Issue Date", "VRM Number", "Driver License State", "Driver License No.", "PRN Address", "offence_location", "offence_time", "HoldCodeEndDate", "Challenge", "reduced_charge", "registration_fee", "enforcement_fee", "warrant_issue_fee", "amount_waived", "amount_paid", "court_costs", "court_fine"
    ];
    (async () => {
        await setupOffscreenDocument('html/offscreen.html');
        const message: ObligationNumberList = {
            type: 'obligationScrapeInitialise',
            data: { ...data, targetFields: fieldsForXLSXexport }
        };
        const response = await chrome.runtime.sendMessage<ObligationNumberList, CollectedData>(message);
        if (!response.a) {
            sendResponse({ type: "error", error: "No data received from the scrape process." });
            return;
        }
        if (response.name === undefined || typeof response.name !== 'string') {
            throw new Error("No name provided for the XLSX file.");
        }
        table(response.a, response.name, fieldsForXLSXexport);
        sendResponse({ response });
    })();
    return true;
};

/**
 * Message listener to initiate the obligation preview process for display in WDP.
 */
function handleWDPPreview(): WDPPreviewProcess {
    return ({ type, data }, _sender, sendResponse) => {
        if (type !== "WDPPreviewInitialise") return;
        (async () => {
            await setupOffscreenDocument('html/offscreen.html');
            const message: Message = {
                type: 'WDPPreviewProcess',
                data: {
                    obligations: data.obligations,
                    VIEWEnvironment: data.VIEWEnvironment || 'djr'
                }
            };
            const response = await chrome.runtime.sendMessage<ObligationNumberList, WDPResponse>(message);
            if (response.type === "success") {
                sendResponse(
                    {
                        type: "success",
                        data: response.data
                    }
                );
            } else {
                sendResponse(
                    {
                        type: "error",
                        error: response.error
                    }
                );
            }

        })();
        return true;

    };
}

function handleWDPProcess(): WDPPreviewProcess {
    return ({ type, data }, _sender, sendResponse) => {
        if (type !== "WDPBatchProcess") return;
        (async () => {
            await setupOffscreenDocument('html/offscreen.html');
            const message: Message = {
                type: 'obligationScrapeInitialise',
                data
            };
            const response = await chrome.runtime.sendMessage<ObligationNumberList, CollectedData>(message);
            if (!response) {
                sendResponse(
                    {
                        type: "error",
                        error: "No data received from the scrape process."
                    }
                );
            } else {
                sendResponse(
                    {
                        type: "success",
                        data: [response]
                    }
                );
            }
        })();
        return true;
    };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const bulkAction: ChromeMessageListenerCallback = async ({ type, data }: Message, _, sendResponse) => {
    if (type !== "bulkAction") return;
    /**
 * Creates a dedicated message listener for a specific bulk action instance and ensures it's cleaned up
 * when the connection to the popup window is lost.
 * @param properties - The properties object containing the communication port.
 */
    function handleMessageForObligationCount(properties: BulkActionProperties) {
        // 1. Define the listener function within this scope to capture the specific 'properties' object.
        const updateObligationCount: ChromeMessageListenerCallback = (message) => {
            if (message.type !== "updateObligationCount") return;

            // Check if the port is still valid before attempting to post a message.
            if (properties?.port) {
                properties.port.postMessage({ "obligationCount": properties.obligations.length, "addedCount": message.payload.addedCount });
            }
            // Returning false or undefined is fine here as we don't need to keep the channel open.
        };

        // 2. Add the specific listener for this bulk action instance.
        chrome.runtime.onMessage.addListener(updateObligationCount);

        properties.port?.onDisconnect.addListener(() => {
            console.log("Port disconnected. Removing the 'updateObligationCount' listener.");
            // 4. When the port disconnects, remove the exact same listener function.
            chrome.runtime.onMessage.removeListener(updateObligationCount);
            // You can also set properties.port to null to prevent any lingering attempts to use it.
            properties.port = null;
        });
    }

    const urlMap = {
        'Bulk Notes Update': `https://${data.VIEWEnvironment}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticeGenericBulkUpdate.aspx?Mode=N&Menu=3`,
        'Bulk Writeoff Update': `https://${data.VIEWEnvironment}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticeGenericBulkUpdate.aspx?Mode=W&Menu=3`,
        'Bulk Hold Update': `https://${data.VIEWEnvironment}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticeGenericBulkUpdate.aspx?Mode=H&Menu=3`,
    }

    let properties: BulkActionProperties = {
        popupWindow: null,
        port: null,
        portDisconnected: false,
        txtNoticeCheck: [],
        obligations: data.obligations,
        VIEWEnvironment: data.VIEWEnvironment,
        page: urlMap[data.subType],
    };

    properties = await createWindow(properties);
    await setupOffscreenDocument('html/offscreen.html');
    const message: BulkAction = {
        type: 'processBulkAction',
        subType: data.subType,
        data: {
            properties
        }
    };
    handleMessageForObligationCount(properties);
    const response = await chrome.runtime.sendMessage<BulkAction>(message);
    if (!response || response.type === "error") {
        sendResponse({ type: "error", error: "No data received from the bulk action process." });
        return;
    }
    postData(properties.page, response.data, properties);
    sendResponse({ type: "success", data: response.data });
    return true;


};

function postData(url: string, parsedDocument: string, properties: BulkActionProperties) {
    if (!properties.port || !properties.popupWindow || properties.popupWindow === null || !properties.popupWindow.tabs || !properties.popupWindow.tabs[0] || properties.popupWindow.tabs.length === 0) {
        console.error("Popup window or tab not found.");
        return;
    }
    if (!properties.popupWindow.tabs[0].id) {
        console.error("Popup window tab ID is not available.");
        return;
    }
    const handler: ChromeOnUpdatedHandler = function (tabId, changeInfo) {
        if (properties.popupWindow.tabs[0].id === tabId && changeInfo.status === "complete") {
            properties.port.disconnect();
            chrome.tabs.sendMessage(tabId, { url: url, data: parsedDocument, type: 'loadPage' });
            chrome.tabs.onUpdated.removeListener(handler);
        }
    }


    chrome.tabs.onUpdated.addListener(handler); // in case we're faster than page load (usually)
    chrome.tabs.sendMessage(properties.popupWindow.tabs[0].id, { url: url, data: parsedDocument, type: 'loadPage' }); // just in case we're too late with the listener
}



addMessageListeners([handleWDPPreview(), handleGenerateXLSX, bulkAction, handleGenerateCorrespondence, handleChromeStorage, handleBackgroundFetch, handleWDPProcess()]);