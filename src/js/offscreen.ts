import { getData } from "./scraper";
import { getCorrespondence } from "./correspondence";
import { showVIEWInWDP } from "./showVIEWInWDP";
import { defaultTargetFields } from "./config";
import { Message, ChromeMessageListenerCallback, ErrorResponse, ObligationPreviewProcess } from "./types";
import { addMessageListeners, setStorage } from "./utils";
import VIEWsubmit from "./VIEWSubmit";

let scraperActive = false;
const handleScraper: ChromeMessageListenerCallback = ({ type, data }: Message, _, sendResponse) => {
    if (type !== "obligationScrapeInitialise") return;

    const consoleLogs: string[] = [];

    const customLogFn = (message: string) => {
        //  console.log(message);
        consoleLogs.push(message);
    };

    (async () => {
        if (scraperActive === true) {
            sendResponse({ error: "Scraper is already active." });
            return;
        }
        try {
            scraperActive = true;
            const extractedDataSet = await getData(data.obligations, data.targetFields || defaultTargetFields, 'djr', customLogFn)
            scraperActive = false;
            sendResponse(extractedDataSet);
        } catch (error) {
            scraperActive = false;
            setStorage("obligationsCount", 0);
            sendResponse({ error: error instanceof Error ? error.message : "An unknown error occurred" });
        }
    })();

    return true;
};

//need to type sendResponse as the chrome send response message type
const prepareCorrespondenceData: ChromeMessageListenerCallback = ({ type, data }: Message, _, sendResponse) => {
    if (type !== "prepareCorrespondenceData") return;
    if (!data.dataSet) throw new Error("Invalid data provided");
    (async () => {
        if (!data.dataSet) { // Initial check
            sendResponse("DataSet is missing the 'dataSet' property");
            return;
        }
        try {
            const arrayOfPromises = await getCorrespondence({
                dataSet: data.dataSet,
                wordTemplateProperties: data.wordTemplateProperties
            });

            const resolvedResults = await Promise.all(arrayOfPromises);
            sendResponse(resolvedResults); // Send the actual results if all are successful

        } catch (error) {
            sendResponse(error instanceof Error ? error.message : "An unknown error occurred while generating correspondence.");
        }
    })();

    return true;
};

const obligationPreviewProcess: ObligationPreviewProcess = ({ type, data }, _, sendResponse) => {
    if (type !== "WDPPreviewProcess") return;
    showVIEWInWDP(data.obligations, data.VIEWEnvironment).then((res) => sendResponse({ type: "success", data: res }))
        .catch((res) => {
            const errorResponse: ErrorResponse = {
                "type": "error",
                "error": res,
            };
            sendResponse(errorResponse);
        });
    return true;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const offscreenBulkAction: ChromeMessageListenerCallback = ({ type, data }: Message, _, sendResponse) => {
    if (type !== "processBulkAction") return;
    VIEWsubmit({
        properties: data.properties,
        scraperStepsOption: 'Bulk Update'
    }).then((resultPage) => {
        const s = new XMLSerializer();
        if (!resultPage) {
            throw new Error("No result page returned from VIEWsubmit.");
        }
        sendResponse({
            type: "success",
            data: s.serializeToString(resultPage)
        });
    }).catch((error) => {
        const errorResponse: ErrorResponse = {
            type: "error",
            error: error instanceof Error ? error.message : "An unknown error occurred during the bulk action."
        };
        sendResponse(errorResponse);
    });
    return true;
};

addMessageListeners([handleScraper, prepareCorrespondenceData, obligationPreviewProcess, offscreenBulkAction]);