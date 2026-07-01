//import { emailMaker } from "./js/emailmaker";
import { backgroundData, BulkAction, BulkActionProperties, ChromeMessageListenerCallback, ChromeOnUpdatedHandler, CollectedData, DerivedFieldName, ExtractedFieldName, ObligationNumberList, ObligationPreviewProcess as WDPPreviewProcess, StoredRecipientDetails, WDPResponse, XlSXExportColumnDefinition } from "./js/types"
import { table } from "./js/tablemaker";
import { Message } from "./js/types";
import { addMessageListeners, createWindow, customFetch, setupOffscreenDocument } from "./js/utils";
import { fieldsForXLSXexport } from "./js/config";

chrome.tabs.onRemoved.addListener((tabId) => {
    chrome.storage.local.remove(`bulkActionPopupTab:${tabId}`);
});

/**
 * Message listener to initiate the correspondence generation process.
 */
const handleGenerateCorrespondence: ChromeMessageListenerCallback = (message: Message,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void
) => {
    if (message.type !== 'generateCorrespondence') return;
    const { data } = message;
    (async () => {
        try {
            const correspondenceData = data as backgroundData['data'];
            if (correspondenceData.debtorId) {
                const storageResult = await chrome.storage.local.get(correspondenceData.debtorId);
                const recipientDetails = storageResult[correspondenceData.debtorId] as StoredRecipientDetails | undefined;

                if (recipientDetails && recipientDetails.isThirdParty === true) {
                    const hasMainAddress = recipientDetails.mainAddress && Object.values(recipientDetails.mainAddress).some(val => val && val.trim().length > 0);
                    if (!hasMainAddress) {
                        sendResponse({ response: "3rd Party Application is selected but 3rd party details are empty. Please check Application Options." });
                        return;
                    }
                }
            }

            await setupOffscreenDocument('html/offscreen.html');
            const scrapeMessage: ObligationNumberList = {
                type: 'obligationScrapeInitialise',
                data: {
                    obligations: data.obligations || [],
                    VIEWEnvironment: data.VIEWEnvironment || 'djr',
                    targetFields: data.targetFields as (DerivedFieldName | ExtractedFieldName)[]
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
                    documentTemplateProperties: data.documentTemplateProperties,
                }
            };
            const correspondenceResponse = await chrome.runtime.sendMessage(correspondenceMessage);
            sendResponse({ response: correspondenceResponse });
        } catch (error) {
            console.error("Background script error:", error);
            sendResponse({ response: `Fatal Error: ${error instanceof Error ? error.message : String(error)}` });
        }
    })();
    return true; // keep the messaging channel open for sendResponse
}




/** Initialise Chrome Storage  */
const handleChromeStorage: ChromeMessageListenerCallback = (message: Message, sender, sendResponse) => {
    if (message.type === 'getStorage') {
        const { data } = message;
        if (data.key) {
            chrome.storage.local.get([data.key])
                .then((result) => {
                    sendResponse({ success: true, value: result[data.key!] });
                });
        }
        return true;
    }
    if (message.type === 'setStorage') {
        const { data } = message;
        if (data.key) {
            chrome.storage.local.set({ [data.key]: data.value }).then(() => {
                sendResponse({ success: true });
            });
        }
        return true;
    }
}

const handleBulkActionPopupState: ChromeMessageListenerCallback = (message: Message, sender, sendResponse) => {
    if (message.type !== 'isBulkActionPopup') return;

    (async () => {
        const tabId = sender.tab?.id;
        if (tabId === undefined) {
            sendResponse({ isBulkActionPopup: false });
            return;
        }

        const storageKey = `bulkActionPopupTab:${tabId}`;
        const storedState = await chrome.storage.local.get(storageKey);
        sendResponse({ isBulkActionPopup: Boolean(storedState[storageKey]) });
    })();

    return true;
}

//** Initialise Background Fetch */
const handleBackgroundFetch: ChromeMessageListenerCallback = (message: Message, sender, sendResponse) => {
    if (message.type === 'fetchJSON') {
        const { data } = message;
        const handleAsJson = (response: Response) => response.json();
        customFetch(data[0], handleAsJson, data[1]).then(JSONdata => {
            sendResponse(JSONdata);
        });
        return true; // keep the messaging channel open for sendResponse

    }
    if (message.type === 'fetchBase64') {
        const { data } = message;
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

const handleGenerateXLSX: ChromeMessageListenerCallback = (message: Message, sender, sendResponse) => {
    if (message.type !== "generateXLSX") return;
    const { data } = message;

    // Use provided exportColumns or fall back to default
    const exportColumns = (data as { exportColumns?: XlSXExportColumnDefinition }).exportColumns || fieldsForXLSXexport;
    const targetFields: string[] = exportColumns.map((field) => field.name || field.header);

    targetFields.push('name');

    (async () => {
        await setupOffscreenDocument('html/offscreen.html');
        const message: ObligationNumberList = {
            type: 'obligationScrapeInitialise',
            data: { ...data, targetFields: targetFields as (DerivedFieldName | ExtractedFieldName)[] }
        };
        const response = await chrome.runtime.sendMessage<ObligationNumberList, CollectedData>(message);
        if (!response.a) {
            sendResponse({ type: "error", error: "No data received from the scrape process." });
            return;
        }

        // Flatten the data structure so Debtor-level fields are available on every row
        const { a, ...debtorData } = response;
        const flattenedData = a.map(obligation => ({ ...debtorData, ...obligation }));

        if (process.env.IS_DEV) {
            console.log("XLSX Export Data Structure:", flattenedData);
        }
        if (response.name === undefined || typeof response.name !== 'string') {
            throw new Error("No name provided for the XLSX file.");
        }
        table(flattenedData, response.name, exportColumns);
        sendResponse({ response });
    })();
    return true;
};

/**
 * Message listener to initiate the obligation preview process for display in WDP.
 */
function handleWDPPreview(): WDPPreviewProcess {
    return (message, _sender, sendResponse) => {
        if (message.type !== "WDPPreviewInitialise") return;
        const { data } = message;
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
    return (message, _sender, sendResponse) => {
        if (message.type !== "WDPBatchProcess") return;
        const { data } = message;
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
                if (process.env.IS_DEV) {
                    console.log("WDP Scrape Data Structure:", response);
                }
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

export const bulkAction: ChromeMessageListenerCallback = (message: Message, _, sendResponse) => {
    if (message.type !== "bulkAction") return;
    const { data } = message;

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
            if (process.env.IS_DEV) console.log("Port disconnected. Removing the 'updateObligationCount' listener.");
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
    } as const;

    (async () => {
        let properties: BulkActionProperties = {
            popupWindow: null,
            port: null,
            portDisconnected: false,
            txtNoticeCheck: [],
            obligations: data.obligations,
            VIEWEnvironment: data.VIEWEnvironment,
            page: urlMap[data.subType || 'Bulk Notes Update'],
        };

        properties = await createWindow(properties);
        const popupTabId = properties.popupWindow?.tabs?.[0]?.id;
        if (popupTabId !== undefined) {
            await chrome.storage.local.set({ [`bulkActionPopupTab:${popupTabId}`]: true });
        }
        await setupOffscreenDocument('html/offscreen.html');
        const message: BulkAction = {
            type: 'processBulkAction',
            subType: data.subType || 'Bulk Notes Update',
            data: {
                properties,
                VIEWEnvironment: data.VIEWEnvironment || 'djr',
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
    })();
    return true; // keep the messaging channel open for sendResponse
};

function postData(url: string, parsedDocument: string, properties: BulkActionProperties) {
    if (!properties.port || !properties.popupWindow?.tabs?.[0]) {
        console.error("Popup window or tab not found.");
        return;
    }
    if (!properties.popupWindow.tabs[0].id) {
        console.error("Popup window tab ID is not available.");
        return;
    }
    const handler: ChromeOnUpdatedHandler = function (tabId, changeInfo) {
        if (properties.popupWindow?.tabs?.[0].id === tabId && changeInfo.status === "complete") {
            properties.port?.disconnect();
            chrome.tabs.sendMessage(tabId, { url: url, data: parsedDocument, type: 'loadPage' });
            chrome.tabs.onUpdated.removeListener(handler);
        }
    }


    chrome.tabs.onUpdated.addListener(handler); // in case we're faster than page load (usually)
    chrome.tabs.sendMessage(properties.popupWindow.tabs[0].id!, { url: url, data: parsedDocument, type: 'loadPage' }); // just in case we're too late with the listener
}



addMessageListeners([handleWDPPreview(), handleGenerateXLSX, bulkAction, handleGenerateCorrespondence, handleChromeStorage, handleBulkActionPopupState, handleBackgroundFetch, handleWDPProcess()]);
