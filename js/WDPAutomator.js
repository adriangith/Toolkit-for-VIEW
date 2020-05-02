let DataTable;
let obStatus;
let aggregateId;

function find_str(array){
  for(var i=0;i<array.length;i++){
    if(array[i][0].includes("idToken")){
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
	addInfringementsFromViewButton.addEventListener("click", function(){
	  let obligations = [document.getElementById("obligationNumber1").value, document.getElementById("obligationNumber2").getAttribute("ng-reflect-model"), document.getElementById("obligationNumber3").getAttribute("ng-reflect-model")]
	  let message = {"type":"Initialise", "data": obligations}
	 $("#table").html(`<div class="lds-ring"><div></div><div></div><div></div><div></div></div>`)
	  chrome.runtime.sendMessage(message, function(response) {console.log(response); response.payload !== false ? convertToHTMLTable(response.payload) : $("#table").html("Obligation not found. Please make sure that you are logged into VIEW and that you have you have typed a valid obligation number into the 'Obligation number 1' field")});
	});
}

function clean(){
	document.getElementById("script").parentNode.removeChild(document.getElementById("script"))
	document.getElementById("ViewButton").parentNode.removeChild(document.getElementById("ViewButton"))
	document.getElementById("exampleModal").parentNode.removeChild(document.getElementById("exampleModal"))
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
	addExternalInfrigementsButton.parentNode.lastChild.previousSibling.previousSibling.previousSibling.firstChild.nextSibling.appendChild(modalWrap)
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
	modal = $.parseHTML( modal )
	$('body').prepend(modal);
}
function convertToHTMLTable(rows) {
	var html = '<table id="example" class="table table-striped table-bordered" style="width:100%">';
 html += '<thead><tr>';
 for( var j in rows[0] ) {
  html += '<th>' + j + '</th>';
 }
 html += '</tr></thead>';
 for( var i = 0; i < rows.length; i++) {
  html += '<tr>';
  for( var j in rows[i] ) {
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

$(document).ready(function(){
var $app = $("body");
addModal()
$app.livequery("div:contains(Add external infringements)", function(elem) {WDPAutomator(elem)}, function(){clean()});

	document.getElementById("submit").addEventListener("click", function(){
		aggregateId = parseInt($("[for=WDPApplicationId]")[0].parentNode.textContent.match(/[^-]+$/)[0].replace(/\s/g, ''))
		let currentWDPInfringements = getCurrentWDPInfringements(aggregateId)
		let data = DataTable.rows( { selected: true } ).data();
		let obligations=[]
		obStatus = []
		for (var i=0; i < data.length ;i++){
			obligations.push(data[i][0]);
			obStatus[data[i][0]] = data[i][3]
		}
		let message = {"type":"Scrape", "data": obligations}
		waitingDialog.show('Getting obligation data from VIEW');
		$("#prog").addClass("in");
		waitingDialog.progress(0);
		chrome.runtime.sendMessage(message, async function(response) {
			waitingDialog.hide();
			var i,j,temparray,chunk = 15;
			let r = 0;
			let array = response.payload.a
			currentWDPInfringements = await currentWDPInfringements;
			array = array.filter(obl => {return !currentWDPInfringements.includes(obl.Infringement)}) 
			console.log(array);
			let slicedArray = []
			for (i=0,j=array.length; i<j; i+=chunk) {
				slicedArray.push(array.slice(i,i+chunk));
			}
			batchRequests(slicedArray, response.payload, obStatus);
		})
	})
})




function submitToWDP(obdata, fulldata, obStatus) {
	let date = new Date();
	let dateISO = date.toISOString();
	let FillerDate
	let DateofIssue = new Date();
	
	if (obdata["Date of Issue"]  !== "") {
		DateofIssue = obdata["Date of Issue"].split("/")
		DateofIssue = new Date(+DateofIssue[2], DateofIssue[1] - 1, +DateofIssue[0]).toISOString();  
	}
	
	let DateofOffence = ""
	if (obdata["Date_of_Offence"]  !== "") {
		if (obdata["Offence Time"]  !== "") {
			DateofOffence = obdata["Date_of_Offence"].split("/").concat(obdata["Offence Time"].split(":"))
			DateofOffence = new Date(DateofOffence[2], DateofOffence[1] - 1, +DateofOffence[0], +DateofOffence[3], +DateofOffence[4], +DateofOffence[5])
			FillerDate = new Date(DateofOffence);
			DateofOffence.toISOString();  
		} else{
			DateofOffence = obdata["Date_of_Offence"].split("/")
			DateofOffence = new Date(DateofOffence[2], DateofOffence[1] - 1, +DateofOffence[0]);
			FillerDate = new Date(DateofOffence);
			DateofOffence = DateofOffence.toISOString(); 
		} 
	}
	
	if (obdata["Date of Issue"]  === "") {
		DateofIssue.setHours(FillerDate.getHours() - 1)
		DateofIssue.toISOString();
	}
	
	let Obligation =  obdata.Obligation
	
	let body = [{
			"commandTimeStamp":dateISO,
			"eventType":12,
			"addExternalEnforcementAgenciesObligationCommand":{	
				"aggregateId": aggregateId,
				"commandEventType":12,
				"commandTimeStamp":dateISO,
				"latestTimeStamp":dateISO,
				"externalEnforcementAgenciesObligation":{
					"infringementNumber": obdata.Infringement,
					"infringementNoticeIssueDate": DateofIssue,
					"infringementIndicator": obStatus[Obligation] === "NFDP" || obStatus[Obligation] === "CHLGLOG" || obStatus[Obligation] === "SELENF" ? "O" : obStatus[Obligation] === "WARRNT" ? "W" : "I",
					"enforcementAgencyID": obdata["enforcementAgencyID"], 
					"enforcementAgencyCode":obdata["enforcementAgencyCode"],
					"offenceCodeDescription":obdata["Offence_Description"],
					"enforcementAgencyName":obdata["Agency"],
					"offenceStreetSuburb": obdata["Offence Location"],
					"offenceDateTime": DateofOffence,
					"registrationStatePlate": obdata["Driver License State"] + " " + obdata["VRM Number"],
					"amountDue":  obdata["Balance_Outstanding"].replace(/\$/g, ''),
					"debtorName": fulldata.First_Name + " " + fulldata.Last_Name,
					"debtorAddressLine1": fulldata.Address_1,
					"debtorAddressSuburb":fulldata.Town,
					"debtorAddressState":fulldata.State,
					"debtorAddressPostCode":fulldata.Post_Code,
					"debtorLicenceState":obdata["Driver License State"] + " " + obdata["Driver License No."], 
					"eligibility": parseInt(obdata["Balance_Outstanding"].replace(/\$/g, '')) <= 0 || obStatus[Obligation] === "CHLGLOG" || obStatus[Obligation] === "PAID" || obStatus[Obligation] === "CANCL" ? "INELIGIBLE" : "ELIGIBLE",
					"workedOffAmount":0,
					"manualAdjustmentAmount":0
					}
				}
			}
		]
	
	body = JSON.stringify(body)
	
	apiUrl = location.hostname === "uat.wdp.vic.gov.au" ? "uatapi" : "api";
	
    let data = fetch("https://" + apiUrl + ".wdp.vic.gov.au/api/WorkDevelopmentPermit/SubmitListOfCommands", {
        "credentials": "include",
        "headers": {
            "accept": "application/json; charset=UTF-8",
            "authorization": find_str(Object.entries(localStorage)) ,
            "cache-control": "no-cache",
            "content-type": "application/json; charset=UTF-8",
            "expires": "-1",
            "pragma": "no-cache"
        },
        "referrer": "https://" + location.hostname + "/wdp-applications/external-enforcement-agencies-list?filter=submitted",
        "referrerPolicy": "no-referrer-when-downgrade",
        "body": body,
        "method": "POST",
        "mode": "cors"
    });
	return data;
}

chrome.storage.onChanged.addListener(function(changes, namespace) {
        for (var key in changes) {
			chrome.storage.local.get(['obligationsCountFixed'], function(items) {
				if (changes.obligationsCount !== undefined) {
					let progress = Math.ceil(100 - (changes.obligationsCount.newValue  - 1) / items.obligationsCountFixed * 100)
					waitingDialog.progress(progress, 100);
				}
			})
		}
})

 
function batchRequests(obdata, fulldata, obStatus) {
    return new Promise(function(resolve, reject) {
        //the summ of all arguments is over 60k...
        var results = [];

        var index = 0;
        function next() {
            if (index < obdata.length) {
				Promise.all(obdata[index++].map(ob => {return submitToWDP(ob, fulldata, obStatus)})).then(function(data) {
                    results.push(data);
                    setTimeout(function() {next()}, 1000);
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

	apiUrl = location.hostname === "uat.wdp.vic.gov.au" ? "uatapi" : "api";

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
	jsonData.externalEnforcementAgenciesObligations.map(ob => {infringementNumbers.push(ob.infringementNumber)});
	return infringementNumbers
}

function fetchResource(input, init) {
	return new Promise((resolve, reject) => {
	  chrome.runtime.sendMessage({input, init}, messageResponse => {
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