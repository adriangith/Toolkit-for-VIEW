//import * as helpers from "./helper"
import { initialiseWorkbookProcesser, OptionsResult } from './xlsxConverter';
import "./DebtorObligationsSummary";
import { DropDownType } from "./types";
import { CONFIG_WORKBOOK_URL } from "./config";

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

/////Script Launcher///////////////////////////////////////////////////////////////////////////////

/* const addCheckboxes = () => {
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
} */



/////Input creation functions/////////////////////////////////////////////////////////////////////////////////
const workbook = initialiseWorkbookProcesser(
	CONFIG_WORKBOOK_URL
);

/* addCheckboxes(); */
addElements();

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
	/* const buttons = [
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
 */
	const dropDownOptions = await (await workbook).fetchAndProcessOptions("Options")
	const TemplateMeta = await (await workbook).fetchAndConvertXlsxToJson({ Sheet: "Templates", Column: "Recipient" })
	dropDownOptions.map((option: OptionsResult) => {
		const template = option.letters.some((letter: string) => TemplateMeta[letter] && TemplateMeta[letter] === "Agency")
		option.recipient = template
	});
	//buttons.map(button => generateButton(button, dropDown, dropDownOptions));
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
