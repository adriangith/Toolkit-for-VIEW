import { launch } from "./js/letter-logic";
let running = false;

chrome.runtime.onMessage.addListener(
    async function (message, sender, sendResponse) {
        if (sender.url.toUpperCase().includes(`https://${message[5]}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorObligations`.toUpperCase()) &&
            !message[1].includes('Bulk') && !message[1].includes('Export') &&
            message[4] === false) {
            const properties = {};
            properties.obligationRows = message[6];
            properties.source = message[5];
            properties.agency = message[7];
            properties.letters = message[8];
            properties.extended = message[9];
            properties.SharePoint = message[10];
            launch(properties);
        }
    }
);