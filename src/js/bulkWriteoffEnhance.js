/* global chrome */

const BULK_NOTE_FLOW_STATE_KEY = "toolkit.bulkNotes.flowState";
const BULK_NOTE_TEXT_KEY = "toolkit.bulkNotes.text";

initialiseBulkPopupEnhancements();

async function initialiseBulkPopupEnhancements() {
    if (!(await isBulkActionPopup())) {
        return;
    }

    if (isBulkNotesPage()) {
        if (document.querySelector("#lblPageHeader")?.textContent?.includes("Bulk")) {
            calculateOutstanding().catch((error) => {
                console.error("Failed to calculate obligation totals", error);
            });
        }

        addUpdateDebtorNoteCheckbox();
        await continueBulkNotesFlow();
        return;
    }

    if (isDebtorNotesPage()) {
        fillDebtorNotesField();
    }
}

async function isBulkActionPopup() {
    try {
        const response = await chrome.runtime.sendMessage({ type: "isBulkActionPopup" });
        return response?.isBulkActionPopup === true;
    } catch (error) {
        console.error("Unable to determine whether the tab is a bulk popup", error);
        return false;
    }
}

function isBulkNotesPage() {
    const currentUrl = new URL(window.location.href);
    const mode = currentUrl.searchParams.get("mode") || currentUrl.searchParams.get("Mode");
    return currentUrl.pathname.toLowerCase() === "/traffic/notices/forms/noticesmanagement/noticegenericbulkupdate.aspx"
        && mode?.toUpperCase() === "N";
}

function isDebtorNotesPage() {
    return new URL(window.location.href).pathname.toLowerCase() === "/traffic/debtors/forms/debtornotes.aspx";
}

function addUpdateDebtorNoteCheckbox() {
    const submitButton = document.querySelector("#btnBulkUpdate");
    if (!(submitButton instanceof HTMLElement)) {
        return;
    }

    submitButton.style.verticalAlign = "middle";

    const cancelButton = document.querySelector("#btnCancel");
    if (cancelButton instanceof HTMLElement) {
        cancelButton.style.verticalAlign = "middle";
    }

    if (!document.getElementById("updateDebtorNoteCheckbox")) {
        const label = document.createElement("label");
        label.id = "updateDebtorNoteLabel";
        label.style.display = "inline-flex";
        label.style.alignItems = "center";
        label.style.gap = "4px";
        label.style.margin = "0 6px 0 0";
        label.style.verticalAlign = "middle";
        label.style.whiteSpace = "nowrap";
        label.style.fontSize = "11px";
        label.style.lineHeight = "1";
        label.style.cursor = "pointer";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = "updateDebtorNoteCheckbox";
        checkbox.style.margin = "0";

        label.htmlFor = checkbox.id;

        const labelText = document.createElement("span");
        labelText.textContent = "Also add debtor note";

        label.append(checkbox, labelText);
        submitButton.parentNode?.insertBefore(label, submitButton);
    }

    if (submitButton.dataset.debtorNoteEnhancementBound === "true") {
        return;
    }

    submitButton.dataset.debtorNoteEnhancementBound = "true";
    submitButton.addEventListener("click", () => {
        const checkbox = document.getElementById("updateDebtorNoteCheckbox");
        const noteField = document.querySelector("#txtNotes");

        if (!(checkbox instanceof HTMLInputElement) || checkbox.checked !== true) {
            clearPendingDebtorNote();
            return;
        }

        if (!(noteField instanceof HTMLTextAreaElement)) {
            clearPendingDebtorNote();
            return;
        }

        sessionStorage.setItem(BULK_NOTE_TEXT_KEY, noteField.value);
        sessionStorage.setItem(BULK_NOTE_FLOW_STATE_KEY, "awaiting-bulk-success");
    });
}

async function continueBulkNotesFlow() {
    if (sessionStorage.getItem(BULK_NOTE_FLOW_STATE_KEY) !== "awaiting-bulk-success") {
        return;
    }

    const successMessage = document.querySelector("#lblSuccMsg")?.textContent?.trim();
    if (successMessage !== "• Bulk notes updated successfully.") {
        clearPendingDebtorNote();
        return;
    }

    sessionStorage.setItem(BULK_NOTE_FLOW_STATE_KEY, "awaiting-debtor-note-page");

    try {
        await loadDebtorNotesAddScreen();
    } catch (error) {
        console.error("Failed to open debtor notes automatically", error);
        window.alert("Bulk notes updated successfully, but Debtor Notes could not be opened automatically.");
    }
}

async function loadDebtorNotesAddScreen() {
    const debtorNotesUrl = `${window.location.origin}/Traffic/Debtors/Forms/DebtorNotes.aspx`;
    const response = await fetch(debtorNotesUrl, {
        credentials: "include"
    });

    if (!response.ok) {
        throw new Error(`Debtor Notes GET failed with status ${response.status}`);
    }

    const parsedDocument = await parsePage(response);
    const formData = await getFormData(parsedDocument);
    formData["PESNotesCtrlMain$btnAddNote.x"] = 0;
    formData["PESNotesCtrlMain$btnAddNote.y"] = 0;
    submitFormInCurrentWindow(debtorNotesUrl, formData);
}

function submitFormInCurrentWindow(url, formDataObject) {
    const form = document.createElement("form");
    form.method = "post";
    form.action = url;
    form.style.display = "none";

    Object.entries(formDataObject).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = String(value ?? "");
        form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
}

function fillDebtorNotesField() {
    if (sessionStorage.getItem(BULK_NOTE_FLOW_STATE_KEY) !== "awaiting-debtor-note-page") {
        return;
    }

    const noteText = sessionStorage.getItem(BULK_NOTE_TEXT_KEY);
    const noteField = document.querySelector("#PESNotesCtrlMain_txtNotes");

    if (typeof noteText !== "string" || !(noteField instanceof HTMLTextAreaElement)) {
        return;
    }

    noteField.value = noteText;
    noteField.dispatchEvent(new Event("input", { bubbles: true }));
    noteField.dispatchEvent(new Event("change", { bubbles: true }));
    clearPendingDebtorNote();
}

function clearPendingDebtorNote() {
    sessionStorage.removeItem(BULK_NOTE_FLOW_STATE_KEY);
    sessionStorage.removeItem(BULK_NOTE_TEXT_KEY);
}

async function calculateOutstanding() {
    const headerSpace = document.querySelector("#pnlResultGrid > table > tbody > tr:nth-child(1) > td > table > tbody > tr:nth-child(1) > td")
    const noticeCheckField = document.querySelector("#txtNoticeCheck");

    if (!(headerSpace instanceof HTMLElement) || !(noticeCheckField instanceof HTMLInputElement)) {
        return;
    }

    const obligationArray = noticeCheckField.value.split(",")
    const debtorPageObligations = await getDebtorObligations(window.location.host.split(".")[0])
    let totalObligationBalance = 0;
    debtorPageObligations.forEach(row => {
        if (obligationArray.includes(row['Notice Number'])) {
            totalObligationBalance += parseFloat(row['Balance Outstanding'].replace("$", "").replace(",", ""));
        }
    })
    const htmlFragment = `
    <span style="padding: 10;vertical-align: sub;font-weight: bold;">
        Value of Obligations: $${totalObligationBalance.toFixed(2)}
    </span>`
    headerSpace.insertAdjacentHTML('beforeend', htmlFragment);
}

async function getDebtorObligations(source) {
    //Get stateless page
    let vDocument = await fetch(`https://${source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorObligationsSummary.aspx`);
    let parsedDocument = await parsePage(vDocument)
    let formData = await getFormData(parsedDocument)

    let formDataN = new FormData();
    for (var key in formData) {
        formDataN.append(key, formData[key]);
    }

    //Get page with all obligations if more than 50
    let rowCount = parsedDocument.querySelector("#DebtorNoticesCtrl_DebtorNoticesTable_PageChooserCell > span").textContent.trim().split(" ");
    if (Number(rowCount[rowCount.length - 1]) > 50) {
        formDataN.set("DebtorNoticesCtrl$DebtorNoticesTable$ddRecordsPerPage", 0)
        vDocument = await fetch(`https://${source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorObligationsSummary.aspx`, {
            method: "POST",
            body: formDataN
        })
        parsedDocument = await parsePage(vDocument)
    }

    return (parseTable(parsedDocument.getElementById("DebtorNoticesCtrl_DebtorNoticesTable_tblData")))
}

async function parsePage(vDocument) {
    let htmlText = await vDocument.text();
    const parser = new DOMParser();
    const parsedDocument = parser.parseFromString(htmlText, "text/html");
    return parsedDocument;
}

async function getFormData(parsedDocument) {
    const formElement = parsedDocument.querySelector("form");
    let formData = new FormData(formElement);
    var formDataObject = {};
    formData.forEach((value, key) => { formDataObject[key] = value });
    return formDataObject;
}

/**
 * @license
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Nick Williams
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * generates factory functions to convert table rows to objects,
 * based on the titles in the table's <thead>
 * @param  {Array<String>} headings the values of the table's <thead>
 * @return {(row: HTMLTableRowElement) => Object} a function that takes a table row and spits out an object
 */
function mapRow(headings) {
    return function mapRowToObject({ cells }) {
        return [...cells].reduce(function(result, cell, i) {
            const input = cell.querySelector("input,select");
            var value;

            if (input) {
                value = input.type === "checkbox" ? input.checked : input.value;
            } else {
                value = cell.innerText;
            }

            return Object.assign(result, {
                [headings[i]]: value
            });
        }, {});
    };
}

/**
 * given a table, generate an array of objects.
 * each object corresponds to a row in the table.
 * each object's key/value pairs correspond to a column's heading and the row's value for that column
 *
 * @param  {HTMLTableElement} table the table to convert
 * @return {Array<Object>}       array of objects representing each row in the table
 */
function parseTable(table) {
    var headings = [...table.tHead.rows[0].cells].map(
        heading => heading.innerText
    );

    return [...table.tBodies[0].rows].map(mapRow(headings));
}