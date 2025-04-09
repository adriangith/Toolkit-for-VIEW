if (document.getElementById('DebtorExecuteActionCtrl_lblEligibleFor') && document.getElementById('DebtorExecuteActionCtrl_lblEligibleFor').textContent === "Eligible Warrants to execute Procedural Action :") {
    enhanceTable();
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

async function enhanceTable() {
    const WarrantGrid = document.getElementById("WarrantGrid");
    const headerRow = WarrantGrid.firstElementChild.firstElementChild;
    const thead = document.createElement('thead');
    const tbody = WarrantGrid.querySelector("tbody");
    const tbodyChildren = tbody.children;
    WarrantGrid.insertAdjacentElement('afterbegin', thead);
    thead.append(headerRow);
    const debtorPageObligations = await getDebtorObligations(window.location.host.split(".")[0])
    const VRMObject = {}
    
    debtorPageObligations.forEach(row => {
        const nn = row['Notice Number'];
        VRMObject[nn] = row.VRM;
    })
    const th =  document.createElement('th')
    th.textContent = "VRM"
    headerRow.insertAdjacentElement('beforeend', th);
    Array.from(tbodyChildren).forEach((trx, i) => {
        const obligationNumber = trx.children[2].textContent.trim();
        const td = document.createElement('td');
        trx.append(td);
        td.className = "grid-lines";
        td.textContent = VRMObject[obligationNumber];
    });

    let dataTable = $(WarrantGrid).DataTable(
        {
            "paging": false,
            "bFilter": false
        }
    );

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
        return [...cells].reduce(function (result, cell, i) {
            const input = cell.querySelector("input,select");
            var value;

            if (input) {
                value = input.type === "checkbox" ? input.checked : input.value;
            } else {
                value = cell.innerText;
            }

            return Object.assign(result, { [headings[i]]: value });
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

