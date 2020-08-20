export function bulkWriteOff(properties) {
    return {
        name: "Bulk Notice Writeoff",
        submit: [],
        elements: [
            { tag: "textarea", label: "Paste Notice<br />Numbers:", attributes: { id: "notices", style: "grid-column-start: 2; grid-column-end: 5; width: 80%; min-height:250px" } },
            { tag: "select", label: "Writeoff reason:", attributes: { id: "writeoffselect", name: "txtWrittCode", style: "grid-column-start: 2; grid-column-end: 5; width: 80%; max-height:20px" } },
            { tag: "option", parent: "writeoffselect", text: "PPTSO:Time Served Application -  Time Served Order made", attributes: { value: "PPTSO:Time Served Application -  Time Served Order made" } },
            { tag: "option", parent: "writeoffselect", text: "PPTSOO:Time Served Application - Time Served and/or court order made", attributes: { value: "PPTSOO:Time Served Application - Time Served and/or court order made" } },
        ],
        progressButtons: [{
            src: "SubmitAndNextStep.png",
            float: "right",
            text: "Writeoff Notices",
            id: "SubmitAndNextStep",
            class: "purpleButton",
            name: "Submit & Next Step",
            next: true,
            groupRepeats: {
                "Group 1": () => {
                    let NoticeNos = document.getElementById('notices').value;
                    let noticeArray = NoticeNos.trim().split(/\s+/);
                    return noticeArray;
                }
            },
            submit: [{
                group: "Group 1",
                urlParams: function (parsedDocument, dynamicParam) {
                    this.url = `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/forms/NoticesManagement/SearchNotice.aspx?&NoticeNo=${dynamicParam}`
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
