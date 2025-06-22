import $ from 'jquery';
import 'bootstrap-waitingfor';
import 'bootstrap';
//mport 'bootstrap/dist/css/bootstrap.min.css';
import { Tooltip } from 'bootstrap';
import { WDPResponse, obligationStatusMap, WDPBatchPayloadType, WDPCommands, WDPSequence, CollectedData, ObligationNumberList } from "./types";
import DataTable, { Api } from 'datatables.net-dt';
import 'datatables.net-buttons';
import 'datatables.net-select';
import { getStoredAuthorisationToken, throwIfUndefined, watchForElement } from './utils';


let aggregateId: number;

function addStyleString(str: string) {
	const node = document.createElement('style');
	node.innerHTML = str;
	document.body.appendChild(node);
}

function addModal() {
	const modal = `
		<div class="modal fade" id="exampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="exampleModalLabel">Obligations from VIEW</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
		<div id="table">
		
		</div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
        <button id="submit" type="button" class="btn btn-primary" data-dismiss="modal">Add to WDP</button>
		<button type="button" class="btn btn-primary">Place Holds</button>
      </div>
    </div>
  </div>
</div>
	`

	$('body').prepend($.parseHTML(modal));
}

if (document.readyState === "interactive" || document.readyState === "complete") {
	// If it is, execute your function directly
	WDPButton();
} else {
	// Otherwise, wait for the DOMContentLoaded event
	document.addEventListener('DOMContentLoaded', WDPButton);
}









addStyleString(`.lds-ring {
	display: block;
	position: relative;
	width: 80px;
	height: 80px;
	margin: auto;
  }
  .lds-ring div {
	box-sizing: border-box;
	display: block;
	position: absolute;
	width: 64px;
	height: 64px;
	margin: auto;
	border: 8px solid #e7e7e7;
	border-radius: 50%;
	animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
	border-color: #e7e7e7 transparent transparent transparent;
	display: flex;
	align-items: center
  }
  .lds-ring div:nth-child(1) {
	animation-delay: -0.45s;
  }
  .lds-ring div:nth-child(2) {
	animation-delay: -0.3s;
  }
  .lds-ring div:nth-child(3) {
	animation-delay: -0.15s;
  }
  @keyframes lds-ring {
	0% {
	  transform: rotate(0deg);
	}
	100% {
	  transform: rotate(360deg);
	}
  }
  `);



function WDPSubmit(obdata: CollectedData[][], fulldata: CollectedData, obStatus: obligationStatusMap) {
	function getStatusCode(obligationStatus: obligationStatusMap, obligationData: CollectedData, Obligation: string) {
		// Extract the status for this obligation
		const status = obligationStatus[Obligation];

		// Parse monetary values, ensuring we handle empty or non-numeric values
		const warrantIssueFee = parseInt(throwIfUndefined("warrant_issue_fee", obligationData).replace(/\$/g, '') || '0');
		const enforcementFee = parseInt(throwIfUndefined("enforcement_fee", obligationData).replace(/\$/g, '') || '0');
		const penaltyReminderFee = parseInt(throwIfUndefined("penalty_reminder_fee", obligationData).replace(/\$/g, '') || '0');

		// Define status mapping rules
		if (status === "NFDP") {
			return "NFD";
		}

		if ((status === "CHLGLOG" || status === "PAID")) {
			if (warrantIssueFee > 0) {
				return "EW";
			}
			if (enforcementFee > 0) {
				return "NFD";
			}
			if (penaltyReminderFee > 0) {
				return "PRN";
			}
			if (penaltyReminderFee === 0) {
				return "I";
			}
		}

		// Handle other specific statuses
		switch (status) {
			case "SELENF": return "PRN";
			case "SELDEA": return "NFD";
			case "WARRNT": return "EW";
			case "INF": return "I";
			case "INFP": return "I";
			case "PRN": return "PRN";
			case "PRNP": return "PRN";
			default: return "NFD";
		}
	}

	function WDPSubmitBatch(
		obdata: CollectedData,
		debtorData: CollectedData,
		obStatus: obligationStatusMap) {

		const date = new Date();
		const dateISO = date.toISOString();

		const DateOfBirth = (function () {
			if (debtorData["date_of_birth"] !== "") {
				if (!debtorData["date_of_birth"]) {
					throw new Error("date_of_birth is not defined in fulldata");
				}
				const DateParts = debtorData["date_of_birth"].split("/")
				return new Date(Number(DateParts[2]), Number(DateParts[1]) - 1, Number(DateParts[0])).toISOString();
			}

			return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
		})();

		const DateOfOffence = (function () {
			if (!obdata["Date_of_Offence"]) {
				throw new Error("Date_of_Offence is not defined in obdata");
			}
			if (obdata["Date_of_Offence"] !== "" && obdata["offence_time"] === "") {
				const DateParts = obdata["Date_of_Offence"].split("/").concat(obdata["offence_time"].split(":"))
				return new Date(Number(DateParts[2]), Number(DateParts[1]) - 1, Number(DateParts[0]), Number(DateParts[3]), Number(DateParts[4]), Number(DateParts[5])).toISOString();
			} else {
				const DateParts = obdata["Date_of_Offence"].split("/")
				return new Date(Number(DateParts[2]), Number(DateParts[1]) - 1, Number(DateParts[0])).toISOString();
			}
		})();

		const dateOfIssue = (function () {
			if (!obdata["Date of Issue"]) {
				throw new Error("Date of Issue is not defined in obdata");
			}
			if (obdata["Date of Issue"] !== "") {
				const DateParts = obdata["Date of Issue"].split("/")
				return new Date(Number(DateParts[2]), Number(DateParts[1]) - 1, Number(DateParts[0])).toISOString();
			}
			const date = new Date()
			date.setHours(new Date(DateOfOffence).getHours() - 1)
			return date.toISOString();
		})();

		const Obligation = throwIfUndefined("Obligation", obdata);

		const isVariationPresent = window.location.href.includes('/wdp-applications/variation');

		const commandType: WDPCommands = isVariationPresent ? 'addObligationToWDPVariationCommand' : 'addExternalEnforcementAgenciesObligationCommand'
		const sequence: WDPSequence = isVariationPresent ? 'obligation' : 'externalEnforcementAgenciesObligation'
		const eventType = isVariationPresent ? 35 : 12


		const baseCharge = parseFloat(throwIfUndefined("reduced_charge", obdata).replace(/\$/g, ''))
			+ parseFloat(throwIfUndefined("court_fine", obdata).replace(/\$/g, ''))
			+ parseFloat(throwIfUndefined("court_costs", obdata).replace(/\$/g, ''))

		const amountFee = parseFloat(throwIfUndefined("penalty_reminder_fee", obdata).replace(/\$/g, ''))
			+ parseFloat(throwIfUndefined("registration_fee", obdata).replace(/\$/g, ''))
			+ parseFloat(throwIfUndefined("enforcement_fee", obdata).replace(/\$/g, ''))
			+ parseFloat(throwIfUndefined("warrant_issue_fee", obdata).replace(/\$/g, ''))
			+ parseFloat(throwIfUndefined("amount_waived", obdata).replace(/\$/g, ''))


		const amountDueAndFee = (amountFee + baseCharge).toString()

		const body = {
			"commandTimeStamp": dateISO,
			"eventType": eventType,
			[commandType]: {
				"aggregateId": aggregateId,
				"commandEventType": eventType,
				"commandTimeStamp": dateISO,
				"latestTimeStamp": dateISO,
				[sequence]: {
					"debtorID": debtorData.Debtor_ID,
					"debtorDateOfBirth": DateOfBirth,
					"infringementNumber": obdata.Infringement,
					"infringementNoticeIssueDate": dateOfIssue,
					"issuingAgency": throwIfUndefined('enforcename', obdata),
					"infringementIndicator": getStatusCode(obStatus, obdata, Obligation),
					"enforcementAgencyID": Number(throwIfUndefined("enforcementAgencyID", obdata)),
					"enforcementAgencyCode": throwIfUndefined("enforcementAgencyCode", obdata),
					"offenceCode": throwIfUndefined("ContraventionCode", obdata),
					"offenceCodeDescription": throwIfUndefined("Offence_Description", obdata),
					"enforcementAgencyName": obdata["enforcename"] || '',
					"offenceStreetSuburb": obdata["offence_location"],
					"offenceStreetandSuburb": obdata["offence_location"],
					"offenceDateTime": DateOfOffence,
					"registrationStatePlate": (obdata["VRM State"] || obdata["VRM Number"])
						? (obdata["VRM State"] ? obdata["VRM State"] + ' ' : '') + (obdata["VRM Number"] ? obdata["VRM Number"] : '')
						: undefined,
					"amountDueAndFee": String(amountDueAndFee),
					"amountDue": baseCharge,
					"amountFee": amountFee,
					"debtorName": throwIfUndefined("First_Name", debtorData) + " " + throwIfUndefined("Last_Name", debtorData),
					"debtorAddressLine1": throwIfUndefined("Address_1", debtorData),
					"debtorAddressSuburb": throwIfUndefined("suburb", debtorData),
					"debtorAddressState": throwIfUndefined("State", debtorData),
					"debtorAddressPostCode": throwIfUndefined("Post_Code", debtorData),
					"debtorLicenceState": (obdata["Driver License State"] || obdata["Driver License No."])
						? (obdata["Driver License State"] ? obdata["Driver License State"] + ' ' : '') + (obdata["Driver License No."] ? obdata["Driver License No."] : '')
						: undefined,
					"wdpHoldStatusID": parseInt(throwIfUndefined("Balance_Outstanding", obdata).replace(/\$/g, '')) <= 0 || obStatus[Obligation] === "CHLGLOG" || obStatus[Obligation] === "PAID" || obStatus[Obligation] === "CANCL" ? 97 : 96,
					"eligibility": parseInt(throwIfUndefined("Balance_Outstanding", obdata).replace(/\$/g, '')) <= 0 || obStatus[Obligation] === "CHLGLOG" || obStatus[Obligation] === "PAID" || obStatus[Obligation] === "CANCL" ? "INELIGIBLE" : "ELIGIBLE",
					"workedOffAmount": 0,
					"manualAdjustmentAmount": Math.abs(parseFloat(throwIfUndefined('amount_paid', obdata).replace(/\$/g, ''))),
					...(isVariationPresent && { "wdpVariationID": 6, "obligation": { "obligationNumber": obdata.Obligation } })
				}
			}
		} as WDPBatchPayloadType


		/** Obligation data from VIEW to submit to WDP. */
		const payload = JSON.stringify([body])

		const hostname = location.hostname;

		const apiUrl = hostname.substring(0, hostname.indexOf('.wdp.vic.gov.au')) + 'api';

		/** Stored authorization token for WDP */
		const authorization = getStoredAuthorisationToken(Object.entries<string>(localStorage));

		/** Fetch request to submit the obligation data to WDP */
		const data = fetch("https://" + apiUrl + ".wdp.vic.gov.au/api/WorkDevelopmentPermit/SubmitListOfCommands", {
			"headers": {
				"accept": "application/json; charset=UTF-8",
				"authorization": authorization,
				"cache-control": "no-cache",
				"content-type": "application/json; charset=UTF-8",
				"expires": "-1",
				"pragma": "no-cache"
			},
			"referrer": "https://" + location.hostname + "/wdp-applications/external-enforcement-agencies-list?filter=submitted",
			"referrerPolicy": "strict-origin-when-cross-origin",
			"body": payload,
			"method": "POST",
			"mode": "cors"
		});
		return data;
	}

	return new Promise(function (resolve, reject) {
		const results: Response[][] = [];

		let index = 0;
		function next() {
			if (index < obdata.length) {
				Promise.all(obdata[index++].map((ob: CollectedData) => { return WDPSubmitBatch(ob, fulldata, obStatus) })).then(function (data) {
					results.push(data);
					setTimeout(function () { next() }, 1000);
				}, reject);
			} else {
				resolve(results);
			}
		}
		// start first iteration
		next();
	});
}


function VIEWExtract(obligationPreviewTable: Api<CollectedData[]>) {
	/**
	 * Fetch the current WDP infringements for a specific application number.
	 * @param appNumber The application number to fetch current WDP infringements for.
	 * @returns A promise that resolves to an array of infringement numbers.
	 */
	async function getCurrentWDPInfringements(appNumber: string | number) {
		const hostname = location.hostname;
		//** API URL based on the current hostname. */
		const apiUrl = hostname.substring(0, hostname.indexOf('.wdp.vic.gov.au')) + 'api';

		const init: Parameters<typeof fetch>[1] = {
			"headers": {
				"accept": "application/json; charset=UTF-8",
				"authorization": getStoredAuthorisationToken(Object.entries(localStorage)),
				"cache-control": "no-cache",
				"content-type": "application/json",
				"expires": "-1",
				"pragma": "no-cache"
			},
			"referrer": "https://" + location.hostname + "/wdp-applications/app-wdp-list?filter=inProgress",
			"referrerPolicy": "no-referrer-when-downgrade",
			"body": null,
			"method": "GET",
			"mode": "cors"
		}

		const res = await fetch("https://" + apiUrl + ".wdp.vic.gov.au/api/WorkDevelopmentPermit/" + appNumber, init);

		const jsonData = await res.json();
		const infringementNumbers: string[] = [];
		jsonData.externalEnforcementAgenciesObligations.map((ob: { infringementNumber: string; }) => { infringementNumbers.push(ob.infringementNumber) });
		return infringementNumbers
	}

	const WDPApplicationElem = document.querySelector("[for=WDPApplicationId]");
	if (!WDPApplicationElem) {
		throw new Error("WDPApplicationId element not found");
	}

	if (WDPApplicationElem.parentNode === null) {
		throw new Error("Parent node of WDPApplicationId element not found");
	}

	if (WDPApplicationElem.parentNode.textContent === null) {
		throw new Error("Text content of WDPApplicationId element not found");
	}

	const WDPApplicationId = WDPApplicationElem.parentNode.textContent.match(/[^-]+$/)?.[0].replace(/\s/g, '');
	if (WDPApplicationId === undefined) {
		throw new Error("WDPApplicationId not found");
	}

	aggregateId = parseInt(WDPApplicationId);

	const currentWDPInfringementsPromise = getCurrentWDPInfringements(aggregateId);
	const data = obligationPreviewTable.rows({ selected: true }).data();
	if (data.length === 0) {
		alert("You must select at least one obligation");
		throw "No Obligations Selected";
	}
	const obligationData = data.rows({ selected: true }).data().toArray()
	const obligations: CollectedData[] = [];
	const obStatus: obligationStatusMap = {};
	for (let i = 0; i < obligationData.length; i++) {
		obligations.push({
			NoticeNumber: obligationData[i][0],
			Issued: obligationData[i][1],
			Balance_Outstanding: obligationData[i][2],
			NoticeStatus: obligationData[i][3],
			Offence: obligationData[i][4]
		});
		obStatus[obligationData[i][0]] = obligationData[i][3];
	}

	const message: ObligationNumberList = { "type": "WDPBatchProcess", "data": { obligations: obligations, VIEWEnvironment: 'djr' } };
	const progressBar = document.createElement("div");
	progressBar.className = "progress";
	Object.assign(progressBar.style, {
		position: 'fixed',
		top: '0',
		left: '0',
		width: '100%',
		zIndex: '1000',
	});
	const progressBarInner = document.createElement("div");
	progressBarInner.className = "progress-bar";
	progressBarInner.setAttribute("role", "progressbar");
	progressBarInner.setAttribute("aria-valuenow", "0");
	progressBarInner.setAttribute("aria-valuemin", "0");
	progressBarInner.setAttribute("aria-valuemax", "100");
	progressBar.appendChild(progressBarInner);
	document.body.appendChild(progressBar);
	chrome.runtime.sendMessage<typeof message, { data: CollectedData[] }>(message, async function (response) {
		document.body.removeChild(progressBar);
		let i, j;
		const chunk = 15;
		const obligationData = response.data[0]
		if (!obligationData.a) {
			throw new Error("No obligations found in response payload");
		}
		let array = obligationData.a;
		const currentWDPInfringements = await currentWDPInfringementsPromise;
		array = array.filter((obl: CollectedData) => {
			if (!obl.Infringement) {
				throw new Error("Obligation does not have an Infringement property");
			}
			return !currentWDPInfringements.includes(obl.Infringement as string);
		});
		const slicedArray: CollectedData[][] = [];
		for (i = 0, j = array.length; i < j; i += chunk) {
			slicedArray.push(array.slice(i, i + chunk));
		}

		WDPSubmit(slicedArray, obligationData, obStatus).then(() => {
			// saveButtonObserver
			watchForElement(
				"xpath://button[contains(text(), 'Save')]",
				function (elem: { click: () => void; }) {
					elem.click();
				}, () => { },
				{
					disconnectOnAppear: true
				}
			);

			// approvedButtonObserver
			watchForElement(
				"#content > app-root > div > app-approved-wdp > div:nth-child(2) > div > div > a",
				function (elem: { click: () => void; }) {
					elem.click();
				}, () => { },
				{
					disconnectOnAppear: true
				}
			);

			// globalFilterObserver
			watchForElement(
				"#global_filter",
				function (elem: { click: () => void; }) {
					if (elem instanceof HTMLInputElement) {
						const selectedApplication = `WDP-${aggregateId}`;
						elem.value = selectedApplication;
					}
					elem.click();
				}, () => { }, {
				disconnectOnAppear: true
			}
			);
		});
	});
	chrome.storage.onChanged.addListener(function (changes) {
		// Only proceed if obligationsCount actually changedW
		if (changes.obligationsCount?.newValue !== undefined) {
			chrome.storage.local.get(['obligationsCountFixed'], function (items) {
				const progress = Math.ceil(
					100 - (changes.obligationsCount.newValue - 1) / items.obligationsCountFixed * 100
				);
				progressBarInner.style.width = progress + "%";
			});
		}
	});
}



/**
 * This function creates a modal and a button to view obligations from VIEW.
 * @param addExternalInfrigementsButton The button element that triggers the addition of external infringements.
 * @returns HTMLButtonElement - The button that allows viewing obligations from VIEW.
 * @throws Will throw an error if the parent node of the addExternalInfrigementsButton is not found.
 */
function VIEWPreview(addExternalInfrigementsButton: HTMLButtonElement) {
	function buildDataTable(rows: CollectedData[]) {
		let html = '<table id="example" class="table table-striped table-bordered" style="width:100%">';
		html += '<thead><tr>';
		for (const j in rows[0]) {
			html += '<th>' + j + '</th>';
		}
		html += '</tr></thead>';
		for (let i = 0; i < rows.length; i++) {
			html += '<tr>';
			for (const j in rows[i]) {
				html += '<td>' + rows[i][j as keyof CollectedData] + '</td>';
			}
			html += '</tr>';
		}
		html += '</table>';
		const tableParent = document.getElementById('table');
		if (tableParent === undefined) {
			throw new Error("Table element not found");
		}
		if (tableParent === null) {
			throw new Error("Table element not found");
		}
		tableParent.innerHTML = html;
		const table = tableParent.firstElementChild;
		if (table === null) {
			throw new Error("Table element not found");
		}
		const obligationPreviewTable = new DataTable<CollectedData[]>(table, {
			"dom": 'Blfrtip',
			"ordering": true,
			"paging": false,
			"select": {
				"style": "multi"
			},
			"buttons": [
				"selectAll",
				"selectNone"
			],
			"language": {
				"buttons": {
					"selectAll": "Select all items",
					"selectNone": "Select none"
				}
			}
		})

		const submitButton = document.getElementById("submit");
		if (!submitButton) {
			throw new Error("Submit button not found");
		}
		submitButton.addEventListener("click", () => VIEWExtract(obligationPreviewTable))
	}

	/**
	* Gets obligation numbers from VIEW and populates the preview table.
	* Uses the obligation number as a query from the input field if it exists, otherwise uses the value from the notes field.
	* @throws Will throw an error if the element with id "obligationNumber1" is not an HTMLInputElement.
	* @throws Will throw an error if the element with id "notes" is not an HTMLInputElement.
	*/
	function handleObligationPreview() {
		return function () {
			const obligations: CollectedData[] = [];

			// Check if the element with id "obligationNumber1" exists
			const obligationNumber1 = document.getElementById("obligationNumber1");

			if (!(obligationNumber1 instanceof HTMLInputElement)) {
				throw new Error("obligationNumber1 is not an HTMLInputElement");
			}

			if (obligationNumber1) {
				// If it exists, get its value
				obligations.push({ "Obligation": obligationNumber1.value });
			} else {
				// If it doesn't exist, get the value of the element with id "notes"
				const notesValueElement = document.querySelector("#notes");
				if (!(notesValueElement instanceof HTMLInputElement)) {
					throw new Error("notesValueElement is not an HTMLInputElement");
				}
				const notesValue = notesValueElement.value;
				if (notesValue.length !== 10 || !/^\d+$/.test(notesValue)) {
					alert('Obligation number stored in note field must be exactly 10 characters long and contain only numbers.');
				}
				obligations.push({ "Obligation": notesValue });
			}

			const message: ObligationNumberList = {
				"type": 'WDPPreviewInitialise',
				"data": { obligations: obligations, VIEWEnvironment: 'djr' }
			};

			$("#table").html(`<div class="lds-ring"><div></div><div></div><div></div><div></div></div>`);
			chrome.runtime.sendMessage(message, function (response: WDPResponse) {
				if (response.type === "success" && typeof response.data !== "boolean") {
					buildDataTable(response.data);
				} else {
					$("#table").html("Obligation not found. Please make sure that you are logged into VIEW and that you have you have typed a valid obligation number into the 'Obligation number 1' field");
				}
			});
		};
	}

	const modalAttribs = {
		"data-toggle": "modal",
		"data-target": "#exampleModal"
	}

	const viewButtonAttribs = {
		"data-toggle": "tooltip",
		"title": "Caution: Using this feature may change your active debtor and obligation in VIEW",
		"class": "btn btn-primary pull-left",
		"id": "ViewButton",
		"textContent": "Show obligations from VIEW",
	}

	function createElemAndSetAttributes<T extends keyof HTMLElementTagNameMap>(element: T, attributes: Record<string, string>) {
		const newElement = document.createElement(element) as HTMLElementTagNameMap[T]
		Object.entries(attributes).forEach(([key, value]) => {
			if (value !== undefined && key !== "textContent") {
				newElement.setAttribute(key, value.toString());
			} else if (key === "textContent") {
				newElement.textContent = value;
			}
		});
		return newElement;
	}

	const modalWrap = createElemAndSetAttributes("span", modalAttribs)
	const addInfringementsFromViewButton = createElemAndSetAttributes("button", viewButtonAttribs)

	modalWrap.appendChild(addInfringementsFromViewButton)

	if (addExternalInfrigementsButton.parentNode === null) {
		throw new Error("Parent node of addExternalInfrigementsButton not found");
	}

	addExternalInfrigementsButton.parentNode.insertBefore(modalWrap, addExternalInfrigementsButton.nextSibling);
	const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-toggle="tooltip"]'))
	tooltipTriggerList.map(function (tooltipTriggerEl) {
		return new Tooltip(tooltipTriggerEl)
	});

	/**
	 * Event handler for the "Show obligations from VIEW" button.
	 * This function retrieves obligation numbers from the input fields and sends a message to the background script.
	 */
	addInfringementsFromViewButton.addEventListener("click", handleObligationPreview());

	return addInfringementsFromViewButton
}

/**
 * WDP initialisation function
 * This function sets up the WDP automator by adding a modal and watching for the "Add external infringements" button.
 * When the button is clicked, it triggers the WDPAutomator function to handle the process of adding external infringements.
*/
function WDPButton() {
	addModal()
	watchForElement(
		"xpath://button[contains(text(), 'Add external infringements')]",
		function (element: HTMLElement) {
			if (!(element instanceof HTMLButtonElement)) {
				throw new Error("Element is not a button");
			}
			VIEWPreview(element)
		},
		function (element: HTMLElement, newElement?: HTMLElement | null) {
			if (newElement !== null) {
				//remove element from DOM
				element.parentNode?.removeChild(element);
			}
		}
	);

}