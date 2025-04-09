import { downloadLetter } from './genLetter-module.js';
import * as taskNotes from './taskNote-module.js';

export function bankruptcyDate(properties) {
    let t = new Date();
    return {
        name: "Bankruptcy Date",
        submit: [{
                optional: () => !properties.taskId,
                url: `https://${properties.source}.view.civicacloud.com.au/Taskflow/Forms/Management/TaskMaintenance.aspx?CRUDMode=Create`,
            },
            {
                optional: () => !properties.taskId,
                url: `https://${properties.source}.view.civicacloud.com.au/Taskflow/Forms/Management/TaskMaintenance.aspx?CRUDMode=Create`,
                urlParams: function(parsedDocument) {
                    const params = {
                        ctl00$mainContentPlaceHolder$lstApplicationModule: "Debtors",
                        ctl00$mainContentPlaceHolder$taskTypeText: "FVBANKRUPT:Notifications of Bankruptcy - Debt Program",
                        ctl00$mainContentPlaceHolder$linkReferenceText: properties.debtorid,
                        ctl00$mainContentPlaceHolder$sourceText: "BSP:BSP",
                        ctl00$mainContentPlaceHolder$startDateTextBox: t.toJSON().slice(0, 10).split('-').reverse().join('/'),
                        ctl00$mainContentPlaceHolder$reasonText: 'WSRTABBNT:Bankruptcy notification from Trustee',
                        ctl00$mainContentPlaceHolder$startTimeTextBox: t.getHours() + ":" + t.getMinutes(),
                        ctl00$mainContentPlaceHolder$originText: "ADMINBR:Administrator of Bankruptcy",
                        "ctl00$mainContentPlaceHolder$createButton.x": 0,
                        "ctl00$mainContentPlaceHolder$createButton.y": 0,
                        "ctl00$mainContentPlaceHolder$descriptionText": 'Status: Unassigned'
                    }
                    return params;
                },
                after: (parsedDocument) => {
                    properties.taskId = parsedDocument.getElementById('ctl00_mainContentPlaceHolder_taskIdText').value;
                }
            },
            {
                repeat: 0,
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorFurtherDetails.aspx`
            },
            {
                repeat: 0,
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorFurtherDetails.aspx`,
                urlParams: {
                    'DebtorDetailsCtrl$hDivId': 1,
                    'DebtorDetailsCtrl$DebtorIdSearch': properties.debtorid,
                    "DebtorIndividualCtrl$editButton.x": 0,
                    "DebtorIndividualCtrl$editButton.y": 0
                }
            }
        ],
        elements: [
            { tag: "input", label: "Date of bankruptcy:", prefill: (parsedDocument, field) => field.value = parsedDocument.getElementById("DebtorIndividualCtrl_dateOfBankruptcyTextbox").value.split("/").reverse().join("-"), attributes: { id: "dateChooser", type: "date", style: "grid-column-start: 2; grid-column-end: 5; width: 80%; align-self: start;" } }
        ],
        progressButtons: [{
                text: "Skip",
                id: "SkipButton",
                name: "Skip",
                next: true,
                float: "right",
                submit: []
            },
            {
                text: "Update & Next Step",
                float: "right",
                id: "SubmitAndNextStep",
                name: "Submit & Next Step",
                submit: [{
                    url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorFurtherDetails.aspx`,
                    next: true,
                    urlParams: (vDocument) => {
                        const params = {};
                        properties.dateOfBankruptcy = document.getElementById("dateChooser").value;
                        params["DebtorIndividualCtrl$dateOfBankruptcyTextbox"] = properties.dateOfBankruptcy.split("-").reverse().join("/");
                        params["DebtorDetailsCtrl$DebtorIdSearch"] = properties.debtorid;
                        params["DebtorIndividualCtrl$updateButton.x"] = 0;
                        params["DebtorIndividualCtrl$updateButton.y"] = 0;
                        return params;
                    }
                }]
            }
        ]
    }
}

export function removeHolds(properties, getDebtorObligations) {
    return {
        name: "Remove Holds",
        submit: [{
            optional: () => { return !properties.dateOfBankruptcy },
            url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorFurtherDetails.aspx`,
            urlParams: {},
            after: (parsedDocument) => {
                parsedDocument.getElementById('DebtorIndividualCtrl_dateOfBankruptcyTxt') && (properties.dateOfBankruptcy = parsedDocument.getElementById('DebtorIndividualCtrl_dateOfBankruptcyTxt').textContent.trim().split("/").reverse().join("-"));
                properties.txtNoticeCheck = [];
            }
        }],
        elements: [
            { tag: "div", attributes: { id: "tablecontainer", style: "grid-column-start: 1; grid-column-end: 5; margin:auto; width: 80%; align-self: start; font-size: 8pt; margin-bottom: 20px" } },
            { tag: "table", selectCriteria: "BRTHOLD", parent: "tablecontainer", dataSource: () => getDebtorObligations(properties.source), attributes: { id: "obligationtable", class: "table", style: "grid-column-start: 2; grid-column-end: 5; width: 100%; align-self: start; font-size: 8pt;" } },
        ],
        progressButtons: [{
            text: "Skip",
            id: "SkipButton",
            name: "Skip",
            next: true,
            float: "right",
            submit: []
        }, {
            text: "Remove Holds & Next Step",
            float: "right",
            id: "SubmitAndNextStep",
            name: "Submit & Next Step",
            groupRepeats: {
                "Group 1": () => {
                    let paramArray = [];
                    properties.allObligations.rows({ selected: true }).every(function(rowIdx, tableLoop, rowLoop) {
                        let params = {};
                        let data = this.data();
                        let all = properties.allObligations.rows({ selected: true }).data().toArray().map(row => row.NoticeNumber)
                        let previousObligations = all.slice(0, rowLoop).join(",");
                        params["txtNoticeNo"] = data.NoticeNumber;
                        if (properties.txtNoticeCheck === undefined) {
                            properties.txtNoticeCheck = [];
                        }
                        if (!properties.txtNoticeCheck.includes(data.NoticeNumber)) {
                            paramArray.push(params);
                        }
                    });
                    return paramArray;
                },
                "Group 2": () => {
                    let selectArray = properties.allObligations.rows({ selected: true }).data().toArray().map(row => row.NoticeNumber)
                    let previousObligations = selectArray.join(",");
                    if (!properties.holdsRemoved)
                        properties.holdsRemoved = previousObligations;
                    else
                        properties.holdsRemoved = properties.holdsRemoved + "," + previousObligations;
                    return [{ "txtNoticeCheck": previousObligations }]
                }
            },
            submit: [{
                clearVIEWFormData: true,
                optional: () => {!properties.firstName },
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorAddresses.aspx`,
                after: (parsedDocument) => {
                    properties.agencies = [];
                    properties.debtorid = parsedDocument.getElementById('DebtorDetailsCtrl_DebtorIdSearch').value
                    properties.firstName = parsedDocument.getElementById('DebtorDetailsCtrl_firstnameTxt').textContent
                    properties.lastName = parsedDocument.getElementById('DebtorDetailsCtrl_surnameTxt').textContent
                }
            }, {
                clearVIEWFormData: true,
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkGenericUpdate.aspx?Mode=HR&Menu=3`,
            }, {
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkGenericUpdate.aspx?Mode=HR&Menu=3`,
                optional: (parsedDocument, properties) => { console.log(properties); return properties.allObligations.rows({ selected: true }).data().length > 10 },
                urlParams: {
                    "btnNoticesSearch.x": 0,
                    "btnNoticesSearch.y": 0
                }
            }, {
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkGenericUpdate.aspx?Mode=HR&Menu=3`,
                optional: (parsedDocument, properties) => { return properties.allObligations.rows({ selected: true }).data().length > 10 },
                urlParams: (parsedDocument, dynamicParams, properties) => {
                    const params = {
                        "SearchNoticeCtrl$btnSearch.x": 0,
                        "SearchNoticeCtrl$btnSearch.y": 0,
                        "SearchNoticeCtrl$txtName": `${properties.firstName.split(" ")[0]} ${properties.lastName}`
                    }
                    return params
                }
            }, {
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkGenericUpdate.aspx?Mode=HR&Menu=3`,
                optional: (parsedDocument, properties) => {
                    if (!parsedDocument.getElementById("SearchNoticeCtrl_lblResultSet")) { return false }
                    const rowCount = parsedDocument.getElementById("SearchNoticeCtrl_lblResultSet").textContent.trim().split(" ");
                    return Number(rowCount[rowCount.length - 1]) > 10 && properties.allObligations.rows({ selected: true }).data().length > 10 && !parsedDocument.querySelector("#lblErrorMsg").textContent.includes('No notices match the search criteria');
                },
                urlParams: {
                    "__EVENTTARGET": "SearchNoticeCtrl$link_Toggle"
                }
            }, {
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkGenericUpdate.aspx?Mode=HR&Menu=3`,
                optional: (parsedDocument, properties) => { return properties.allObligations.rows({ selected: true }).data().length > 10 && !parsedDocument.querySelector("#lblErrorMsg").textContent.includes('No notices match the search criteria') },
                urlParams: (parsedDocument, dynamicParams, properties) => {
                    const params = {}
                    let obs = []
                    properties.allObligations.rows({ selected: true }).every(function(rowIdx, tableLoop, rowLoop) {
                        const data = this.data();
                        obs.push(data.NoticeNumber);
                    })
                    const tableRows = parsedDocument.querySelector('#SearchNoticeCtrl_dgSearchResult > tbody').children;
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
                        properties.txtNoticeCheck = foundobs.join(',');
                    })
                    return params
                }
            }, {
                group: "Group 1",
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkGenericUpdate.aspx?Mode=HR&Menu=3`,
                urlParams: (parsedDocument, dynamicParams = {}) => {
                    const params = {}
                    for (let [key, value] of Object.entries(dynamicParams)) { params[key] = value }
                    params["btnNoticeAdd.x"] = 0;
                    params["btnNoticeAdd.y"] = 0;
                    return params
                }
            }, {
                group: "Group 2",
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkGenericUpdate.aspx?Mode=HR&Menu=3`,
                next: true,
                urlParams: (parsedDocument, dynamicParams = {}) => {
                    const params = {}
                    for (let [key, value] of Object.entries(dynamicParams)) { params[key] = value }
                    params["btnBulkUpdate.x"] = 0;
                    params["btnBulkUpdate.y"] = 0;
                    return params
                }
            }]
        }]
    }
}

export function uploadDocuments(properties) {
    let t = new Date();
    return {
        name: "Upload Documents",
        submit: [{
            url: `https://${properties.source}.view.civicacloud.com.au/Taskflow/Forms/Management/DocumentImport.aspx`
        }],
        elements: [{
                tag: "input",
                prefill: (parsedDocument, field) => {
                    field.onchange = function() {
                        if (this.files[0].size > 10485759) {
                            alert("File must be under 10Mb");
                            this.value = "";
                        };
                    };
                },
                label: "Load Document:",
                attributes: { id: "fileChooser", type: "file", style: "grid-column-start: 2; grid-column-end: 5; width: 80%" }
            },
            { tag: "select", label: "Description:", attributes: { id: "descriptionChooser", style: "grid-column-start: 2; grid-column-end: 5; align-self: start; width: 80%" } },
            { tag: "option", parent: "descriptionChooser", attributes: { disabled: "", selected: "" }, text: "Type a description or select description from list" },
            { tag: "option", parent: "descriptionChooser", text: "Notification of Bankruptcy (Bankruptcy Act 1966)" },
            { tag: "option", parent: "descriptionChooser", text: "Notification of Bankruptcy - Debtors Petition" },
            { tag: "option", parent: "descriptionChooser", text: "Letter from Trustee" },
            { tag: "option", parent: "descriptionChooser", text: "Certificate of Appointment of Trustee" },
            { tag: "option", parent: "descriptionChooser", text: "Report to Creditors" },
            { tag: "option", parent: "descriptionChooser", text: "Further Report to Creditors" },
            { tag: "option", parent: "descriptionChooser", text: "Proposal, Terminate Part IX Debt Agreement Wthdrwl" },
            { tag: "option", parent: "descriptionChooser", text: "Notice of Intention - Declare Dividend" },
            { tag: "textarea", label: "Edit Description: <br />(optional, max 50 characters)", attributes: { id: "editDescription", maxlength: 50, name: 'ctl00$mainContentPlaceHolder$documentDescriptionText', style: "grid-column-start: 2; grid-column-end: 5; width: 80%" } },
        ],
        progressButtons: [{
                text: "Skip",
                id: "SkipButton",
                name: "Skip",
                next: true,
                float: "right",
                submit: []
            },
            {
                "text": "Upload and Next Step",
                float: "right",
                id: "SubmitAndNextStep",
                name: "Submit & Next Step",
                submit: [{
                        url: `https://${properties.source}.view.civicacloud.com.au/Taskflow/Forms/Management/DocumentImport.aspx`,
                        attempts: 1,
                        format: "FormData",
                        next: true,
                        urlParams: async() => {
                            const params = {
                                ctl00$mainContentPlaceHolder$lstApplicationModule: "Debtors",
                                ctl00$mainContentPlaceHolder$taskTypeText: "FVBANKRUPT",
                                ctl00$mainContentPlaceHolder$taskTypeIdHidden: 470,
                                ctl00$mainContentPlaceHolder$linkReferenceText: properties.debtorid,
                                ctl00$mainContentPlaceHolder$sourceText: "BSP:BSP",
                                ctl00$mainContentPlaceHolder$startDateTextBox: t.toJSON().slice(0, 10).split('-').reverse().join('/'),
                                ctl00$mainContentPlaceHolder$reasonText: 'WSRTABBNT:Bankruptcy notification from Trustee',
                                ctl00$mainContentPlaceHolder$startTimeTextBox: t.getHours() + ":" + t.getMinutes(),
                                ctl00$mainContentPlaceHolder$originText: "ADMINBR:Administrator of Bankruptcy",
                                "ctl00$mainContentPlaceHolder$updateButton.x": 0,
                                "ctl00$mainContentPlaceHolder$updateButton.y": 0,
                                "ctl00$mainContentPlaceHolder$documentImportFileUpload": document.getElementById("fileChooser").files.item(0),
                            }
                            if (properties.taskId) {
                                params.ctl00$mainContentPlaceHolder$createTaskCheck = "";
                                params.ctl00$mainContentPlaceHolder$taskIdText = properties.taskId;
                            }

                            return params
                        }
                    }
                    /* , {
                                        url: `https://${properties.source}.view.civicacloud.com.au/Taskflow/Forms/Management/DocumentImport.aspx`,
                                        next: true,
                                        urlParams: (parsedDocument) => {
                                            if (parsedDocument.getElementById('ctl00_mainContentPlaceHolder_messageLable') && properties.taskId === undefined) {
                                                properties.taskId = parsedDocument.getElementById('ctl00_mainContentPlaceHolder_messageLable').textContent.split(" ")[7]
                                            }
                                            return {};
                                        }
                                    } */
                ]
            }, {
                text: "Upload and Next Document",
                id: "SubmitAndNextDocument",
                next: false,
                float: "right",
                name: "Submit & Next Document",
                afterAction: (parsedDocument) => {
                    document.getElementById('content').reset();
                    shade.style.display = "none"
                },
                submit: [{
                    url: `https://${properties.source}.view.civicacloud.com.au/Taskflow/Forms/Management/DocumentImport.aspx`,
                    format: "FormData",
                    attempts: 1,
                    urlParams: async function() {
                        const params = {
                            "ctl00$mainContentPlaceHolder$updateButton.x": 0,
                            "ctl00$mainContentPlaceHolder$updateButton.y": 0,
                            "ctl00$mainContentPlaceHolder$documentImportFileUpload": document.getElementById("fileChooser").files.item(0),
                            ctl00$mainContentPlaceHolder$lstApplicationModule: "Debtors",
                            ctl00$mainContentPlaceHolder$taskTypeIdHidden: 470,
                            ctl00$mainContentPlaceHolder$taskTypeText: "FVBANKRUPT",
                            ctl00$mainContentPlaceHolder$linkReferenceText: properties.debtorid,
                            ctl00$mainContentPlaceHolder$sourceText: "BSPFIN:Business Service Provider - Financial",
                            ctl00$mainContentPlaceHolder$startDateTextBox: t.toJSON().slice(0, 10).split('-').reverse().join('/'),
                            ctl00$mainContentPlaceHolder$reasonText: 'ENFRVREQ:"Request for Enforcement Review to be decided"',
                            ctl00$mainContentPlaceHolder$startTimeTextBox: t.getHours() + ":" + t.getMinutes(),
                            ctl00$mainContentPlaceHolder$originText: "DEBTOR:Debtor"

                        }
                        if (properties.taskId) {
                            params.ctl00$mainContentPlaceHolder$createTaskCheck = "";
                            params.ctl00$mainContentPlaceHolder$taskIdText = properties.taskId;
                        }

                        return params
                    }
                }, {
                    url: `https://${properties.source}.view.civicacloud.com.au/Taskflow/Forms/Management/DocumentImport.aspx`,
                    urlParams: (parsedDocument, b, url) => {

                        if (parsedDocument.getElementById('ctl00_mainContentPlaceHolder_messageLable') && properties.taskId === undefined) {
                            properties.taskId = parsedDocument.getElementById('ctl00_mainContentPlaceHolder_messageLable').textContent.split(" ")[7]
                        }
                        return {};
                    }
                }]
            }
        ]
    }
}

export function proceduralHolds(properties, getDebtorObligations) {
    return {
        name: "Place Procedural Holds",
        submit: [{
                optional: () => { return !properties.dateOfBankruptcy },
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorFurtherDetails.aspx`,
            },
            {
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/Warrant/DebtorExecuteAction.aspx`,
                urlParams: (parsedDocument) => {
                    (parsedDocument && parsedDocument.getElementById('DebtorIndividualCtrl_dateOfBankruptcyTxt')) && (properties.dateOfBankruptcy = parsedDocument.getElementById('DebtorIndividualCtrl_dateOfBankruptcyTxt').textContent.trim().split("/").reverse().join("-"));
                }
            }, {
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/Warrant/DebtorExecuteAction.aspx`,
                urlParams: { "DebtorExecuteActionCtrl$ddlAction": 10 }
            }
        ],
        elements: [
            { tag: "div", attributes: { id: "tablecontainer", style: "margin: auto; grid-column-start: 1; grid-column-end: 5; width: 80%; align-self: start; font-size: 8pt; margin-bottom: 20px" } },
            { tag: "table", "selectCriteria": "WarrantProvable", parent: "tablecontainer", dataSource: () => getDebtorObligations(properties.source), attributes: { id: "obligationtable", class: "table", style: "grid-column-start: 2; grid-column-end: 5; width: 100%; align-self: start; font-size: 8pt;" } },
            { tag: "input", label: "Officer Code:", attributes: { id: "officerNameField", type: "text", name: "debtorProceduralActionCtrl$txtOfficerNameForProcedural", class: "field", style: "grid-column-start: 2; grid-column-end: 5; width: 80%; align-self: start; font-size: 8pt;" } },
        ],
        progressButtons: [{
            text: "Skip",
            id: "SkipButton",
            name: "Skip",
            next: true,
            float: "right",
            submit: []
        }, {
            float: "right",
            text: "Place Holds & Next Step",
            id: "SubmitAndNextStep",
            name: "Submit & Next Step",
            submit: [{
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/Warrant/DebtorExecuteAction.aspx`,
                urlParams: (vDocument, dynamicParams) => {
                    const params = {}
                    let warrantObligations = []
                    properties.allObligations.rows({ selected: true }).every(function(rowIdx, tableLoop, rowLoop) {
                        const data = this.data();
                        warrantObligations.push(data.NoticeNumber);
                    })
                    properties.proceduralHoldsPlaced = warrantObligations.join(",");
                    let tableRows = vDocument.querySelector('#WarrantGrid > tbody').children;

                    Array.from(tableRows).forEach((tr, i) => {
                        let currentRow = pad(i + 1, 2);
                        if (tr.children[2] !== undefined && warrantObligations.includes(tr.children[2].textContent)) {
                            (params[`DebtorExecuteActionCtrl$WarrantGrid$ctl${currentRow}$chkWarrantNumber`] = "on")
                        }
                        params["DebtorExecuteActionCtrl$btnCreateFDORecord.x"] = 0,
                            params["DebtorExecuteActionCtrl$btnCreateFDORecord.y"] = 0
                    })
                    return params
                }
            }, {
                next: true,
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/Warrant/DebtorExecuteAction.aspx`,
                urlParams: {
                    "debtorProceduralActionCtrl$hdnWarrantStatusChangeRequired": true,
                    "debtorProceduralActionCtrl$hdnWarrantStatusID": 97,
                    "debtorProceduralActionCtrl$hdnIsDecreseFieldCountCheck": "No",
                    "debtorProceduralActionCtrl$debtorProceduralActionCtrl$hdnProceduralActionCatalogueID": 263,
                    "debtorProceduralActionCtrl$btnUpdateProceduralAction.x": 0,
                    "debtorProceduralActionCtrl$btnUpdateProceduralAction.y": 0,
                    "debtorProceduralActionCtrl$txtProceduralAction": "NOTDBNKRPT:Notification of Debtor Bankruptcy",
                    "debtorProceduralActionCtrl$hdnProceduralActionCode": "NOTDBNKRPT",
                }
            }],
        }]
    }
}

export function liftProceduralHolds(properties, getDebtorObligations) {
    return {
        name: "Lift Procedural Holds",
        submit: [{
                optional: () => { return !properties.dateOfBankruptcy },
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorFurtherDetails.aspx`,
            },
            {
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/Warrant/DebtorExecuteAction.aspx`,
                urlParams: (parsedDocument) => {
                    (parsedDocument && parsedDocument.getElementById('DebtorIndividualCtrl_dateOfBankruptcyTxt')) && (properties.dateOfBankruptcy = parsedDocument.getElementById('DebtorIndividualCtrl_dateOfBankruptcyTxt').textContent.trim().split("/").reverse().join("-"));
                }
            }, {
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/Warrant/DebtorExecuteAction.aspx`,
                urlParams: { "DebtorExecuteActionCtrl$ddlAction": 10 }
            }
        ],
        elements: [
            { tag: "div", attributes: { id: "tablecontainer", style: "margin: auto; grid-column-start: 1; grid-column-end: 5; width: 80%; align-self: start; font-size: 8pt; margin-bottom: 20px" } },
            { tag: "table", "selectCriteria": "WarrantProvableLift", parent: "tablecontainer", dataSource: (parsedDocument) => getDebtorObligations(properties.source, parsedDocument), attributes: { id: "obligationtable", class: "table", style: "grid-column-start: 2; grid-column-end: 5; width: 100%; align-self: start; font-size: 8pt;" } },
            { tag: "input", label: "Officer Code:", attributes: { id: "officerNameField", type: "text", name: "debtorProceduralActionCtrl$txtOfficerNameForProcedural", class: "field", style: "grid-column-start: 2; grid-column-end: 5; width: 80%; align-self: start; font-size: 8pt;" } },
        ],
        progressButtons: [{
            text: "Skip",
            id: "SkipButton",
            name: "Skip",
            next: true,
            float: "right",
            submit: []
        }, {
            text: "Lift Holds & Next Step",
            float: "right",
            id: "SubmitAndNextStep",
            name: "Submit & Next Step",
            submit: [{
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/Warrant/DebtorExecuteAction.aspx`,
                urlParams: (vDocument, dynamicParams) => {
                    const params = {}
                    let warrantObligations = []
                    properties.allObligations.rows({ selected: true }).every(function(rowIdx, tableLoop, rowLoop) {
                        const data = this.data();
                        warrantObligations.push(data.NoticeNumber);
                    })
                    let tableRows = vDocument.querySelector('#WarrantGrid > tbody').children;

                    Array.from(tableRows).forEach((tr, i) => {
                        let currentRow = pad(i + 2, 2);
                        if (tr.children[2] !== undefined && warrantObligations.includes(tr.children[2].textContent)) {
                            (params[`DebtorExecuteActionCtrl$WarrantGrid$ctl${currentRow}$chkWarrantNumber`] = "on")
                        }
                        params["DebtorExecuteActionCtrl$btnCreateFDORecord.x"] = 0,
                            params["DebtorExecuteActionCtrl$btnCreateFDORecord.y"] = 0
                    })
                    return params
                }
            }, {
                next: true,
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/Warrant/DebtorExecuteAction.aspx`,
                urlParams: {
                    "debtorProceduralActionCtrl$hdnWarrantStatusChangeRequired": true,
                    "debtorProceduralActionCtrl$hdnWarrantStatusID": 30,
                    "debtorProceduralActionCtrl$hdnIsDecreseFieldCountCheck": "No",
                    "debtorProceduralActionCtrl$debtorProceduralActionCtrl$hdnProceduralActionCatalogueID": 366,
                    "debtorProceduralActionCtrl$btnUpdateProceduralAction.x": 0,
                    "debtorProceduralActionCtrl$btnUpdateProceduralAction.y": 0,
                    "debtorProceduralActionCtrl$txtProceduralAction": "DEBT-LIFHO:Lift Hold",
                    "debtorProceduralActionCtrl$hdnProceduralActionCode": "DEBT-LIFHO",
                }
            }],
        }]
    }
}

export function placeHolds(properties, getDebtorObligations) {
    return {
        name: "Place Holds",
        submit: [{
            optional: () => { return !properties.dateOfBankruptcy },
            url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorFurtherDetails.aspx`,
            urlParams: {},
            after: (parsedDocument) => {
                parsedDocument.getElementById('DebtorIndividualCtrl_dateOfBankruptcyTxt') && (properties.dateOfBankruptcy = parsedDocument.getElementById('DebtorIndividualCtrl_dateOfBankruptcyTxt').textContent.trim().split("/").reverse().join("-"));
                properties.txtNoticeCheck = [];
            }
        }],
        elements: [
            { tag: "div", attributes: { id: "tablecontainer", style: "margin: auto; grid-column-start: 1; grid-column-end: 5; width: 80%; align-self: start; font-size: 8pt; margin-bottom: 20px" } },
            { tag: "table", selectCriteria: "Provable", parent: "tablecontainer", dataSource: () => getDebtorObligations(properties.source), attributes: { id: "obligationtable", class: "table", style: "grid-column-start: 2; grid-column-end: 5; width: 100%; align-self: start; font-size: 8pt;" } },
            { tag: "input", label: "Hold Reason:", attributes: { value: "PROVABLE:Provable – Subject to bankruptcy", id: "txtHoldReason", name: "txtHoldReason", type: "text", class: "textField", style: "grid-column-start: 2; grid-column-end: 5; width: 80%; align-self: start; font-size: 8pt;" } },
            { tag: "input", label: "End Date:", attributes: { id: "txtIneffectiveDate", name: "txtIneffectiveDate", type: "text", class: "textField", style: "grid-column-start: 2; grid-column-end: 5; align-self: start; font-size: 8pt; width: 80%" } },
        ],
        progressButtons: [{
            text: "Skip",
            id: "SkipButton",
            next: true,
            float: "right",
            submit: []
        }, {
            text: "Place Holds & Next Step",
            id: "SubmitHolds",
            float: "right",
            groupRepeats: {
                "Group 1": () => {
                    let paramArray = [];
                    properties.allObligations.rows({ selected: true }).every(function(rowIdx, tableLoop, rowLoop) {
                        let params = {};
                        let data = this.data();
                        let all = properties.allObligations.rows({ selected: true }).data().toArray().map(row => row.NoticeNumber)
                        let previousObligations = all.slice(0, rowLoop).join(",");
                        params["txtNoticeNo"] = data.NoticeNumber;
                        if (properties.txtNoticeCheck === undefined) {
                            properties.txtNoticeCheck = [];
                        }
                        if (!properties.txtNoticeCheck.includes(data.NoticeNumber)) {
                            paramArray.push(params);
                        }
                    });
                    return paramArray;
                },
                "Group 2": () => {
                    let selectArray = properties.allObligations.rows({ selected: true }).data().toArray().map(row => row.NoticeNumber)
                    let previousObligations = selectArray.join(",");
                    if (!properties.holdsRemoved)
                        properties.holdsPlaced = previousObligations;
                    else
                        properties.holdsPlaced = properties.holdsPlaced + "," + previousObligations;
                    return [{ "txtNoticeCheck": previousObligations }]
                }
            },
            submit: [{
                clearVIEWFormData: true,
                optional: () => {!properties.firstName },
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorAddresses.aspx`,
                after: (parsedDocument) => {
                    properties.agencies = [];
                    properties.debtorid = parsedDocument.getElementById('DebtorDetailsCtrl_DebtorIdSearch').value
                    properties.firstName = parsedDocument.getElementById('DebtorDetailsCtrl_firstnameTxt').textContent
                    properties.lastName = parsedDocument.getElementById('DebtorDetailsCtrl_surnameTxt').textContent
                }
            }, {
                clearVIEWFormData: true,
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkGenericUpdate.aspx?Mode=H&Menu=3`,
            }, {
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkGenericUpdate.aspx?Mode=H&Menu=3`,
                optional: (parsedDocument, properties) => { console.log(properties); return properties.allObligations.rows({ selected: true }).data().length > 10 },
                urlParams: {
                    "btnNoticesSearch.x": 0,
                    "btnNoticesSearch.y": 0
                }
            }, {
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkGenericUpdate.aspx?Mode=H&Menu=3`,
                optional: (parsedDocument, properties) => { return properties.allObligations.rows({ selected: true }).data().length > 10 },
                urlParams: (parsedDocument, dynamicParams, properties) => {
                    const params = {
                        "SearchNoticeCtrl$btnSearch.x": 0,
                        "SearchNoticeCtrl$btnSearch.y": 0,
                        "SearchNoticeCtrl$txtName": `${properties.firstName.split(" ")[0]} ${properties.lastName}`
                    }
                    return params
                }
            }, {
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkGenericUpdate.aspx?Mode=H&Menu=3`,
                optional: (parsedDocument, properties) => {
                    if (!parsedDocument.getElementById("SearchNoticeCtrl_lblResultSet")) { return false }
                    const rowCount = parsedDocument.getElementById("SearchNoticeCtrl_lblResultSet").textContent.trim().split(" ");
                    return Number(rowCount[rowCount.length - 1]) > 10 && properties.allObligations.rows({ selected: true }).data().length > 10 && !parsedDocument.querySelector("#lblErrorMsg").textContent.includes('No notices match the search criteria');
                },
                urlParams: {
                    "__EVENTTARGET": "SearchNoticeCtrl$link_Toggle"
                }
            }, {
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkGenericUpdate.aspx?Mode=H&Menu=3`,
                optional: (parsedDocument, properties) => { return properties.allObligations.rows({ selected: true }).data().length > 10 && !parsedDocument.querySelector("#lblErrorMsg").textContent.includes('No notices match the search criteria') },
                urlParams: (parsedDocument, dynamicParams, properties) => {
                    const params = {}
                    let obs = []
                    properties.allObligations.rows({ selected: true }).every(function(rowIdx, tableLoop, rowLoop) {
                        const data = this.data();
                        obs.push(data.NoticeNumber);
                    })
                    const tableRows = parsedDocument.querySelector('#SearchNoticeCtrl_dgSearchResult > tbody').children;
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
                        properties.txtNoticeCheck = foundobs.join(',');
                    })
                    return params
                }
            }, {
                group: "Group 1",
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkGenericUpdate.aspx?Mode=H&Menu=3`,
                urlParams: (parsedDocument, dynamicParams = {}) => {
                    const params = {}
                    for (let [key, value] of Object.entries(dynamicParams)) { params[key] = value }
                    params["btnNoticeAdd.x"] = 0;
                    params["btnNoticeAdd.y"] = 0;
                    return params
                }
            }, {
                group: "Group 2",
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkGenericUpdate.aspx?Mode=H&Menu=3`,
                next: true,
                urlParams: (parsedDocument, dynamicParams = {}) => {
                    const params = {}
                    for (let [key, value] of Object.entries(dynamicParams)) { params[key] = value }
                    params["btnBulkUpdate.x"] = 0;
                    params["btnBulkUpdate.y"] = 0;
                    return params
                }
            }]
        }]
    }
}

export function noticeNotes(source, debtorid, taskid) {
    return {
        name: "Notice Notes",
        submit: [{
            url: `https://${source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkGenericUpdate.aspx?Mode=N&Menu=3`,
        }],
        elements: [
            { tag: "div", label: "Obligations:", attributes: { id: "tablecontainer", style: "grid-column-start: 2; grid-column-end: 5; width: 80%; align-self: start; font-size: 8pt; margin-bottom: 20px" } },
            { tag: "table", selectCriteria: "onHold", parent: "tablecontainer", dataSource: () => getDebtorObligations(source), attributes: { id: "obligationtable", class: "table", style: "grid-column-start: 2; grid-column-end: 5; width: 100%; align-self: start; font-size: 8pt;" } },
            { tag: "textarea", label: "Note:", attributes: { id: "noticeNoteField", name: "txtNotes", class: "textField", style: "grid-column-start: 2; grid-column-end: 5; width: 80%; height:50px; align-self: start; font-size: 8pt;" } },
        ],
        progressButtons: [{
            src: "SubmitAndNextStep.png",
            id: "SubmitAndNextStep",
            name: "Submit & Next Step",
            submit: [{
                url: `https://${source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkGenericUpdate.aspx?Mode=N&Menu=3`,
                repeat: () => {
                    let paramArray = [];
                    properties.allObligations.rows({ selected: true }).every(function(rowIdx, tableLoop, rowLoop) {
                        let params = {};
                        let data = this.data();
                        let all = properties.allObligations.rows({ selected: true }).data().toArray()
                        let previousObligations = all.map(row => row.NoticeNumber).slice(0, rowLoop).join(",");
                        params["txtNoticeNo"] = data.NoticeNumber;
                        if (rowLoop >= 1) {
                            params["txtNoticeCheck"] = previousObligations
                        }
                        paramArray.push(params);
                    });
                    return paramArray;
                },
                urlParams: (vDocument, dynamicParams) => {
                    const params = {}
                    for (let [key, value] of Object.entries(dynamicParams)) { params[key] = value }
                    params["btnNoticeAdd.x"] = 0;
                    params["btnNoticeAdd.y"] = 0;
                    return params
                }
            }, {
                url: `https://${source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkGenericUpdate.aspx?Mode=N&Menu=3`,
                repeat: () => {
                    let previousObligations = properties.allObligations.rows({ selected: true }).data().toArray().map(row => row.NoticeNumber).join(",");;
                    return [{ "txtNoticeCheck": previousObligations }]
                },
                next: true,
                url: `https://${source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkGenericUpdate.aspx?Mode=N&Menu=3`,
                urlParams: (vDocument, dynamicParams) => {
                    const params = {}
                    for (let [key, value] of Object.entries(dynamicParams)) { params[key] = value }
                    params["btnBulkUpdate.x"] = 0;
                    params["btnBulkUpdate.y"] = 0;
                    return params
                }
            }]
        }]
    }
}

export function debtorNote(properties) {
    return {
        name: "Debtor Note",
        submit: [{
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorNotes.aspx`,
            },
            {
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorNotes.aspx`,
                urlParams: {
                    "PESNotesCtrlMain$btnAddNote.x": 0,
                    "PESNotesCtrlMain$btnAddNote.y": 0
                }
            }
        ],
        elements: [{
            tag: "textarea",
            label: "Note:",
            prefill: (parsedDocument, field) => {
                field.value = `Bankruptcy task ${properties.taskId} created. All notes attached to task.`;
            },
            attributes: { name: "PESNotesCtrlMain$txtNotes", id: "noteDescription", style: "grid-column-start: 2; grid-column-end: 5; width: 80%; align-self: start; font-size: 8pt; height: 200px" }
        }, ],
        progressButtons: [{
            text: "Skip",
            id: "SkipButton",
            name: "Skip",
            next: true,
            float: "left",
            submit: []
        }, {
            text: "Submit & Next Step",
            float: "right",
            id: "SubmitAndNextStep",
            name: "Submit & Next Step",
            submit: [{
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorNotes.aspx`,
                next: true,
                urlParams: {
                    "PESNotesCtrlMain$btnUpdate.x": 0,
                    "PESNotesCtrlMain$btnUpdate.y": 0
                }
            }]
        }]
    }
}


export function taskNote(properties) {
    return {
        name: "Task Note",
        submit: [],
        elements: [{
            tag: "textarea",
            label: "Note:",
            prefill: (parsedDocument, field, properties) => {
                field.value = taskNotes[properties.taskNote](properties)
            },
            attributes: { name: "ctl00$mainContentPlaceHolder$ctl16$txtNotes", id: "noteDescription", style: "grid-column-start: 2; grid-column-end: 5; width: 80%; align-self: start; font-size: 8pt; height: 200px" }
        }, ],
        progressButtons: [{
            text: "Skip",
            id: "SkipButton",
            name: "Skip",
            next: true,
            float: "right",
            submit: []
        }, {
            text: "Submit & Next Step",
            float: "right",
            id: "SubmitAndNextStep",
            name: "Submit & Next Step",
            submit: [{
                urlParams: function() {
                    this.url = `https://${properties.source}.view.civicacloud.com.au/Taskflow/Forms/Management/TaskMaintenance.aspx?DisplayNotes=True&TaskID=${properties.taskId}&ProcessMode=User&AddNote=1`
                    return {}
                }
            }, {
                next: true,
                urlParams: function() {
                    this.url = `https://${properties.source}.view.civicacloud.com.au/Taskflow/Forms/Management/TaskMaintenance.aspx?DisplayNotes=True&TaskID=${properties.taskId}&ProcessMode=User&AddNote=1`
                    return {
                        "ctl00$mainContentPlaceHolder$ctl16$btnUpdate.x": 0,
                        "ctl00$mainContentPlaceHolder$ctl16$btnUpdate.y": 0
                    }
                }
            }]
        }]
    }
}

export function finish(properties) {
    return {
        name: "Finish",
        submit: [],
        elements: [{
            tag: "span",
            noLabel: true,
            prefill: (vDocument, field) => {
                field.addEventListener('mouseup', function() {
                    chrome.tabs.reload(properties.catalystTabID);
                    window.close()
                })
            },
            attributes: { class: "mybutton", style: "height: 12px; width: 78px; transform: scale(3); grid-column-start: 1;grid-column-end: 5; margin:auto; grid-row-start: 4;" },
            text: "Close Window"
        }]
    }
}

export function application(properties) {
    return {
        name: "Application",
        submit: [{
                optional: () => { return !properties.dateOfBankruptcy },
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorFurtherDetails.aspx`,
                urlParams: {}
            },
            {
                urlParams: function(parsedDocument) {
                    this.url = `https://${properties.source}.view.civicacloud.com.au/Taskflow/Forms/Management/TaskMaintenance.aspx?TaskId=${properties.taskId}&ProcessMode=User`;
                    (parsedDocument && parsedDocument.getElementById('DebtorIndividualCtrl_dateOfBankruptcyTxt')) && (properties.dateOfBankruptcy = parsedDocument.getElementById('DebtorIndividualCtrl_dateOfBankruptcyTxt').textContent.trim().split("/").reverse().join("-"));
                },
                clearVIEWFormData: true
            }, {
                urlParams: function() {
                    this.url = `https://${properties.source}.view.civicacloud.com.au/Taskflow/Forms/Management/TaskMaintenance.aspx?TaskId=${properties.taskId}&ProcessMode=User`;
                    return {
                        "ctl00$mainContentPlaceHolder$editButton.x": 0,
                        "ctl00$mainContentPlaceHolder$editButton.y": 0
                    }
                }
            }
        ],
        elements: [
            { tag: "select", label: "Status:", attributes: { id: "statusChooser", style: "grid-column-start: 2; grid-column-end: 5; align-self: start; width: 80%" } },
            { tag: "option", parent: "statusChooser", attributes: { disabled: "", selected: "", value: "Select an application status" }, text: "Select an application status" },
            { tag: "option", parent: "statusChooser", text: "Processed – bankruptcy", attributes: { value: "Processed – bankruptcy" } },
            { tag: "option", parent: "statusChooser", text: "Reviewed – no provable", attributes: { value: "Reviewed – no provable" } },
            { tag: "option", parent: "statusChooser", text: "Further information required", attributes: { value: "Further information required" } },
            { tag: "option", parent: "statusChooser", text: "Processed – accepted agreement", attributes: { value: "Processed – accepted agreement" } },
            { tag: "option", parent: "statusChooser", text: "Investigation required", attributes: { value: "Investigation required" } },
            { tag: "option", parent: "statusChooser", text: "Discharged prior 2018", attributes: { value: "Discharged prior 2018" } },
            { tag: "option", parent: "statusChooser", text: "Discharged - pending write off", attributes: { value: "Discharged - pending write off" } },
            { tag: "option", parent: "statusChooser", text: "Agreement terminated – holds lifted", attributes: { value: "Agreement terminated – holds lifted" } },
            { tag: "option", parent: "statusChooser", text: "Processed – write-off", attributes: { value: "Processed – write-off" } },
            { tag: "input", label: "Date of bankruptcy:", prefill: (parsedDocument, field) => field.value = properties.dateOfBankruptcy, attributes: { id: "bankruptcyDateChooser", type: "date", style: "grid-column-start: 2; grid-column-end: 5; width: 80%; align-self: start;" } },
            {
                tag: "input",
                label: "AFSA Reference:",
                prefill: (parsedDocument, thisElement) => {
                    const selector = parsedDocument.querySelector("#ctl00_mainContentPlaceHolder_descriptionText");
                    const description = selector ? selector.textContent : "";
                    const descriptionArray = description.split(/:|,/);
                    const descriptionObject = {};
                    descriptionArray.some(function(item, index) {
                        if (index % 2 === 0 && descriptionArray.length > 1) {
                            descriptionObject[item.trim()] = descriptionArray[index + 1].trim();
                        }
                        return (index > 4);
                    });
                    descriptionObject["Date of Bankruptcy"] = descriptionObject["Date of Bankruptcy"] ? descriptionObject["Date of Bankruptcy"].substring(0, 10) : undefined;
                    const select = document.getElementById("statusChooser");
                    select.value = descriptionObject.Status || "Select an application status";
                    thisElement.value = descriptionObject["AFSA Reference"] || "";
                },
                attributes: { id: "afsaReference", type: "text", style: "grid-column-start: 2; grid-column-end: 5; width: 80%; height: 20px" }
            }
        ],
        progressButtons: [{
                text: "Skip",
                id: "SkipButton",
                name: "Skip",
                next: true,
                float: "right",
                submit: []
            },
            {
                text: "Update & Next Step",
                float: "right",
                id: "SubmitAndNextStep",
                name: "Submit & Next Step",
                submit: [{
                    next: true,
                    urlParams: function(parsedDocument) {
                        this.url = `https://${properties.source}.view.civicacloud.com.au/Taskflow/Forms/Management/TaskMaintenance.aspx?TaskId=${properties.taskId}&ProcessMode=User`;
                        const params = {
                            "ctl00$mainContentPlaceHolder$updateButton.x": 0,
                            "ctl00$mainContentPlaceHolder$updateButton.y": 0,
                            "ctl00$mainContentPlaceHolder$descriptionText": `Status: ${document.getElementById("statusChooser").value}, AFSA Reference: ${document.getElementById("afsaReference").value}, Date of Bankruptcy: ${document.getElementById("bankruptcyDateChooser").value.split("-").reverse().join("/")}`
                        }
                        return params;
                    }
                }]
            }
        ]
    }
}

export function letter(properties, getDebtorObligations) {
    return {
        name: "Letter",
        submit: [{
            url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorAddresses.aspx`,
            after: (parsedDocument) => {
                properties.agencies = [];
                properties.debtorid = parsedDocument.getElementById('DebtorDetailsCtrl_DebtorIdSearch').value
                properties.firstName = parsedDocument.getElementById('DebtorDetailsCtrl_firstnameTxt').textContent
                properties.lastName = parsedDocument.getElementById('DebtorDetailsCtrl_surnameTxt').textContent
            }
        }],
        elements: [
            { tag: "div", attributes: { id: "tablecontainer", style: "margin: auto; grid-column-start: 1; grid-column-end: 5; width: 80%; align-self: start; font-size: 8pt; margin-bottom: 20px" } },
            { tag: "table", parent: "tablecontainer", "selectCriteria": "all", dataSource: () => getDebtorObligations(properties.source), attributes: { id: "obligationtable", class: "table", style: "grid-column-start: 2; grid-column-end: 5; width: 100%; align-self: start; font-size: 8pt;" } },
            {
                tag: "select",
                label: "Address:",
                prefill: (parsedDocument, field) => {
                    properties.addressTable = parsedDocument.querySelector("#DebtorAddressesCtrl_gridDebtorAddresses_tblData > tbody");
                    const addressTableRows = Array.from(properties.addressTable.children);
                    addressTableRows.forEach((tr, i) => {
                        field.insertAdjacentHTML('beforeend', `<option ${tr.children[4].textContent.trim() === "Y" && tr.children[1].textContent.includes("Postal Address") ? "selected = 'selected'" : ""}>${tr.children[2].textContent}, ${tr.children[3].textContent}, (${tr.children[1].textContent})</option>`)
                    })
                },
                attributes: { id: "addressChooser", style: "grid-column-start: 2; grid-column-end: 5; width: 80%; align-self: start; font-size: 8pt;" }
            },
            { tag: "input", label: "Bankruptcy Notification Date:", attributes: { id: "noteDate", type: "date", style: "grid-column-start: 2; grid-column-end: 5; width: 80%; align-self: start; font-size: 8pt;" } }
        ],
        progressButtons: [{
                text: "Skip",
                id: "SkipButton",
                name: "Skip",
                next: true,
                float: "right",
                submit: []
            },
            {
                text: "Download Letter and Next Step",
                float: "right",
                class: "purpleButton",
                id: "SubmitAndNextStep",
                name: "Submit & Next Step",
                groupRepeats: {
                    "Group X": () => {
                        return [properties.allObligations.rows(0).data()[0].NoticeNumber];
                    },
                    "Group 2": () => {
                        const paramArray = [];
                        properties.allObligations.rows({ selected: true }).every(function(rowIdx, tableLoop, rowLoop) {
                            const data = this.data();
                            console.log(data);
                            const params = {};
                            if (data.InputType.includes('1A')) {
                                properties.agencies.push({ key: data.NoticeNumber, value: "TRAFFIC CAMERA OFFICE" });
                            } else if (data.InputType.includes('1C')) {
                                properties.agencies.push({ key: data.NoticeNumber, value: "VICTORIA POLICE TOLL ENFORCEMENT OFFICE" });
                            } else if (data.InputType.includes('2B')) {
                                properties.agencies.push({ key: data.NoticeNumber, value: "COURT FINE" });
                            } else {
                                params["txtNoticeNo"] = data.NoticeNumber;
                                paramArray.push(params);
                            }
                        });
                        return paramArray;
                    },
                    "Group 3": () => {
                        if (properties.courtFineData[0]['Case Ref'] === "No records found") { return [] };
                        const courtFineList = [];
                        for (let courtFine of properties.courtFineData) {
                            courtFineList.push({ NoticeNo: courtFine["Notice No"], CaseRef: courtFine["Case Ref"] })
                        }
                        return courtFineList;
                    }
                },
                submit: [{
                        //This first submit ensures that the debtor Id is not changed due to having a notice from another debtor already active in VIEW.
                        group: "Group X",
                        urlParams: function(parsedDocument, dynamicParams) {
                            this.url = `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/forms/NoticesManagement/SearchNotice.aspx?&NoticeNo=${dynamicParams}`;
                            properties.courtDetails = {};
                            return {}
                        },
                        clearVIEWFormData: true
                    },
                    {
                        group: "Group 1",
                        url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/Forms/NoticesManagement/NoticesSearch.aspx`,
                        clearVIEWFormData: true
                    }, {
                        group: "Group 2",
                        url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/Forms/NoticesManagement/NoticesSearch.aspx`,
                        urlParams: (parsedDocument, dynamicParams = {}) => {
                            const params = {
                                "btnSearch.x": 0,
                                "btnSearch.y": 0
                            }
                            for (let [key, value] of Object.entries(dynamicParams)) { params[key] = value }
                            return params
                        }
                    }, {
                        group: "Group 2",
                        url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/Forms/NoticesManagement/NoticesSearch.aspx`,
                        clearVIEWFormData: true,
                        urlParams: (parsedDocument, repeatDynamicParams, groupDynamicParams = {}) => {
                            console.log(parsedDocument.getElementById("NoticeInfo_txtNoticeNo").value);
                            properties.agencies.push({ key: parsedDocument.getElementById("NoticeInfo_txtNoticeNo").value, value: parsedDocument.getElementById("NoticeInfo_lblAgencyCode").textContent });
                            return {}
                        }
                    }, {
                        group: "Group 3",
                        clearVIEWFormData: true,
                        urlParams: function(parsedDocument, dynamicParams) {
                            this.url = `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorCourtFines.aspx?CaseRef=${dynamicParams.CaseRef}&NoticeNo=${dynamicParams.NoticeNo}&DebtorId=${properties.debtorid}`
                            return {}
                        },
                        after: (parsedDocument) => {
                            const noticeNo = parsedDocument.getElementById("CourtFineCtl_btnShowNotice").textContent
                            const CaseRef = parsedDocument.getElementById("CourtFineCtl_lblCourtRef").textContent
                            const courtLocation = parsedDocument.getElementById("CourtResultCtrl_DebtorCourtResultsTable_Row0CellDataCourtLocation").textContent
                            const hearingDate = parsedDocument.getElementById("CourtResultCtrl_DebtorCourtResultsTable_Row0CellDataHearingDate").textContent
                            properties.courtDetails[noticeNo] = { "courtLocation": courtLocation, "hearingDate": hearingDate, "CaseRef": CaseRef }
                        }
                    }
                ],
                next: true,
                afterAction: (parsedDocument, properties) => {
                    let address = document.getElementById('addressChooser').value
                    downloadLetter(address, properties);
                },
            }
        ]
    }
}


function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}