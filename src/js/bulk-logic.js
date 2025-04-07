import VIEWsubmit from "./VIEWsubmit.js";

chrome.runtime.onMessage.addListener(
    async function(message, sender, sendResponse) {
        const properties = {};
        if (message[1] && message[1].includes('Bulk')) {
            properties.source = message[5];
            switch (message[1]) {
                case "Bulk Writeoff Update":
                    properties.mode = `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticeGenericBulkUpdate.aspx?Mode=W&Menu=3`;
                    break;
                case "Bulk Notes Update":
                    properties.mode = `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticeGenericBulkUpdate.aspx?Mode=N&Menu=3`;
                    break;
                case "Bulk Hold Update":
                    properties.mode = `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticeGenericBulkUpdate.aspx?Mode=H&Menu=3`;
                    break;
                case "Bulk Hold Remove Update":
                    properties.mode = `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticeGenericBulkUpdate.aspx?Mode=HR&Menu=3`;
                    break;
                case "Bulk Deregistration Update":
                    properties.mode = `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkDeregistrationRequest.aspx?Menu=3`;
                    break;
            }

            properties.obligations = message[0];
            addToBulk(properties);
        }
    });

async function addToBulk(properties) {
    try {
        await VIEWsubmit({}, 0, undefined, bulkAdd(properties), properties);
    } catch (e) {
        console.log(e);
    }
}

function bulkAdd(properties) {
    return {
        groupRepeats: {
            "Group 1": () => {
                let paramArray = [];
                properties.obligations.forEach(ob => {
                    let params = {};
                    params["txtNoticeNo"] = ob;
                    if (properties.txtNoticeCheck === undefined) {
                        properties.txtNoticeCheck = [];
                    }
                    if (!properties.txtNoticeCheck.includes(ob)) {
                        paramArray.push(params);
                    }
                });
                return paramArray;
            },
            "Group 2": () => {
                return [{ "txtNoticeCheck": properties.obligations.join(",") }]
            }
        },
        action: () => {
            createWindow(properties);
        },
        submit: [{
            clearVIEWFormData: true,
            optional: (parsedDocument, properties) => { return properties.obligations.length > 10 },
            url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorAddresses.aspx`,
            after: (parsedDocument) => {
                properties.agencies = [];
                properties.debtorId = parsedDocument.getElementById('DebtorDetailsCtrl_DebtorIdSearch').value
                properties.firstName = parsedDocument.getElementById('DebtorDetailsCtrl_firstnameTxt').textContent
                properties.lastName = parsedDocument.getElementById('DebtorDetailsCtrl_surnameTxt').textContent
                properties.companyName = parsedDocument.getElementById('DebtorDetailsCtrl_companyNameTxt').textContent
            }
        }, {
            clearVIEWFormData: true,
            url: properties.mode,
        }, {
            url: properties.mode,
            optional: (parsedDocument, properties) => { return properties.obligations.length > 10 },
            urlParams: {
                "btnNoticesSearch.x": 0,
                "btnNoticesSearch.y": 0
            }
        }, {
            url: properties.mode,
            optional: (parsedDocument, properties) => { return properties.obligations.length > 10 && !parsedDocument.querySelector("#lblErrorMsg").textContent.includes('No notices match the search criteria') },
            urlParams: (parsedDocument, dynamicParams, properties) => {
                const params = {
                    "NoticeSearchCtrl$btnSearch.x": 0,
                    "NoticeSearchCtrl$btnSearch.y": 0,
                }
                if (properties.firstName.trim() !== "") params['SearchNoticeCtrl$txtName'] = `${properties.firstName} ${properties.lastName}`;
                if (properties.firstName.trim() === "") params['SearchNoticeCtrl$txtName'] = properties.companyName;
                return params
            }
        }, {
            url: properties.mode,
            optional: (parsedDocument, properties) => {
                if (!parsedDocument.getElementById("NoticeSearchCtrl_lblResultSet")) { return false }
                const rowCount = parsedDocument.getElementById("NoticeSearchCtrl_lblResultSet").textContent.trim().split(" ");
                return Number(rowCount[rowCount.length - 1]) > 10 && properties.obligations.length > 10 && !parsedDocument.querySelector("#lblErrorMsg").textContent.includes('No notices match the search criteria');
            },
            urlParams: (parsedDocument, dynamicParams, properties) => {
                const params = {}
                const rowCount = parsedDocument.getElementById("NoticeSearchCtrl_lblResultSet").textContent.trim().split(" ")
                params["NoticeSearchCtrl$ddlPaging"] = Number(rowCount[rowCount.length - 1]);
                params["NoticeSearchCtrl$hiddenNumberOfRecords"] = Number(rowCount[rowCount.length - 1]);
                return params
            }
        }, {
            url: properties.mode,
            optional: (parsedDocument, properties) => { return properties.obligations.length > 10 && !parsedDocument.querySelector("#lblErrorMsg").textContent.includes('No notices match the search criteria') },
            urlParams: (parsedDocument, dynamicParams, properties) => {
                const params = {}
                let obs = properties.obligations
                const tableRows = parsedDocument.querySelector('#NoticeSearchCtrl_NoticeSearchResult > tbody').children;
                const found = [];
                const foundobs = [];
                Array.from(tableRows).forEach((tr, i) => {
                    if (obs.includes(tr.children[2].textContent)) {
                        found.push(tr.children[1].textContent)
                        foundobs.push(tr.children[2].textContent)
                    }
                    params[`SearchNoticeCtrl$txtSearchNotices`] = found.join(',');
                    params["SearchNoticeCtrl$lnkSelect.x"] = 0;
                    params["SearchNoticeCtrl$lnkSelect.y"] = 0;
                    params["NoticeSearchCtrl$ddlPaging"] = 5000;
                    params["NoticeSearchCtrl$hiddenNumberOfRecords"] = 5000;
                    properties.txtNoticeCheck = foundobs.join(',');
                })
                return params
            }
        }, {
            group: "Group 1",
            url: properties.mode,
            urlParams: (parsedDocument, dynamicParams = {}) => {
                let rowCount = parsedDocument.getElementById("lblResultSet").textContent.trim().split(" ");
                rowCount = Number(rowCount[rowCount.length - 1]);
                if (properties.port && parsedDocument.getElementById("dvPageing").style.display !== "none") properties.port.postMessage({ "obligationCount": properties.obligations.length, "addedCount": rowCount });
                const params = {}
                for (let [key, value] of Object.entries(dynamicParams)) { params[key] = value }
                params["btnNoticeAdd.x"] = 0;
                params["btnNoticeAdd.y"] = 0;
                return params
            }
        }, {
            group: "Group 2",
            url: properties.mode,
            urlParams: (parsedDocument, dynamicParams = {}) => {
                let rowCount = parsedDocument.getElementById("lblResultSet").textContent.trim().split(" ");
                rowCount = Number(rowCount[rowCount.length - 1]);
                if (properties.port && !parsedDocument.getElementById("dvPageing").style.display !== "none") properties.port.postMessage({ "obligationCount": properties.obligations.length, "addedCount": rowCount });
                const params = {
                    "btnNoticeAdd.x": 0,
                    "btnNoticeAdd.y": 0
                }
                for (let [key, value] of Object.entries(dynamicParams)) { params[key] = value }
                return params
            }

        }],
        afterAction: (parsedDocument, properties) => {
            var s = new XMLSerializer();
            var str = s.serializeToString(parsedDocument);
            postData(properties.mode, str, properties)
        }
    }
}

function createWindow(properties) {
    chrome.windows.create({ "url": chrome.extension.getURL("post.html"), "type": "popup", "width": 1020, "height": 730 }, function(popupWindow) {
        const handler = function(tabId, changeInfo) {
            if (popupWindow.tabs[0].id === tabId && changeInfo.status === "complete") {
                properties.popupWindow = popupWindow;
                properties.port = chrome.tabs.connect(tabId);
                properties.port.onDisconnect.addListener(function(e) {
                    properties.portDisconnected = true;
                });
            }
        }

        chrome.tabs.onUpdated.addListener(handler); // in case we're faster than page load (usually)
    });
}

function postData(url, parsedDocument, properties) {
    var handler = function(tabId, changeInfo) {
        if (properties.popupWindow.tabs[0].id === tabId && changeInfo.status === "complete") {
            properties.port.disconnect();
            chrome.tabs.sendMessage(tabId, { url: url, data: parsedDocument });
            chrome.tabs.onUpdated.removeListener(handler);
        }
    }

    chrome.tabs.onUpdated.addListener(handler); // in case we're faster than page load (usually)
    chrome.tabs.sendMessage(properties.popupWindow.tabs[0].id, { url: url, data: parsedDocument }); // just in case we're too late with the listener
}