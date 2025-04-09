// @ts-nocheck

export function bulkRequestEnforcementWarrant(properties) {
    return {
        name: "Request Enforcement Warrant",
        submit: [],
        elements: [
            { tag: "textarea", label: "Paste Debtor<br />Numbers:", attributes: { id: "debtorIDs", style: "grid-column-start: 2; grid-column-end: 5; width: 80%; min-height:250px" } },
        ],
        progressButtons: [{
            src: "SubmitAndNextStep.png",
            float: "right",
            text: "Go to Warrants",
            id: "SubmitAndNextStep",
            class: "purpleButton",
            name: "Submit & Next Step",
            groupRepeats: {
                "Group 1": () => {
                    const debtorIDs = document.getElementById('debtorIDs').value;
                    const debtorIDArray = debtorIDs.trim().split(/\s+/);
                    return debtorIDArray;
                }
            },
            submit: [{
                group: "Group 1",
                iFrame: true,
                urlParams: function (parsedDocument, dynamicParam) {
                    this.url = `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorRequestEnforcementWarrant.aspx`
                }
            }, {
                group: "Group 1",
                clearVIEWFormData: true,
                sameorigin: true,
                method: 'POST',
                body: false,
                urlParams: function (parsedDocument, dynamicParam) {
                    this.url = `https://${properties.source}.view.civicacloud.com.au/Traffic/SoftLockActions.aspx?mode=LS&Type=Lock&Item=${dynamicParam}&Function=NOTICES`
                }
            }, {
                group: "Group 1",
                method: 'GET',
                body: false,
                clearVIEWFormData: true,
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/Forms/NoticesManagement/NoticeActions.aspx?mode=W`,
            }, {
                group: "Group 1",
                url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/Forms/NoticesManagement/NoticeActions.aspx?mode=W`,
                urlParams: {
                    "btnActionUpdate.x": 0,
                    "btnActionUpdate.y": 0
                }
            }]
        }]
    }
}
