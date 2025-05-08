import { Message, backgroundData, ChromeStorage } from "./js/obligations"
import { Properties } from "./js/letter-logic";
import { VIEWsubmitParams } from "./js/VIEWsubmit";
import { fetchParams } from "./js/obligations"

backgroundFetchForContentScript()

chrome.runtime.onMessage.addListener(
    function (message: Message<backgroundData>,
        sender: chrome.runtime.MessageSender,
        sendResponse: (response: unknown) => void
    ) {
        if (message.type === 'GenerateCorrespondence') {
            const properties: Properties = {
                obligationRows: [],
                ...message.data
            }; // Add type annotation for properties
            launch(properties)
                .then((res) => {
                    sendResponse({
                        message: JSON.stringify(res),
                    });
                })
                .catch((err) => {
                    sendResponse(
                        {
                            message: JSON.stringify(err, Object.getOwnPropertyNames(err)),
                        }
                    );
                    throw err;
                });
            return true; // Keep the message channel open for async response
        }
    }
);

// --- Main Launch Function ---
async function launch(properties: Properties): Promise<string> {
    try {
        // Assuming VIEWsubmit matches the inferred type
        const scraperRuleSet = 'ObligationSummaryScraperRuleSet'; // Adjust this if needed

        await setupOffscreenDocument('html/VIEWsubmit.html');
        getChromeStorageViaChromeMessageListenerAPI();
        const message: Message<VIEWsubmitParams> = {
            type: 'VIEWsubmit',
            data: {
                properties: properties,
                scraperStepsOption: scraperRuleSet,
                incrementor: 0
            }
        };

        const response = await chrome.runtime.sendMessage(message);
        const responseParsed = JSON.parse(response.message)
        if (response.message.includes('Error')) {
            const error: Error = new Error(responseParsed.message);
            error.stack = responseParsed.stack;
            throw error;
        }
        console.log("Response from background script:", responseParsed);

        return response;
    } catch (error) {
        throw new Error("Error in launch function: " + error);
    }
}

let creating: Promise<void> | null; // A global promise to avoid concurrency issues
async function setupOffscreenDocument(path: string) {
    // Check all windows controlled by the service worker to see if one
    // of them is the offscreen document with the given path
    const offscreenUrl = chrome.runtime.getURL(path);
    const existingContexts = await chrome.runtime.getContexts({
        documentUrls: [offscreenUrl],
        contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT]
    });

    if (existingContexts.length > 0) {
        return;
    }

    // create offscreen document
    if (creating) {
        await creating;
    } else {
        creating = chrome.offscreen.createDocument(
            {
                url: path,
                reasons: [chrome.offscreen.Reason.DOM_PARSER],
                justification: 'Offscreen document for parsing HTML'
            }
        );
        await creating;
        creating = null;
    }
}

//*
function getChromeStorageViaChromeMessageListenerAPI() {
    chrome.runtime.onMessage.addListener(
        function handleStorage(
            request: Message<ChromeStorage>,
            sender: chrome.runtime.MessageSender,
            sendResponse: (response: unknown) => void
        ) {
            if (request.type === 'getStorage') {
                chrome.storage.local.get([request.data.key])
                    .then((result) => {
                        sendResponse({ success: true, value: result[request.data.key] });
                    });
            }
            if (request.type === 'setStorage') {
                chrome.storage.local.set({ [request.data.key]: request.data.value }).then(() => {
                    sendResponse({ success: true });
                });
            }
            return true;
        });
}


function backgroundFetchForContentScript() {
    chrome.runtime.onMessage.addListener(
        function (request: Message<fetchParams>,
            sender: chrome.runtime.MessageSender,
            sendResponse: (response: unknown) => void
        ) {
            if (request.type === 'fetch') {
                fetch(request.data[0])
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return response.blob(); // Get response body as a Blob
                    })
                    .then((blob) => {
                        const reader = new FileReader();
                        reader.onloadend = function () {
                            // reader.result contains the Base64 Data URL string
                            // (e.g., "data:application/zip;base64,UEsDBB...")
                            // You can send the whole thing, or extract just the base64 part if needed
                            sendResponse(reader.result);
                        }
                        reader.onerror = function () {
                            console.error("FileReader error:", reader.error);
                            // Send an error indicator back if desired
                            sendResponse({ error: "Failed to read blob" });
                        }
                        reader.readAsDataURL(blob); // Read the Blob as Base64 Data URL
                    })
                    .catch(error => {
                        console.error("Fetch error:", error);
                        // Send an error indicator back if desired
                        sendResponse({ error: error.message || "Fetch failed" });
                    });

                return true; // Keep the message channel open for async response (FileReader)
            }
        });
}

