import { ProcessConfig, BulkActionProperties } from "./types";

export const bulkAdd = (properties: BulkActionProperties): ProcessConfig => {
    return {
        stepGroup: {
            "Group 1": () => {
                const paramArray: { "txtNoticeNo": string }[] = [];
                properties.obligations.forEach(ob => {
                    const params: { "txtNoticeNo": string } = { "txtNoticeNo": typeof ob.NoticeNumber === "string" ? ob.NoticeNumber : '' };
                    if (properties.txtNoticeCheck === undefined) {
                        properties.txtNoticeCheck = [];
                    }
                    if (ob.NoticeNumber && typeof ob.NoticeNumber === "string" && !properties.txtNoticeCheck.includes(ob.NoticeNumber)) {
                        paramArray.push(params);
                    }
                });
                return paramArray;
            },
            "Group 2": () => {
                return [{ "txtNoticeCheck": properties.obligations.map(ob => ob.NoticeNumber).join(",") }]
            }
        },
        steps: [{
            clearVIEWFormData: true,
            optional: (parsedDocument, properties) => { return properties!.obligations!.length > 10 },
            url: `https://${properties.VIEWEnvironment}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorAddresses.aspx`,
            afterAction: ({ document, properties }) => {
                if (!properties) {
                    throw new Error("Page URL is not defined in properties.");
                }
                const debtorIdElement = document?.getElementById('DebtorDetailsCtrl_DebtorIdSearch');
                if (!debtorIdElement || debtorIdElement instanceof HTMLInputElement === false) {
                    throw new Error("Debtor ID not found in the document.");
                }
                const debtorId = debtorIdElement.value.trim();
                properties.debtorId = debtorId;
                const firstName = document?.getElementById('DebtorDetailsCtrl_firstnameTxt');
                if (!firstName) {
                    throw new Error("First name not found in the document.");
                }
                properties.firstName = firstName.textContent || '';
                const lastName = document?.getElementById('DebtorDetailsCtrl_surnameTxt');
                if (!lastName) {
                    throw new Error("Last name not found in the document.");
                }
                properties.lastName = lastName.textContent || '';
                const companyName = document?.getElementById('DebtorDetailsCtrl_companyNameTxt');
                if (!companyName) {
                    throw new Error("Company name not found in the document.");
                }
                properties.companyName = companyName.textContent || '';
                properties.agencies = [];
            }
        }, {
            // First bulk page to load.
            clearVIEWFormData: true,
            url: properties.page,
        }, {
            url: properties.page,
            optional: (parsedDocument, properties) => { return properties!.obligations.length > 10 },
            urlParams: {
                "btnNoticesSearch.x": 0,
                "btnNoticesSearch.y": 0
            }
        }, {
            url: properties.page,
            optional: (parsedDocument, properties) => { return properties!.obligations.length > 10 && !parsedDocument!.querySelector("#lblErrorMsg")?.textContent?.includes('No notices match the search criteria') },
            urlParams: ({ properties }) => {
                const params: {
                    "SearchNoticeCtrl$txtName"?: string,
                    "NoticeSearchCtrl$btnSearch.x": number,
                    "NoticeSearchCtrl$btnSearch.y": number
                } = {
                    "NoticeSearchCtrl$btnSearch.x": 0,
                    "NoticeSearchCtrl$btnSearch.y": 0,
                }

                if (properties?.firstName?.trim() !== "") params['SearchNoticeCtrl$txtName'] = `${properties?.firstName} ${properties?.lastName}`;
                if (properties?.firstName?.trim() === "") params['SearchNoticeCtrl$txtName'] = properties.companyName;
                return params
            }
        }, {
            url: properties.page,
            optional: (parsedDocument, properties) => {
                if (!parsedDocument?.getElementById("NoticeSearchCtrl_lblResultSet")) { return false }
                const rowCount = parsedDocument?.getElementById("NoticeSearchCtrl_lblResultSet")?.textContent
                if (!rowCount) { throw new Error("Row count not found in the document."); }
                const rowCountNumber = rowCount.trim().split(" ");
                const obligationCount = properties?.obligations?.length
                if (obligationCount === undefined) { throw new Error("Obligation count not defined in properties."); }
                return Number(rowCountNumber[rowCount.length - 1]) > 10 && obligationCount > 10 && !parsedDocument.querySelector("#lblErrorMsg")?.textContent?.includes('No notices match the search criteria');
            },
            urlParams: ({ document }) => {
                const params: {
                    "NoticeSearchCtrl$ddlPaging": number,
                    "NoticeSearchCtrl$hiddenNumberOfRecords": number
                } = {
                    NoticeSearchCtrl$ddlPaging: 0,
                    NoticeSearchCtrl$hiddenNumberOfRecords: 0
                }
                const rowCount = document?.getElementById("NoticeSearchCtrl_lblResultSet")?.textContent?.trim().split(" ")
                if (!rowCount || rowCount.length < 1) {
                    throw new Error("Row count not found or invalid in the document.");
                }
                params["NoticeSearchCtrl$ddlPaging"] = Number(rowCount[rowCount.length - 1]);
                params["NoticeSearchCtrl$hiddenNumberOfRecords"] = Number(rowCount[rowCount.length - 1]);
                return params
            }
        }, {
            url: properties.page,
            optional: (parsedDocument, properties) => { return properties!.obligations.length > 10 && !parsedDocument?.querySelector("#lblErrorMsg")?.textContent?.includes('No notices match the search criteria') },
            urlParams: ({ document, properties }) => {
                const params: {
                    "SearchNoticeCtrl$txtSearchNotices"?: string,
                    "NoticeSearchCtrl$btnSearch.x": number,
                    "NoticeSearchCtrl$btnSearch.y": number
                    "SearchNoticeCtrl$lnkSelect.x"?: number,
                    "SearchNoticeCtrl$lnkSelect.y"?: number,
                    "NoticeSearchCtrl$ddlPaging"?: number,
                    "NoticeSearchCtrl$hiddenNumberOfRecords"?: number
                } = {
                    "NoticeSearchCtrl$btnSearch.x": 0,
                    "NoticeSearchCtrl$btnSearch.y": 0
                }
                const obs = properties?.obligations
                if (!obs || obs.length === 0) {
                    throw new Error("Obligations are not defined or empty in properties.");
                }
                const obligationNumbers = obs.map(ob => typeof ob.NoticeNumber === "string" ? ob.NoticeNumber : '').filter(ob => ob !== '');
                const tableRows = document?.querySelector('#NoticeSearchCtrl_NoticeSearchResult > tbody')?.children;
                if (tableRows === undefined || tableRows.length === 0) {
                    throw new Error("Table rows not found in the document.");
                }
                const found: string[] = [];
                const foundobs: string[] = [];
                Array.from(tableRows).forEach((tr, i) => {
                    if (obligationNumbers.includes(tr.children[2].textContent || '')) {
                        found.push(tr.children[1].textContent || '')
                        foundobs.push(tr.children[2].textContent || '')
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
            url: properties.page,
            urlParams: ({ document, iterationReference }) => {
                const rowCount = document?.getElementById("lblResultSet")?.textContent?.trim().split(" ");
                if (!rowCount || rowCount.length < 1) {
                    throw new Error("Row count not found or invalid in the document.");
                }
                const rowCountProcessed = Number(rowCount[rowCount.length - 1]);
                if (properties.port && document?.getElementById("dvPageing")?.style.display !== "none") {
                    chrome.runtime.sendMessage({
                        type: "updateObligationCount",
                        payload: { obligationCount: properties.obligations.length, addedCount: rowCountProcessed }
                    });
                }
                const params: Record<string, string | number> = {
                    "btnNoticeAdd.x": 0,
                    "btnNoticeAdd.y": 0
                }
                if (!iterationReference || typeof iterationReference !== 'object') {
                    throw new Error("Iteration reference is not defined or invalid.");
                }
                for (const [key, value] of Object.entries(iterationReference)) { params[key] = value }
                params["btnNoticeAdd.x"] = 0;
                params["btnNoticeAdd.y"] = 0;
                return params
            }
        }, {
            group: "Group 2",
            url: properties.page,
            urlParams: ({ document, properties, iterationReference }) => {
                const rowCount = document?.getElementById("lblResultSet")?.textContent?.trim().split(" ");
                if (!rowCount || rowCount.length < 1) {
                    throw new Error("Row count not found or invalid in the document.");
                }
                const rowCountProcessed = Number(rowCount[rowCount.length - 1]);
                if (!properties) {
                    throw new Error("Properties are not defined.");
                }
                if (properties.port && document?.getElementById("dvPageing")?.style.display !== "none") {
                    chrome.runtime.sendMessage({
                        type: "updateObligationCount",
                        payload: { obligationCount: properties.obligations.length, addedCount: rowCountProcessed }
                    });
                } const params: Record<string, string | number> = {
                    "btnNoticeAdd.x": 0,
                    "btnNoticeAdd.y": 0
                }
                if (!iterationReference || typeof iterationReference !== 'object') {
                    throw new Error("Iteration reference is not defined or invalid.");
                }
                for (const [key, value] of Object.entries(iterationReference)) { params[key] = value }
                return params
            }

        }]
    }
}

