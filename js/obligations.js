/////Config Objects and Variables/////////////////////////////////////////////////////////////////////////////
let optionChain = []

/////Script Launcher///////////////////////////////////////////////////////////////////////////////

addCheckboxes();
addElements();


/////Input creation functions/////////////////////////////////////////////////////////////////////////////////

function generateButton(button, dropDown, options) {
	//Adds buttons for data extraction.

	button.element = document.createElement('span');
	button.element.innerText = button.text;
	setAttributes(button.element, button.attributes)
	setAttributes(button.element, {
		onclick: "return false",
		class: "mybutton"
	});

	button.element.setAttribute('id', button.name);

	document.getElementById("NoticesDataGrid").appendChild(button.element);
	if (button.name !== "letterButton") {
		button.element.addEventListener('click', function () { exportData(button.description) });
	} else {
		document.getElementById("NoticesDataGrid").appendChild(dropDown);
		button.element.addEventListener('click', function () {
			const option = options.find((option) => {
				return option.description === dropDown.value
			})
			exportData(option.description, option.agency, option.letters, option.extended, option.SharePoint) 
		});
	}
	return button;
}

function generateOption(option, dropDown) {
	//Adds options to the drop down.
	option.element = document.createElement("option")
	option.element.text = option.description
	dropDown.add(option.element);
	return option;
}

function addElements() {

	var dropDown = document.createElement("select");;
	dropDown.style.width = "180px";
	dropDown.style.marginLeft = "6px";
	//Button properties
	var buttons = [
		{ name: "tableButton", description: "Export obligations", text: "xlxs", attributes: { "style": "margin-left: 6px; cursor: hand" } },
		//	{ name: "tableSettings", description: "Table settings" },
		{ name: "letterButton", description: "Generate letter(s)", text: "Generate letter(s)", attributes: { "style": "margin-left: 37px; cursor: hand" } },
		{ name: "holdButton", description: "Bulk Notes Update", text: "Bulk Notes", attributes: { "style": "margin-left: 44px; cursor: hand" } },
		{ name: "holdButton", description: "Bulk Hold Update", text: "Bulk Hold", attributes: { "style": "margin-left: 3px; cursor: hand" } },
		{ name: "WriteoffButton", description: "Bulk Writeoff Update", text: "Bulk Writeoff", attributes: { "style": "margin-left: 3px; cursor: hand" } }//,
		//{ name: "DeregistrationButton", description: "Bulk Deregistration Update", text: "Bulk Deregistration", attributes: { "style": "margin-left: 3px; cursor: hand" } }//,
		//,
		//	{name: "FeeButton", description: "Bulk Fee Waive"}
	];
	

	var options = [
		{ description: "Enforcement Confirmed", letters: ["Enforcement Confirmed"]},
		{ description: "Enforcement Cancelled", agency: true, letters: ["Enforcement Cancelled", "Agency Enforcement Cancelled"]},
		{ description: "ER Confirm/ FW Grant", agency: true, letters: ["ER Confirm/ FW Grant", "Agency FR Granted"] },
		{ description: "Report Needed", letters: ["Report Needed"] },
		{ description: "Unable to Contact Applicant", letters: ["Unable to Contact Applicant"] },
		{ description: "Notice of Deregistration", agency: true, letters: ["Notice of Deregistration"] },
		{ description: "FVS Eligible", agency: true, letters: ["FVS Eligible Debtor", "FVS Eligible Agency"] },
		{ description: "FVS Ineligible", letters: ["FVS Ineligible"] },
		{ description: "FVS Further Information Required", letters: ["FVS Further Information Required"] },
		{ description: "PSL", extended: true, letters: ["PSL"] },
		{ description: "Suspension of driver licence", extended: true, letters: ["Suspension of driver licence"] },
		{ description: "Suspension of driver registration - Ind", extended: true, letters: ["Suspension of vehicle registration - Ind"] },
		{ description: "Suspension of driver registration - Corp", extended: true, letters: ["Suspension of vehicle registration - Corp"] },
		{ description: "POI - direction to produce", extended: true, letters: ["POI - direction to produce"] },
		{ description: "PA Refused - Active 7DN", extended: true, letters: ["PA Refused - Active 7DN"] },
		{ description: "No Grounds", letters: ["No Grounds"] },
		{ description: "PA Refused", letters: ["PA Refused"] },
		{ description: "EOT Refused", letters: ["EOT Refused"] },
		{ description: "PA Refused-Sanction", letters: ["PA Refused-Sanction"] },
		{ description: "PA App Incomplete", letters: ["PA App Incomplete"] },
		{ description: "Company PA Ineligible SZWIP", letters: ["Company PA Ineligible SZWIP"] },
		{ description: "EOT Refused - Infringements stage", letters: ["EOT Refused - Infringements stage"] },
		{ description: "PA Refused Expired 7DN", letters: ["PA Refused Expired 7DN"] },
		{ description: "Fee Removal PIF", letters: ["Fee Removal PIF"] },
		{ description: "CF Fee Removal Granted", letters: ["CF Fee Removal Granted"] },
		{ description: "CF Fee Removal Refused", letters: ["CF Fee Removal Refused"] },
		{ description: "Fee Removal Refused", letters: ["Fee Removal Refused"] },
		{ description: "FR Refused - Active 7DN", letters: ["FR Refused - Active 7DN"] },
		{ description: "FW Refused - Sanction", letters: ["FW Refused - Sanction"] },
		{ description: "FR Granted", agency: true, letters: ["FR Granted", "Agency FR Granted"] },
		{ description: "FR Granted - Active 7DN", agency: true, letters: ["FR Granted - Active 7DN", "Agency FR Granted"] },
		{ description: "FR Granted - Sanction", agency: true, letters: ["FR Granted - Sanction", "Agency FR Granted"] },
		{ description: "Ineligible for ER - offence type", letters: ["Ineligible for ER - offence type"] },
		{ description: "Court not an option", letters: ["Court not an option"] },
		{ description: "ER Ineligible Deregistered Company", letters: ["ER Ineligible Deregistered Company"] },
		{ description: "Ineligible Paid in full", letters: ["Ineligible Paid in full"] },
		{ description: "Appeal not available", letters: ["Appeal not available"] },
		{ description: "Nomination Not Grounds", letters: ["Nomination Not Grounds"] },
		{ description: "ER Ineligible Court Fine", letters: ["ER Ineligible Court Fine"] },
		{ description: "Spec Circ Options", letters: ["Spec Circ Options"] },
		{ description: "ER Additional Info", letters: ["ER Additional Info"] },
		{ description: "Ineligible for ER enforcement action", letters: ["Ineligible for ER enforcement action"] },
		{ description: "Ineligible PU - Outside Time", letters: ["Ineligible PU - Outside Time"] },
		{ description: "Ineligible for ER previous review", letters: ["Ineligible for ER previous review"] },
		{ description: "ER Ineligible PU", letters: ["ER Ineligible PU"] },
		{ description: "Claim of payment to agency", letters: ["Claim of payment to agency"] },
		{ description: "Request for photo evidence", letters: ["Request for photo evidence"] },
		{ description: "Ineligible Incorrect company applying", letters: ["Ineligible Incorrect company applying"] },
		{ description: "Spec Circ No Grounds", letters: ["Spec Circ No Grounds"] },
		{ description: "Spec Circ Report Required", letters: ["Spec Circ Report Required"] },
		{ description: "Unauthorised 3rd party applying", letters: ["Unauthorised 3rd party applying"] },
		{ description: "Ineligible Incorrect person applying", letters: ["Ineligible Incorrect person applying"] },
		{ description: "Spec Circ App Required", letters: ["Spec Circ App Required"] },
		{ description: "Spec Circ Report Insufficient", letters: ["Spec Circ Report Insufficient"] },
		{ description: "SC 3P Lawyer - Report Insufficient", letters: ["SC 3P Lawyer - Report Insufficient"] },
		{ description: "ER Application Incomplete", letters: ["ER Application Incomplete"] },
		{ description: "SC 3P Lawyer - Report Required", letters: ["SC 3P Lawyer - Report Required"] },
		{ description: "ER Confirm/FW Grant - Active 7DN", letters: ["ER Confirm/FW Grant - Active 7DN"] },
		{ description: "ER Confirm/FW Grant - 7DN Expired option", letters: ["ER Confirm/FW Grant - 7DN Expired option"] }



	];

	buttons.map(button => generateButton(button, dropDown, options));
	options.map(option => generateOption(option, dropDown));

	let auditCheck = document.createElement('input')
	auditCheck.setAttribute('type', 'checkbox');
	auditCheck.setAttribute('id', 'auditCheck');
	var auditCheckLabel = document.createElement('label');
	auditCheckLabel.appendChild(document.createTextNode('Parse Audit Trail?'));
	auditCheckLabel.appendChild(auditCheck);
	//document.getElementById("NoticesDataGrid").appendChild(auditCheckLabel);


	let email = document.createElement('input')
	email.setAttribute('type', 'radio');
	email.setAttribute('id', 'email');
	email.setAttribute('name', 'method');
	var emailCheckLabel = document.createElement('label');
	emailCheckLabel.appendChild(email);
	emailCheckLabel.className = 'label';
	emailCheckLabel.appendChild(document.createTextNode('Email'));
	dropDown.after(emailCheckLabel);

	let letter = document.createElement('input')
	letter.setAttribute('type', 'radio');
	letter.setAttribute('id', 'letter');
	letter.setAttribute('name', 'method');
	letter.setAttribute('checked', 'checked');
	var letterCheckLabel = document.createElement('label');
	letterCheckLabel.className = 'label';
	letterCheckLabel.appendChild(letter);
	letterCheckLabel.appendChild(document.createTextNode('Letter'));
	dropDown.after(letterCheckLabel);

	document.querySelectorAll('.label').forEach(element => {
		element.addEventListener('mouseup', function() {updateButton(element)})
	})

	function updateButton(element) {
		if (element.innerHTML.includes('Email')) {
			document.getElementById('letterButton').innerText = 'Generate email'
		} else if (element.innerHTML.includes('Letter')) {
			document.getElementById('letterButton').innerText = 'Generate letter(s)'
		}
	}


	let ObSelector = '\
	<tr> \
        <td style="padding: 6px; padding-bottom:0px"> \
			<input type="image" name="DebtorDecisionCtrl$selectAllButton" id="DebtorDecisionCtrl_selectAllButton" tabindex="42" src="' + chrome.runtime.getURL('Images/selectApplicable.png') + '" onclick="selectApplicable(); return false" > \
			<input style="float:left" type="image" name="DebtorDecisionCtrl$selectAllButton" id="DebtorDecisionCtrl_selectAllButton" tabindex="42" src="' + chrome.runtime.getURL('Images/selectenfreview.png') + '" onclick="selectEnforcementReview(); return false" > \
			<input style="float:left" type="image" name="DebtorDecisionCtrl$selectAllButton" id="DebtorDecisionCtrl_selectAllButton" tabindex="42" src="' + chrome.runtime.getURL('Images/selectFVSPEND.png') + '" onclick="selectFVSHolds(); return false" > \
			<input style="float:left" type="image" name="DebtorDecisionCtrl$selectAllButton" id="DebtorDecisionCtrl_selectAllButton" tabindex="42" src="' + chrome.runtime.getURL('Images/selectFVSPEND.png') + '" onclick="selectPAHolds(); return false" > \
		</td> \
    </tr>'


	document.querySelector("#NoticesDataGrid > tbody").insertAdjacentHTML('afterbegin', ObSelector);




}

function addCheckboxes() {
	//Adds checkboxes next to each obligation
	let table = document.getElementById("DebtorNoticesCtrl_DebtorNoticesTable_tblData");
	for (let i = 0, row; row = table.rows[i]; i++) {
		let x = row.insertCell(0);
		let checkbox = document.createElement('input');
		checkbox.setAttribute('type', 'checkbox');
		if (i !== 0)
			checkbox.setAttribute('name', 'boxes');
		x.appendChild(checkbox);
		if (i === 0)
			checkbox.setAttribute('onClick', 'toggle(this)');
	}
}



function captureObligationNumbers() {
	//Reference the Table.
	let grid = document.getElementById("DebtorNoticesCtrl_DebtorNoticesTable_tblData");

	//Reference the CheckBoxes in Table.
	let checkBoxes = grid.getElementsByTagName("input");
	obligationChain = [];
	//Loop through the CheckBoxes.
	for (let i = 1; i < checkBoxes.length; i++) {
		if (checkBoxes[i].checked) {
			let obligationNumber = checkBoxes[i].parentNode.parentNode.children[1].innerHTML;
			obligationChain.push(obligationNumber);
		}
	}

	return obligationChain;
}

function exportData(value, agency = false, letters = [], extended = false, SharePoint = false) {
	let obligationArray = captureObligationNumbers()
	//	let PAT = document.getElementById('auditCheck').checked;
	PAT = false
	//email = false
	let email = document.getElementById('email').checked;
	if (obligationArray.length > 0) {
		const rows = parseTable(document.querySelector("#DebtorNoticesCtrl_DebtorNoticesTable_tblData"));
		const filteredRows = rows.filter((row) => {return Object.values(row)[0] === true})
		console.log(filteredRows)
		let data = [obligationArray, value, null, PAT, email, window.location.host.split(".")[0], filteredRows, agency, letters, extended, SharePoint]
		saveIT()

		chrome.runtime.sendMessage(data, function (response) {
			//	console.log(response.farewell);
		});
	} else {
		alert('You need to select at least one obligation');
	}
}

var s = document.createElement('script');
s.src = chrome.runtime.getURL('js/helper.js');
var p = document.createElement('script');
p.src = chrome.runtime.getURL('js/External/jquery-3.4.1.js');

//document.body.insertAdjacentHTML('beforeend', s);


(document.head || document.documentElement).appendChild(s);
(document.head || document.documentElement).appendChild(p);

function setAttributes(el, attrs) {
	for (var key in attrs) {
		el.setAttribute(key, attrs[key]);
	}
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
			} else if (headings[i] === "Offence") {
				value = cell.title
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
        heading => heading.innerText.replace(" ▲ 1", "").replace(" ▼ 1", "").replace(" ▼ 2", "").replace(" ▲ 2", "")
	);

    return [...table.tBodies[0].rows].map(mapRow(headings));
}

















