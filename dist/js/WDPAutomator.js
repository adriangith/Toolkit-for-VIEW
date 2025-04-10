let DataTable;
let obStatus;
let aggregateId;

function find_str(array) {
	for (var i = 0; i < array.length; i++) {
		if (array[i][0].includes("idToken")) {
			return array[i][1];
		}
	}
}

function WDPAutomator(elem) {
	$.getScript(chrome.runtime.getURL('js/External/dataTables.select.min.js'))
	var obligation1;
	var addExternalInfrigementsButton = elem;
	addInfringementsFromViewButton = ViewButton(addExternalInfrigementsButton)
	$('body').append('<script id="script">$(document).ready(function(){$(\'[data-toggle=\"tooltip\"]\').tooltip(); }); <' + '/' + 'script>');
	addInfringementsFromViewButton.addEventListener("click", function () {
		let obligations = [];

		// Check if the element with id "obligationNumber1" exists
		const obligationNumber1 = document.getElementById("obligationNumber1");

		if (obligationNumber1) {
			// If it exists, get its value
			obligations.push(document.getElementById("obligationNumber1").value);
			obligations.push(document.getElementById("obligationNumber2").getAttribute("ng-reflect-model"));
			obligations.push(document.getElementById("obligationNumber3").getAttribute("ng-reflect-model"));
		} else {
			// If it doesn't exist, get the value of the element with id "notes"

			const notesValue = document.querySelector("#notes").value;
			if (notesValue.length !== 10 || !/^\d+$/.test(notesValue)) {
				alert('Obligation number stored in note field must be exactly 10 characters long and contain only numbers.');
			}
			obligations.push(notesValue);
		}

		let message = { "type": "Initialise", "data": obligations }
		$("#table").html(`<div class="lds-ring"><div></div><div></div><div></div><div></div></div>`)
		chrome.runtime.sendMessage(message, function (response) { console.log(response); response.payload !== false ? convertToHTMLTable(response.payload) : $("#table").html("Obligation not found. Please make sure that you are logged into VIEW and that you have you have typed a valid obligation number into the 'Obligation number 1' field") });
	});
}

function clean() {
	document.getElementById("script").parentNode.removeChild(document.getElementById("script"))
	//document.getElementById("ViewButton").parentNode.removeChild(document.getElementById("ViewButton"))
	//document.getElementById("exampleModal").parentNode.removeChild(document.getElementById("exampleModal"))
}

function ViewButton(addExternalInfrigementsButton) {
	let addInfringementsFromViewButton = document.createElement("button");
	let modalWrap = document.createElement("span");
	modalWrap.setAttribute("data-toggle", "modal")
	modalWrap.setAttribute("data-target", "#exampleModal")
	addInfringementsFromViewButton.className = "btn btn-primary pull-left";
	addInfringementsFromViewButton.id = "ViewButton"
	addInfringementsFromViewButton.textContent = "Show obligations from VIEW"
	addInfringementsFromViewButton.setAttribute("data-toggle", "tooltip")
	addInfringementsFromViewButton.setAttribute("title", "Caution: Using this feature may change your active debtor and obligation in VIEW")
	modalWrap.appendChild(addInfringementsFromViewButton)
	const button = addExternalInfrigementsButton.querySelector('button')
	button.parentNode.insertBefore(modalWrap, button.nextSibling);
	// addExternalInfrigementsButton.parentNode.lastChild.previousSibling.previousSibling.previousSibling.firstChild.nextSibling.appendChild(modalWrap)
	return addInfringementsFromViewButton
}

function addModal() {
	let modal = `
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
	modal = $.parseHTML(modal)
	$('body').prepend(modal);
}
function convertToHTMLTable(rows) {
	var html = '<table id="example" class="table table-striped table-bordered" style="width:100%">';
	html += '<thead><tr>';
	for (var j in rows[0]) {
		html += '<th>' + j + '</th>';
	}
	html += '</tr></thead>';
	for (var i = 0; i < rows.length; i++) {
		html += '<tr>';
		for (var j in rows[i]) {
			html += '<td>' + rows[i][j] + '</td>';
		}
		html += '</tr>';
	}
	html += '</table>';
	document.getElementById('table').innerHTML = html;
	DataTable = $("#example").DataTable({
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
}

$(document).ready(function () {
	var $app = $("body");
	addModal()
	$app.livequery("div:contains(Add external infringements)", function (elem) { WDPAutomator(elem) }, function () { clean() });

	document.getElementById("submit").addEventListener("click", function () {
		//Get the current WDP application from the page and store in aggregateId global variable
		aggregateId = parseInt($("[for=WDPApplicationId]")[0].parentNode.textContent.match(/[^-]+$/)[0].replace(/\s/g, ''))

		let currentWDPInfringements = getCurrentWDPInfringements(aggregateId)
		let data = DataTable.rows({ selected: true }).data();
		if (data.length === 0) {
			alert("You must select at least one obligation");
			throw "No Obligations Selected";
		}
		let obligations = []
		obStatus = []
		for (var i = 0; i < data.length; i++) {
			obligations.push(data[i][0]);
			obStatus[data[i][0]] = data[i][3]
		}
		let message = { "type": "Scrape", "data": obligations }
		waitingDialog.show('Getting obligation data from VIEW');
		$("#prog").addClass("in");
		waitingDialog.progress(0);
		chrome.runtime.sendMessage(message, async function (response) {
			waitingDialog.hide();
			var i, j, temparray, chunk = 15;
			let r = 0;
			let array = response.payload.a
			currentWDPInfringements = await currentWDPInfringements;
			array = array.filter(obl => { return !currentWDPInfringements.includes(obl.Infringement) })
			console.log(array);
			let slicedArray = []
			for (i = 0, j = array.length; i < j; i += chunk) {
				slicedArray.push(array.slice(i, i + chunk));
			}
			batchRequests(slicedArray, response.payload, obStatus).then(res => {
				const selectedApplication = `WDP-${aggregateId}`
				var $app = $("body");
				// Get all buttons on the page
				$app.livequery("button:contains(Save)", function (elem) {
					elem.click();
				})
				$app.livequery("#content > app-root > div > app-approved-wdp > div:nth-child(2) > div > div > a", function (elem) {
					elem.click();
				})

				// Select the target node
				const targetNode = document.documentElement; // You can choose a more specific target if needed

				// Options for the observer (in this case, we want to observe the addition of nodes)
				const config = { childList: true, subtree: true };

				// Callback function to execute when mutations are observed
				const callback = function (mutationsList, observer) {
					for (const mutation of mutationsList) {
						if (mutation.type === 'childList') {
							// Check if nodes were added
							if (mutation.addedNodes.length > 0) {
								// Check if any of the added nodes has the ID 'global_filter'
								const addedNodesArray = Array.from(mutation.addedNodes);
								const filteredNodesArray = addedNodesArray.filter(node => typeof node.id === 'string' && node.id !== '')
								const globalFilterAdded = filteredNodesArray.some(node => node.id === 'wdps-data-table')

								setTimeout(() => {
									observer.disconnect();
								}, 8000); // 5000 milliseconds (5 seconds)

								if (globalFilterAdded) {
									try {
										const globalFilter = document.getElementById('global_filter')
										globalFilter.value = selectedApplication;
										globalFilter.click();
										$('button:contains("View")').click();
									} catch (error) {
										// Handle errors
										console.error('Error:', error.message);
									} finally {
										// Disconnect the observer in the finally block
										observer.disconnect();
										//console.log('Observer disconnected');
									}

									// Disconnect the observer to stop further observations
								}


							}
						}
					}
				};

				// Create a new obsersver with the specified callback and options
				const observer = new MutationObserver(callback);

				// Start observing the target node for configured mutations
				observer.observe(targetNode, config);

			})
		})
	})
})

function selectApplication(searchbar) {
	var $app = $("body");
	searchbar.value = "WDP-127"
	searchbar.focus();
}




function submitToWDP(obdata, fulldata, obStatus) {
	console.log(obdata)
	let date = new Date();
	let dateISO = date.toISOString();
	let FillerDate
	let DateofIssue = new Date();
	let DateofBirth = new Date();

	if (obdata["Date of Issue"] !== "") {
		DateofIssue = obdata["Date of Issue"].split("/")
		DateofIssue = new Date(+DateofIssue[2], DateofIssue[1] - 1, +DateofIssue[0]).toISOString();
	}

	if (obdata["Date_of_Birth"] !== "") {
		DateofBirth = obdata["Date_of_Birth"].split("/")
		DateofBirth = new Date(+DateofBirth[2], DateofBirth[1] - 1, +DateofBirth[0]).toISOString();
	}

	let DateofOffence = ""
	if (obdata["Date_of_Offence"] !== "") {
		if (obdata["Offence Time"] !== "") {
			DateofOffence = obdata["Date_of_Offence"].split("/").concat(obdata["Offence Time"].split(":"))
			DateofOffence = new Date(DateofOffence[2], DateofOffence[1] - 1, +DateofOffence[0], +DateofOffence[3], +DateofOffence[4], +DateofOffence[5])
			FillerDate = new Date(DateofOffence);
			DateofOffence.toISOString();
		} else {
			DateofOffence = obdata["Date_of_Offence"].split("/")
			DateofOffence = new Date(DateofOffence[2], DateofOffence[1] - 1, +DateofOffence[0]);
			FillerDate = new Date(DateofOffence);
			DateofOffence = DateofOffence.toISOString();
		}
	}

	if (obdata["Date of Issue"] === "") {
		DateofIssue.setHours(FillerDate.getHours() - 1)
		DateofIssue.toISOString();
	}

	let Obligation = obdata.Obligation

	const isVariationPresent = window.location.href.includes('/wdp-applications/variation');

	const commandType = isVariationPresent ? 'addObligationToWDPVariationCommand' : 'addExternalEnforcementAgenciesObligationCommand'
	const sequence = isVariationPresent ? 'obligation' : 'externalEnforcementAgenciesObligation'
	const eventType = isVariationPresent ? 35 : 12

	const baseCharge = parseFloat(obdata["Reduced_Charge"].replace(/\$/g, ''))
		+ parseFloat(obdata["Court_Fine"].replace(/\$/g, ''))
		+ parseFloat(obdata["Court_Costs"].replace(/\$/g, ''))

	const amountFee = parseFloat(obdata["Penalty_Reminder_Fee"].replace(/\$/g, ''))
		+ parseFloat(obdata["Registration_Fee"].replace(/\$/g, ''))
		+ parseFloat(obdata["Enforcement_Fee"].replace(/\$/g, ''))
		+ parseFloat(obdata["Warrant_Issue_Fee"].replace(/\$/g, ''))
		+ parseFloat(obdata["Amount_Waived"].replace(/\$/g, ''))


	const amountDueAndFee = (amountFee + baseCharge).toString()

	let body = [{
		"commandTimeStamp": dateISO,
		"eventType": eventType,
		[commandType]: {
			"aggregateId": aggregateId,
			"commandEventType": eventType,
			"commandTimeStamp": dateISO,
			"latestTimeStamp": dateISO,
			[sequence]: {
				"debtorID": obdata.DebtorID,
				"debtorDateOfBirth": DateofBirth,
				"infringementNumber": obdata.Infringement,
				"infringementNoticeIssueDate": DateofIssue,
				"issuingAgency": obdata.issuingAgency,
				"infringementIndicator":
					obStatus[Obligation] === "NFDP" ? "NFD" :
						(obStatus[Obligation] === "CHLGLOG" || obStatus[Obligation] === "PAID") && parseInt(obdata["Warrant_Issue_Fee"].replace(/\$/g, '')) > 0 ? "EW" :
							(obStatus[Obligation] === "CHLGLOG" || obStatus[Obligation] === "PAID") && parseInt(obdata["Enforcement_Fee"].replace(/\$/g, '')) > 0 ? "NFD" :
								(obStatus[Obligation] === "CHLGLOG" || obStatus[Obligation] === "PAID") && parseInt(obdata["Penalty_Reminder_Fee"].replace(/\$/g, '')) > 0 ? "PRN" :
									(obStatus[Obligation] === "CHLGLOG" || obStatus[Obligation] === "PAID") && parseInt(obdata["Penalty_Reminder_Fee"].replace(/\$/g, '')) === 0 ? "I" :
										obStatus[Obligation] === "SELENF" ? "PRN" :
											obStatus[Obligation] === "SELDEA" ? "NFD" :
												obStatus[Obligation] === "WARRNT" ? "EW" :
													obStatus[Obligation] === "INF" ? "I" :
														obStatus[Obligation] === "INFP" ? "I" :
															obStatus[Obligation] === "PRN" ? "PRN" :
																obStatus[Obligation] === "PRNP" ? "PRN" :
																	"NFD",
				"enforcementAgencyID": obdata["enforcementAgencyID"],
				"enforcementAgencyCode": obdata["enforcementAgencyCode"],
				"offenceCode": obdata["Offence_Code"],
				"offenceCodeDescription": obdata["Offence_Description"],
				"enforcementAgencyName": obdata["Agency"],
				"offenceStreetSuburb": obdata["Offence Location"],
				"offenceStreetandSuburb": obdata["Offence Location"],
				"offenceDateTime": DateofOffence,
				"registrationStatePlate": obdata["Driver License State"] + " " + obdata["VRM Number"],
				"amountDueAndFee": amountDueAndFee, // Total Amount Owing
				"amountDue": baseCharge, // Original penalty amount
				"amountFee": amountFee, // All fees
				"debtorName": fulldata.First_Name + " " + fulldata.Last_Name,
				"debtorAddressLine1": fulldata.Address_1,
				"debtorAddressSuburb": fulldata.Town,
				"debtorAddressState": fulldata.State,
				"debtorAddressPostCode": fulldata.Post_Code,
				"debtorLicenceState": obdata["Driver License State"] + " " + obdata["Driver License No."],
				"wdpHoldStatusID": parseInt(obdata["Balance_Outstanding"].replace(/\$/g, '')) <= 0 || obStatus[Obligation] === "CHLGLOG" || obStatus[Obligation] === "PAID" || obStatus[Obligation] === "CANCL" ? 97 : 96,
				"eligibility": parseInt(obdata["Balance_Outstanding"].replace(/\$/g, '')) <= 0 || obStatus[Obligation] === "CHLGLOG" || obStatus[Obligation] === "PAID" || obStatus[Obligation] === "CANCL" ? "INELIGIBLE" : "ELIGIBLE",
				"workedOffAmount": 0,
				"manualAdjustmentAmount": Math.abs(parseFloat(obdata['Amount_Paid'].replace(/\$/g, '')) + parseFloat(obdata['Returns'].replace(/\$/g, '')) + parseFloat(obdata['Transfer_In'].replace(/\$/g, '')))
			}
		}
	}]

	if (isVariationPresent) {
		body[0].addObligationToWDPVariationCommand["wdpVariationID"] = 6
	}
	if (isVariationPresent) {
		body[0].addObligationToWDPVariationCommand["obligation"]["obligationNumber"] = obdata.Obligation
	}

	body = JSON.stringify(body)

	apiUrl = location.hostname === "uat.wdp.vic.gov.au" ? "uatapi" :
		location.hostname === "uat2.wdp.vic.gov.au" ? "uat2api" :
			"api";

	let data = fetch("https://" + apiUrl + ".wdp.vic.gov.au/api/WorkDevelopmentPermit/SubmitListOfCommands", {
		// "credentials": "include",
		"headers": {
			"accept": "application/json; charset=UTF-8",
			"authorization": find_str(Object.entries(localStorage)),
			"cache-control": "no-cache",
			"content-type": "application/json; charset=UTF-8",
			"expires": "-1",
			"pragma": "no-cache"
		},
		"referrer": "https://" + location.hostname + "/wdp-applications/external-enforcement-agencies-list?filter=submitted",
		"referrerPolicy": "strict-origin-when-cross-origin",
		"body": body,
		"method": "POST",
		"mode": "cors"
	});
	return data;
}

chrome.storage.onChanged.addListener(function (changes, namespace) {
	for (var key in changes) {
		chrome.storage.local.get(['obligationsCountFixed'], function (items) {
			if (changes.obligationsCount !== undefined) {
				let progress = Math.ceil(100 - (changes.obligationsCount.newValue - 1) / items.obligationsCountFixed * 100)
				waitingDialog.progress(progress, 100);
			}
		})
	}
})


function batchRequests(obdata, fulldata, obStatus) {
	return new Promise(function (resolve, reject) {
		var results = [];

		var index = 0;
		function next() {
			if (index < obdata.length) {
				Promise.all(obdata[index++].map(ob => { return submitToWDP(ob, fulldata, obStatus) })).then(function (data) {
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

async function getCurrentWDPInfringements(appNumber) {

	apiUrl = location.hostname === "uat.wdp.vic.gov.au" ? "uatapi" :
		location.hostname === "uat2.wdp.vic.gov.au" ? "uat2api" :
			"api";

	let res = await fetchResource("https://" + apiUrl + ".wdp.vic.gov.au/api/WorkDevelopmentPermit/" + appNumber, {
		"credentials": "include",
		"headers": {
			"accept": "application/json; charset=UTF-8",
			"authorization": find_str(Object.entries(localStorage)),
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
	});

	let jsonData = await res.json();
	let infringementNumbers = [];
	jsonData.externalEnforcementAgenciesObligations.map(ob => { infringementNumbers.push(ob.infringementNumber) });
	return infringementNumbers
}

function fetchResource(input, init) {
	return new Promise((resolve, reject) => {
		chrome.runtime.sendMessage({ input, init }, messageResponse => {
			const [response, error] = messageResponse;
			if (response === null) {
				reject(error);
			} else {
				// Use undefined on a 204 - No Content
				const body = response.body ? new Blob([response.body]) : undefined;
				resolve(new Response(body, {
					status: response.status,
					statusText: response.statusText,
				}));
			}
		});
	});
}

function addStyleString(str) {
	var node = document.createElement('style');
	node.innerHTML = str;
	document.body.appendChild(node);
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