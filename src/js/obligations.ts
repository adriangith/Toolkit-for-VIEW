import * as helpers from "./helper"
import { VIEWObligationRow } from "./letter-logic";
import { VIEWsubmitParams } from "./VIEWsubmit";
import { initialiseWorkbookProcesser, OptionsResult } from './xlsxConverter'; // Adjust import path as needed



export type Message<T extends backgroundData | VIEWsubmitParams | ChromeStorage | fetchParams> = {
	type: "VIEWsubmit" | "GenerateCorrespondence" | "getStorage" | "setStorage" | "fetch";
	data: T
}

export type fetchParams = Parameters<typeof fetch>

export type ChromeStorage = {
	key: string;
	value?: string | number;
}


export type backgroundData = {
	obligationArray: string[];
	selectedCorrespondenceAttributes: OptionsResult;
	IsEmail: boolean;
	VIEWEnvironment: string;
	IncludesAgencyCorrespondence: boolean;
	RequiresExtendedAttributes: boolean;
	SharePoint: boolean;
	letters: string[];
	VIEWObligationData: VIEWObligationRow[];
}


type DropDownType = {
	description: string;
	letters: string[];
	element?: HTMLOptionElement;
};

export const VIEWObligationListHeadings = [
	"",
	"Notice Number",
	"Input Type",
	"Balance Outstanding",
	"Infringement No.",
	"Offence",
	"Offence Date",
	"Issued",
	"Notice Status/Previous Status",
	"Due Date",
	"Hold Code-End Date",
	"EOT Count",
	"Current Challenge Logged?",
	"VRM",
	"Enforcement Action Id(s)"
] as const satisfies string[];

export type VIEWObligationRowData = {
	Obligation: string,
	Balance_Outstanding: string,
	Infringement: string,
	Offence: string,
	OffenceDate: string
	IssueDate: string,
	altname: string,
	NoticeStatus: string,
	ProgressionDate: string
}

/////Script Launcher///////////////////////////////////////////////////////////////////////////////

const addCheckboxes = () => {
	const tableRows = document.querySelectorAll('#DebtorNoticesCtrl_DebtorNoticesTable_tblData tr');
	if (!tableRows) {
		throw new Error("tableRows is null");
	}
	[...tableRows].forEach((row, i) => {
		const input = document.createElement("input")
		input.setAttribute('type', 'checkbox')
		const cell = document.createElement(i ? "td" : "th")
		if (i) input.setAttribute('name', 'boxes');
		else input.addEventListener('click', function () { helpers.toggle(input) })
		cell.appendChild(input)
		row.insertBefore(cell, row.firstChild)
	});
}



/////Input creation functions/////////////////////////////////////////////////////////////////////////////////
const workbook = initialiseWorkbookProcesser(
	"https://vicgov.sharepoint.com/:x:/s/VG002447/ERw7UOkUPWZLpAiwgjuPgmcBjEx8dklCu-9D9_bknPVOUQ?download=1"
);

addCheckboxes();
addElements();

function generateButton(
	buttonProps: {
		name: string;
		description: string
		text: string;
		attributes: {
			style: string;
		};
	},
	dropDown: HTMLSelectElement,
	dropDownOpt: OptionsResult[]) {
	//Adds buttons for data extraction.

	const button = document.createElement('span');
	button.innerText = buttonProps.description;
	setAttributes(button, buttonProps.attributes)
	setAttributes(button, {
		onclick: "return false",
		class: "mybutton"
	});

	button.setAttribute('id', buttonProps.name);

	const NoticesDataGrid = document.getElementById("NoticesDataGrid");
	if (NoticesDataGrid === null) {
		throw new Error("NoticesDataGrid element not found");
	}

	NoticesDataGrid.appendChild(button);
	if (buttonProps.name !== "letterButton") {
		button.addEventListener('click', function () {
			exportData(buttonProps.description)
		});
	} else {
		NoticesDataGrid.appendChild(dropDown);
		button.addEventListener('click', async function () {
			const option = (dropDownOpt).find((dropDownOption) => {
				return dropDownOption.description === dropDown.value
			})
			if (option === undefined) {
				throw new Error("option is undefined");
			}
			exportData(option)
		});
	}
	return button;
}

function generateOption(optionProps: DropDownType, dropDown: HTMLSelectElement) {
	//Adds options to the drop down.
	const option = document.createElement("option")
	option.text = optionProps.description
	dropDown.add(option);
	return option;
}

async function addElements() {

	const dropDown = document.createElement("select");;
	dropDown.style.width = "180px";
	dropDown.style.marginLeft = "6px";
	//Button properties
	const buttons = [
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





	const dropDownOptions = await (await workbook).fetchAndProcessOptions("Options")
	const TemplateMeta = await (await workbook).fetchAndConvertXlsxToJson({ Sheet: "Templates", Column: "Recipient" })
	dropDownOptions.map((option: OptionsResult) => {
		const template = option.letters.some((letter: string) => TemplateMeta[letter] && TemplateMeta[letter] === "Agency")
		option.recipient = template
	});
	buttons.map(button => generateButton(button, dropDown, dropDownOptions));
	(await dropDownOptions).map(option => generateOption(option, dropDown));

	const auditCheck = document.createElement('input')
	auditCheck.setAttribute('type', 'checkbox');
	auditCheck.setAttribute('id', 'auditCheck');
	const auditCheckLabel = document.createElement('label');
	auditCheckLabel.appendChild(document.createTextNode('Parse Audit Trail?'));
	auditCheckLabel.appendChild(auditCheck);
	//document.getElementById("NoticesDataGrid").appendChild(auditCheckLabel);


	const email = document.createElement('input')
	email.setAttribute('type', 'radio');
	email.setAttribute('id', 'email');
	email.setAttribute('name', 'method');
	const emailCheckLabel = document.createElement('label');
	emailCheckLabel.appendChild(email);
	emailCheckLabel.className = 'label';
	emailCheckLabel.appendChild(document.createTextNode('Email'));
	dropDown.after(emailCheckLabel);

	const letter = document.createElement('input')
	letter.setAttribute('type', 'radio');
	letter.setAttribute('id', 'letter');
	letter.setAttribute('name', 'method');
	letter.setAttribute('checked', 'checked');
	const letterCheckLabel = document.createElement('label');
	letterCheckLabel.className = 'label';
	letterCheckLabel.appendChild(letter);
	letterCheckLabel.appendChild(document.createTextNode('Letter'));
	dropDown.after(letterCheckLabel);

	document.querySelectorAll('.label').forEach(element => {
		element.addEventListener('mouseup', function () { updateButton(element) })
	})

	function updateButton(element: Element) {
		const letterButton = document.getElementById('letterButton')
		if (letterButton === null) {
			throw new Error("letterButton element not found");
		}
		if (element.innerHTML.includes('Email')) {
			letterButton.innerText = 'Generate email'
		} else if (element.innerHTML.includes('Letter')) {
			letterButton.innerText = 'Generate letter(s)'
		}
	}


	const ObSelector = '\
	<tr> \
        <td style="padding: 6px; padding-bottom:0px"> \
			<input type="image" name="DebtorDecisionCtrl$selectAllButton" id="DebtorDecisionCtrl_selectAllButton" tabindex="42" src="' + chrome.runtime.getURL('Images/selectApplicable.png') + '" onclick="selectApplicable(); return false" > \
			<input style="float:left" type="image" name="DebtorDecisionCtrl$selectAllButton" id="DebtorDecisionCtrl_selectAllButton" tabindex="42" src="' + chrome.runtime.getURL('Images/selectenfreview.png') + '" onclick="selectEnforcementReview(); return false" > \
			<input style="float:left" type="image" name="DebtorDecisionCtrl$selectAllButton" id="DebtorDecisionCtrl_selectAllButton" tabindex="42" src="' + chrome.runtime.getURL('Images/selectFVSPEND.png') + '" onclick="selectFVSHolds(); return false" > \
			<input style="float:left" type="image" name="DebtorDecisionCtrl$selectAllButton" id="DebtorDecisionCtrl_selectAllButton" tabindex="42" src="' + chrome.runtime.getURL('Images/selectFVSPEND.png') + '" onclick="selectPAHolds(); return false" > \
		</td> \
    </tr>'

	const NoticesDataGrid = document.getElementById("NoticesDataGrid");
	if (NoticesDataGrid === null) {
		throw new Error("NoticesDataGrid element not found");
	}

	NoticesDataGrid.insertAdjacentHTML('afterbegin', ObSelector);

}



function captureObligationNumbers() {
	//Reference the Table.
	const grid = document.getElementById("DebtorNoticesCtrl_DebtorNoticesTable_tblData");
	if (grid === null) {
		throw new Error("DebtorNoticesCtrl_DebtorNoticesTable_tblData element not found");
	}

	//Reference the CheckBoxes in Table.
	const checkBoxes = grid.getElementsByTagName("input");
	const obligationChain = [];
	//Loop through the CheckBoxes.
	for (let i = 1; i < checkBoxes.length; i++) {
		const checkBox = checkBoxes[i];
		const obligationCell = checkBox?.parentNode?.parentNode?.children[1];
		if (obligationCell === undefined) {
			throw new Error("obligationCell is undefined");
		}
		if (checkBox.checked) {
			const obligationNumber = obligationCell.innerHTML;
			obligationChain.push(obligationNumber);
		}
	}
	return obligationChain;
}

function exportData(value: OptionsResult | string, extended = false, SharePoint = false) {
	const obligationArray = captureObligationNumbers()

	const emailElement = document.getElementById('email');
	if (!(emailElement instanceof HTMLInputElement)) {
		throw new Error("emailElement is not an HTMLInputElement");
	}
	const email = emailElement?.checked;
	if (obligationArray.length > 0) {
		const debtorNoticesTable = document.querySelector("#DebtorNoticesCtrl_DebtorNoticesTable_tblData");
		if (!(debtorNoticesTable instanceof HTMLTableElement)) {
			throw new Error("debtorNoticesTable is not an HTMLTableElement");
		}

		const rows = parseTable<Record<typeof VIEWObligationListHeadings[number], string>, typeof VIEWObligationListHeadings[number]>(debtorNoticesTable, VIEWObligationListHeadings);
		const filteredRows = rows.filter((row) => { return Object.values(row)[0] });
		if (typeof value === "string") {
			throw new Error("value is a string");
		}
		if (value.recipient === undefined) {
			throw new Error("value.recipient is undefined");
		}
		const message: Message<backgroundData> = {
			type: 'GenerateCorrespondence',
			data: {
				obligationArray,
				selectedCorrespondenceAttributes: value,
				IsEmail: email,
				VIEWEnvironment: window.location.host.split(".")[0],
				IncludesAgencyCorrespondence: value.recipient,
				RequiresExtendedAttributes: extended,
				SharePoint,
				letters: value instanceof Object ? value?.letters : [],
				VIEWObligationData: filteredRows
			}
		};

		(async () => {
			const response = await chrome.runtime.sendMessage(message);
			const responseParsed = JSON.parse(response.message)
			if (response.message) {
				const error: Error = new Error(responseParsed.message);
				error.stack = responseParsed.stack;
				throw error;
			}
			console.log("Response from background script:", responseParsed);
		})();
	} else {
		alert('You need to select at least one obligation');
	}
}

function setAttributes(el: HTMLSpanElement, attrs: Record<string, string>) {
	for (const key in attrs) {
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
function mapRow<K extends string, T extends Record<K, string | boolean>>(headings: K[]) {
	return function mapRowToObject({ cells }: HTMLTableRowElement) {
		return [...cells].reduce<T>(function (result, cell, i) {
			const input = cell.querySelector("input,select");

			let value;

			if (input) {
				if (!(input instanceof HTMLInputElement)) {
					throw new Error("input is not an HTMLInputElement");
				}
				value = input.type === "checkbox" ? input.checked : input.value;
			} else if (headings[i] === "Offence") {
				value = cell.title
			} else {
				value = cell.innerText;
			}

			// need to confirm that headings[i] is a valid key
			if (typeof headings[i] !== "string") {
				throw new Error(`Invalid heading: "${headings[i]}"`);
			}

			return Object.assign(result, { [headings[i]]: value });
		}, {} as T);
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
function parseTable<T extends Record<K, string | boolean>, K extends string>(table: HTMLTableElement, validHeadings: K[]): Array<T> {
	const tableCells = table?.tHead?.rows[0].cells
	if (tableCells === undefined) {
		throw new Error("tableCells is undefined");
	}

	const headings: K[] = [...tableCells].map(
		cell => {
			const cleanedHeading = cell.innerText
				.replace(" ▲ 1", "")
				.replace(" ▼ 1", "")
				.replace(" ▼ 2", "")
				.replace(" ▲ 2", "") as unknown as K;

			if (!validHeadings.includes(cleanedHeading)) {
				throw new Error(`Invalid table heading: "${cleanedHeading}"`);
			}

			return cleanedHeading;
		}
	);

	const tableRows = [...table.tBodies[0].rows];
	const tableRowObjects = tableRows.map(mapRow<K, T>(headings));
	// Need to check if objects in tableRowObjects matches an array of VIEWObligationList

	return tableRowObjects;
}

















