export function debtorBulkNotes(properties) {
    return {
        name: "Debtor Notes",
        submit: [],
        elements: [
            { tag: "textarea", label: "Paste Debtor<br />Numbers:", attributes: { id: "debtorIDs", style: "grid-column-start: 2; grid-column-end: 5; width: 80%; min-height:80px" } },
            { tag: "textarea", label: "Note:", attributes: { id: "debtorNote", name: "PESNotesCtrlMain$txtNotes", style: "grid-column-start: 2; grid-column-end: 5; width: 80%; min-height:150px"} },
        ],
        progressButtons: [{
            src: "SubmitAndNextStep.png",
            float: "right",
            text: "Submit Note",
            id: "SubmitAndNextStep",
            class: "purpleButton",
            name: "Submit & Next Step",
            groupRepeats: {
                "Group 1": () => {
                    let debtorIDs = document.getElementById('debtorIDs').value;
                    let debtorIDArray = debtorIDs.trim().split(/\s+/);
                    return debtorIDArray;
                }
            },
            submit: [{
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorNotes.aspx`
            }, {
                clearWizardFormData: true,
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorNotes.aspx`,
                urlParams: {
                    "PESNotesCtrlMain$btnAddNote.x": 0,
                    "PESNotesCtrlMain$btnAddNote.y": 0
                }
            }, {
                clearVIEWFormData: true,
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorDetails.aspx`
            }, {
                formDataTarget: 3,
                group: "Group 1",
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorDetails.aspx`,
                urlParams: (parsedDocument, dynamicParam) => {
                    console.log(dynamicParam);
                    let params = {
                        "DebtorDetailsCtrl$debtorIdTextBoxButton": "Go"
                    }
                    params.DebtorDetailsCtrl$DebtorIdSearch = dynamicParam;
                    return params;
                }
            }, {
                formDataTarget: 2,
                group: "Group 1",
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorNotes.aspx`,
                urlParams: {
                    "PESNotesCtrlMain$btnUpdate.x": 0,
                    "PESNotesCtrlMain$btnUpdate.y": 0,
                }
            }],
            afterAction: () => {
                const container = document.getElementById('container');
                container.innerHTML = "";
                const button = document.createElement('img');
                button.src = chrome.runtime.getURL("Images/button_close-window.png");
                button.id = "messagebox"
                container.append(button);
                shade.style.display = "none"
                button.addEventListener('mouseup', function () {
                    window.close()
                })
            }
        }]
    }
}