import $ from 'jquery';
import 'bootstrap-waitingfor';
import 'bootstrap';
//mport 'bootstrap/dist/css/bootstrap.min.css';
import { Tooltip } from 'bootstrap';
import { WDPResponse, obligationStatusMap, WDPBatchPayloadType, WDPCommands, WDPSequence, CollectedData, ObligationNumberList, Message } from "./types";
import DataTable, { Api } from 'datatables.net-dt';
import 'datatables.net-buttons';
import 'datatables.net-select';
import { getStoredAuthorisationToken, throwIfUndefined, watchForElement } from './utils';

const hostname = location.hostname;
const WDPEnvironment = hostname.substring(0, hostname.indexOf('.wdp.vic.gov.au'))
const VIEWEnvironment = ['uat', 'uat2'].includes(WDPEnvironment) ? 'djr-uat1' : 'djr';

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
  table#example tbody tr.selected td {
    color: white !important;
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

addStyleString(`
	.rpl-btn {
		--rpl-clr-primary: #0052C2;
		--rpl-clr-primary-alt: #003174;
		--rpl-clr-type-primary-contrast: #FFFFFF;
		--rpl-border-radius-2: 4px;
		--rpl-border-2: 2px;
		--rpl-sp-2: 8px;
		--rpl-sp-4: 14px;
		--rpl-sp-5: 20px;
		--local-border-width: var(--rpl-border-2);
		--local-filled-bg-clr: var(--rpl-clr-primary);
		--local-filled-bg-clr-hover: var(--rpl-clr-primary-alt);
		--local-filled-type-clr: var(--rpl-clr-type-primary-contrast);

		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--rpl-sp-2);
		box-sizing: border-box;
		border-radius: var(--rpl-border-radius-2);
		border-style: solid;
		border-width: var(--local-border-width);
		padding: calc(var(--rpl-sp-4) - var(--local-border-width)) calc(var(--rpl-sp-5) - var(--local-border-width));
		appearance: none;
		width: auto;
		color: var(--local-filled-type-clr);
		cursor: pointer;
		text-decoration: none;
		background-color: var(--local-filled-bg-clr);
		border-color: var(--local-filled-bg-clr);
		font-family: VIC, Arial, Helvetica, sans-serif;
		font-weight: 700;
		line-height: normal;
		-webkit-font-smoothing: inherit;
		text-transform: none;
		margin-right: 10px;
	}
	.rpl-btn:hover {
		background-color: var(--local-filled-bg-clr-hover);
		border-color: var(--local-filled-bg-clr-hover);
		color: var(--local-filled-type-clr);
		text-decoration: underline;
	}
`);

/**
 * A simple helper function that pauses execution for a given number of milliseconds.
 * @param ms The number of milliseconds to wait.
 */
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Utility to send chrome messages with error handling.
 * Prevents silent fails when extension context is invalidated.
 */
function sendExtensionMessage<T = unknown>(message: Message | unknown): Promise<T> {
	return new Promise((resolve, reject) => {
		try {
			if (!chrome.runtime?.id) {
				return reject(new Error("Extension context invalidated. Please refresh the page."));
			}
			chrome.runtime.sendMessage(message, (response) => {
				if (chrome.runtime.lastError) {
					return reject(new Error(chrome.runtime.lastError.message));
				}
				resolve(response);
			});
		} catch (err) {
			reject(err);
		}
	});
}

async function WDPSubmit(obdata: CollectedData[][], fulldata: CollectedData, obStatus: obligationStatusMap, aggregateId: number) {
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

		const DateOfBirth = (function () {
			const date = new Date();
			if (debtorData["date_of_birth"] !== "") {
				if (!debtorData["date_of_birth"]) {
					throw new Error("date_of_birth is not defined in fulldata");
				}
				const DateParts = (debtorData["date_of_birth"] as string).split("/")
				return new Date(Number(DateParts[2]), Number(DateParts[1]) - 1, Number(DateParts[0])).toISOString();
			}

			return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
		})();

		const DateOfOffence = (function () {
			if (!obdata["Date_of_Offence"]) {
				throw new Error("Date_of_Offence is not defined in obdata");
			}
			if (obdata["Date_of_Offence"] !== "" && obdata["offence_time"] === "") {
				const DateParts = (obdata["Date_of_Offence"] as string).split("/").concat((obdata["offence_time"] as string).split(":"))
				return new Date(Number(DateParts[2]), Number(DateParts[1]) - 1, Number(DateParts[0]), Number(DateParts[3]), Number(DateParts[4]), Number(DateParts[5])).toISOString();
			} else {
				const DateParts = (obdata["Date_of_Offence"] as string).split("/")
				return new Date(Number(DateParts[2]), Number(DateParts[1]) - 1, Number(DateParts[0])).toISOString();
			}
		})();

		const dateOfIssue = (function () {
			if (!obdata["Date of Issue"]) {
				throw new Error("Date of Issue is not defined in obdata");
			}
			if (obdata["Date of Issue"] !== "") {
				const DateParts = (obdata["Date of Issue"] as string).split("/")
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

		const dollarsToCents = (dollarString: string) => Math.round(parseFloat(dollarString.replace(/\$/g, '')) * 100);

		const baseChargeCents = dollarsToCents(throwIfUndefined("reduced_charge", obdata))
			+ dollarsToCents(throwIfUndefined("pre-payments", obdata))
			+ dollarsToCents(throwIfUndefined("amount_paid", obdata))
			+ dollarsToCents(throwIfUndefined("refunds", obdata))
			+ dollarsToCents(throwIfUndefined("returns", obdata))
			+ dollarsToCents(throwIfUndefined("court_fine", obdata))
			+ dollarsToCents(throwIfUndefined("court_costs", obdata))
			+ dollarsToCents(throwIfUndefined("cancellations", obdata))
			+ dollarsToCents(throwIfUndefined("writeoff", obdata))
			+ dollarsToCents(throwIfUndefined("amount_waived", obdata))
			+ dollarsToCents(throwIfUndefined("transfer_in", obdata))
			+ dollarsToCents(throwIfUndefined("transfer_out", obdata))

		const amountFeeCents = dollarsToCents(throwIfUndefined("penalty_reminder_fee", obdata))
			+ dollarsToCents(throwIfUndefined("registration_fee", obdata))
			+ dollarsToCents(throwIfUndefined("enforcement_fee", obdata))
			+ dollarsToCents(throwIfUndefined("warrant_issue_fee", obdata))
			+ dollarsToCents(throwIfUndefined("reversed_fees", obdata))

		// Convert back to dollars
		const baseCharge = baseChargeCents / 100;
		const amountFee = amountFeeCents / 100;


		const amountDueAndFee = (amountFee + baseCharge).toString()

		const currentTimestamp = new Date().toISOString();

		const WDPEligibility = ({ dataSet, valueIfTrue, valueIfFalse }:
			{
				dataSet: CollectedData,
				valueIfTrue: string | number,
				valueIfFalse: string | number
			}) => {
			const Obligation = throwIfUndefined("Obligation", obdata);
			const conditions = [
				parseInt(throwIfUndefined("Balance_Outstanding", obdata).replace(/\$/g, '')) <= 0,
				obStatus[Obligation] === "CHLGLOG",
				obStatus[Obligation] === "PAID",
				obStatus[Obligation] === "CANCL",
				dataSet["InActivePaymentArrangement"],
				dataSet["input_source"] === "2B"
			].some(condition => condition) ? valueIfTrue : valueIfFalse;
			return conditions;
		}

		const body = {
			"commandTimeStamp": currentTimestamp,
			"eventType": eventType,
			[commandType]: {
				"aggregateId": aggregateId,
				"commandEventType": eventType,
				"commandTimeStamp": currentTimestamp,
				"latestTimeStamp": currentTimestamp,
				[sequence]: {
					"debtorID": debtorData.Debtor_ID,
					"debtorDateOfBirth": DateOfBirth,
					"infringementNumber": obdata.Infringement,
					"infringementNoticeIssueDate": dateOfIssue,
					"issuingAgency":
						obdata["input_source"] === "2B" ? 'COURT' : throwIfUndefined('altname', obdata),
					"infringementIndicator": getStatusCode(obStatus, obdata, Obligation),
					"enforcementAgencyID": obdata["input_source"] === "2B" ? 118 : Number(throwIfUndefined("enforcementAgencyID", obdata)),
					"enforcementAgencyCode": obdata["enforcementAgencyCode"] || '',
					"offenceCode": throwIfUndefined("ContraventionCode", obdata),
					"offenceCodeDescription": throwIfUndefined("Offence_Description", obdata),
					"enforcementAgencyName": obdata["altname"] || '',
					"offenceStreetSuburb": obdata["offence_location"],
					"offenceStreetandSuburb": obdata["offence_location"],
					"offenceDateTime": DateOfOffence,
					"registrationStatePlate": (obdata["VRM State"] || obdata["VRM Number"] || obdata["VRM"])
						? (obdata["VRM State"] ? obdata["VRM State"] + ' ' : '') + (obdata["VRM Number"] || obdata["VRM"] || '')
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
					"wdpHoldStatusID": WDPEligibility({ dataSet: obdata, valueIfTrue: 97, valueIfFalse: 96 }),
					"eligibility": WDPEligibility({ dataSet: obdata, valueIfTrue: "INELIGIBLE", valueIfFalse: "ELIGIBLE" }),
					"workedOffAmount": 0,
					"manualAdjustmentAmount": Math.abs(parseFloat(throwIfUndefined('amount_paid', obdata).replace(/\$/g, ''))),
					...(isVariationPresent && { "wdpVariationID": 6, "obligation": { "obligationNumber": obdata.Obligation } })
				}
			}
		} as WDPBatchPayloadType

		/** Obligation data from VIEW to submit to WDP. */
		const payload = JSON.stringify([body])

		/**  API URL for WDP based on the current environment. */
		const apiUrl = WDPEnvironment + 'api';

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

	const results: Response[][] = [];

	for (const currentBatch of obdata) {
		const batchResults: Response[] = [];
		// Loop through the current batch and process one-by-one
		for (const ob of currentBatch) {
			// Wait for the single request to complete
			const response = await WDPSubmitBatch(ob, fulldata, obStatus);
			batchResults.push(response);
			await delay(0); // Delay between individual requests
		}
		results.push(batchResults);
		await delay(0); // Delay between batches
	}
	return results;
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

	const aggregateId = parseInt(WDPApplicationId);

	const currentWDPInfringementsPromise = getCurrentWDPInfringements(aggregateId as unknown as number);
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
			NoticeNumber: obligationData[i][1],
			Issued: obligationData[i][2],
			Balance_Outstanding: obligationData[i][3],
			NoticeStatus: obligationData[i][4],
			Offence: obligationData[i][5],
			ContraventionCode: obligationData[i][5],
			offence_description: obligationData[i][6]
		});
		obStatus[obligationData[i][1]] = obligationData[i][4];
	}

	const targetFields = [
		"date_of_birth", "Date_of_Offence", "offence_time", "Date of Issue", "Obligation",
		"reduced_charge", "pre-payments", "amount_paid", "refunds", "returns", "court_fine",
		"court_costs", "cancellations", "writeoff", "amount_waived", "transfer_in", "transfer_out",
		"penalty_reminder_fee", "registration_fee", "enforcement_fee", "warrant_issue_fee",
		"reversed_fees", "Balance_Outstanding", "input_source", "Debtor_ID", "Infringement",
		"altname", "enforcementAgencyID", "enforcementAgencyCode", "ContraventionCode",
		"Offence_Description", "offence_location", "VRM State", "VRM Number", "VRM",
		"First_Name", "Last_Name", "Address_1", "suburb", "State", "Post_Code",
		"Driver License State", "Driver License No."
	];

	const message: ObligationNumberList = { "type": "WDPBatchProcess", "data": { obligations: obligations, VIEWEnvironment: VIEWEnvironment, targetFields: targetFields as any } };
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

		WDPSubmit(slicedArray, obligationData, obStatus, aggregateId).then(() => {
			// saveButtonObserver
			watchForElement(
				"xpath://button[contains(., 'Save')]",
				function (elem: { click: () => void; }) {
					elem.click();
				}, () => { },
				{
					disconnectOnAppear: true
				}
			);

			watchForElement(
				"xpath://h4[contains(., 'WDP team dashboard')]",
				function () {
					window.history.pushState({}, '', '/wdp-applications/app-wdp-list');

					// Then trigger the route change
					window.dispatchEvent(new PopStateEvent('popstate'));
				}, () => { },
				{
					disconnectOnAppear: true
				}
			);

			// globalFilterObserver
			watchForElement(
				"#manageNewWDP_filter > label > input[type=search]",
				function (elem: { click: () => void; }) {
					if (elem instanceof HTMLInputElement) {
						const selectedApplication = `WDP-${aggregateId}`;
						elem.value = selectedApplication;
						// Make field active
						elem.focus();

						// Simulate Enter key press
						const events = ['keydown', 'keypress', 'keyup'];
						events.forEach(eventType => {
							const event = new KeyboardEvent(eventType, {
								key: 'Enter',
								code: 'Enter',
								keyCode: 13,
								which: 13,
								bubbles: true,
								cancelable: true
							});
							elem.dispatchEvent(event);
							watchForElement(
								`#${CSS.escape(String(aggregateId))}`,
								function (elem: { click: () => void; }) {
									elem.click();
								}, () => { },
								{
									disconnectOnAppear: true
								}
							);
						});
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
 * Attaches the "Show obligations from VIEW" button and manages the modal's lifecycle.
 * This version completely destroys the DataTable when the modal is closed and recreates it
 * when opened, ensuring a clean state and preventing display bugs.
 * @param addExternalInfrigementsButton The "Add external infringements" button to anchor to.
 */
function VIEWPreview(addExternalInfrigementsButton: HTMLButtonElement) {
	// This will hold the reference to the initialized DataTable instance.
	// It's reset to null when the modal closes.
	let obligationPreviewTable: Api<CollectedData[]> | null = null;

	/**
	 * This event handler is the key to the solution. It fires when the modal has
	 * finished being hidden from the user.
	 */
	$('#exampleModal').on('hidden.bs.modal', function () {
		// If the DataTable instance exists, properly destroy it.
		if (obligationPreviewTable) {
			obligationPreviewTable.destroy();
			obligationPreviewTable = null;
		}
		// It's also good practice to clear the table's container HTML.
		$("#table").empty();
	});


	/**
	 * Builds a new DataTable from scratch with the provided data.
	 * This function is now called every time the modal is opened.
	 * @param rows The data to populate the table with.
	 */
	function buildTable(rows: CollectedData[]) {
		if (rows.length === 0) {
			$("#table").html("No data received or data is empty.");
			return;
		}

		// 1. Get headers from the first row of data to build the table structure dynamically.
		const headers = Object.keys(rows[0]);

		// 2. Build the table HTML shell.
		let html = '<table id="example" class="table table-striped table-bordered" style="width:100%">';
		html += '<thead><tr>';
		html += '<th></th>'; // Header for the selection checkbox column
		for (const header of headers) {
			html += `<th>${header}</th>`;
		}
		html += '</tr></thead><tbody></tbody></table>';

		const tableParent = document.getElementById('table');
		if (!tableParent) {
			throw new Error("Table element with id 'table' not found");
		}
		tableParent.innerHTML = html;
		const table = tableParent.firstElementChild as HTMLTableElement;

		// 3. Transform the array of objects into an array of arrays for DataTables.
		const tableData = rows.map(row => {
			// The first '' is a placeholder for the selection column.
			const rowArray: (string | number)[] = [''];
			Object.values(row).forEach(value => {
				if (typeof value === 'string' || typeof value === 'number') {
					rowArray.push(value);
				} else if (typeof value === 'boolean') {
					rowArray.push(value.toString());
				} else if (value === null || value === undefined) {
					rowArray.push('');
				}
			});
			return rowArray;
		});

		// 4. Initialize the new DataTable instance.
		obligationPreviewTable = new DataTable<CollectedData[]>(table, {
			data: tableData, // Pass data directly on initialization
			columnDefs: [{
				orderable: false,
				render: DataTable.render.select(),
				targets: 0
			}],
			dom: 'Blfrtip', // Defines the layout of controls
			ordering: true,
			paging: false,
			select: {
				style: 'multi',
				selector: 'td:first-child'
			},
			buttons: ["selectAll", "selectNone"],
			language: {
				buttons: {
					selectAll: "Select all items",
					selectNone: "Select none"
				}
			}
		});

		// 5. Attach the event listener to the submit button.
		const submitButton = document.getElementById("submit");
		if (!submitButton) {
			throw new Error("Submit button not found");
		}
		// Using .off().on() is a robust way to prevent attaching duplicate listeners.
		$(submitButton).off('click').on('click', () => {
			if (obligationPreviewTable) {
				VIEWExtract(obligationPreviewTable);
			}
		});
	}


	/**
	 * Returns the event handler for the "Show obligations from VIEW" button click.
	 * This function orchestrates fetching the data and triggering the table build.
	 */
	function handleObligationPreview() {
		return function () {
			const obligations: CollectedData[] = [];

			const obligationNumber1 = document.querySelector('input#obligationNumber1');
			if (!(obligationNumber1 instanceof HTMLInputElement)) {
				throw new Error("obligationNumber1 is not an HTMLInputElement");
			}

			const notesValueElement = document.querySelector("#notes");

			if (obligationNumber1 && obligationNumber1.value) {
				obligations.push({ "Obligation": obligationNumber1.value });
			} else if (notesValueElement && notesValueElement instanceof HTMLInputElement) {
				const notesValue = notesValueElement.value;
				if (notesValue.length !== 10 || !/^\d+$/.test(notesValue)) {
					alert('Obligation number stored in note field must be exactly 10 characters long and contain only numbers.');
					return; // Stop execution if validation fails
				}
				obligations.push({ "Obligation": notesValue });
			} else {
				obligations.push({ "Obligation": "" });
			}

			const message: ObligationNumberList = {
				"type": 'WDPPreviewInitialise',
				"data": { obligations: obligations, VIEWEnvironment: VIEWEnvironment }
			};

			// Display the loading ring while waiting for data.
			$("#table").html(`<div class="lds-ring"><div></div><div></div><div></div><div></div></div>`);

			// Fetch data and build the table in the callback.
			sendExtensionMessage<WDPResponse>(message)
				.then((response) => {
					if (response && response.type === "success" && typeof response.data !== "boolean") {
						// Call the function that builds a fresh table.
						buildTable(response.data);
					} else {
						$("#table").html("Obligation not found. Please make sure that you are logged into VIEW and that you have typed a valid obligation number into the 'Obligation number 1' field");
					}
				})
				.catch((error) => {
					$("#table").html(`Error: ${error.message}`);
				});
		};
	}

	// --- The rest of your UI setup code remains the same ---

	const modalAttribs = {
		"data-toggle": "modal",
		"data-target": "#exampleModal"
	};

	const viewButtonAttribs = {
		"data-toggle": "tooltip",
		"title": "Caution: Using this feature may change your active debtor and obligation in VIEW",
		"class": "rpl-btn pull-left",
		"id": "ViewButton",
		"textContent": "Show obligations from VIEW",
	};

	function createElemAndSetAttributes<T extends keyof HTMLElementTagNameMap>(element: T, attributes: Record<string, string>) {
		const newElement = document.createElement(element) as HTMLElementTagNameMap[T];
		Object.entries(attributes).forEach(([key, value]) => {
			if (value !== undefined && key !== "textContent") {
				newElement.setAttribute(key, value.toString());
			} else if (key === "textContent") {
				newElement.textContent = value;
			}
		});
		return newElement;
	}

	const modalWrap = createElemAndSetAttributes("span", modalAttribs);
	const addInfringementsFromViewButton = createElemAndSetAttributes("button", viewButtonAttribs);

	modalWrap.appendChild(addInfringementsFromViewButton);

	if (addExternalInfrigementsButton.parentNode === null) {
		throw new Error("Parent node of addExternalInfrigementsButton not found");
	}

	addExternalInfrigementsButton.parentNode.insertBefore(modalWrap, addExternalInfrigementsButton.nextSibling);

	const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-toggle="tooltip"]'));
	tooltipTriggerList.map(function (tooltipTriggerEl) {
		return new Tooltip(tooltipTriggerEl);
	});

	/**
	 * Attach the main event handler to the "Show obligations from VIEW" button.
	 */
	addInfringementsFromViewButton.addEventListener("click", handleObligationPreview());

	return addInfringementsFromViewButton;
}
/**
 * WDP initialisation function
 * This function sets up the WDP automator by adding a modal and watching for the "Add external infringements" button.
 * When the button is clicked, it triggers the WDPAutomator function to handle the process of adding external infringements.
*/
function WDPButton() {
	addModal()
	watchForElement(
		"xpath://button[contains(., 'Add external infringements')]",
		function (watchedElement: HTMLElement) {
			if (!(watchedElement instanceof HTMLButtonElement)) {
				throw new Error("Element is not a button");
			}
			VIEWPreview(watchedElement)
		},
		function (element: HTMLElement, newElement?: HTMLElement | null) {
			if (newElement !== null) {
				//remove element from DOM
				element.parentNode?.removeChild(element);
			}
		}
	);

}