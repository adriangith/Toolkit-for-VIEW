var storedData = [];

let pnl3BulkNoteUpdate = document.getElementById('pnl3BulkNoteUpdate');
let pnl3BulkDebtorNoteUpdate = pnl3BulkNoteUpdate.cloneNode(true);
pnl3BulkNoteUpdate.after(pnl3BulkDebtorNoteUpdate);
pnl3BulkDebtorNoteUpdate.id = 'pnl3BulkDebtorNoteUpdate';
let bda = pnl3BulkDebtorNoteUpdate.querySelector('a')
bda.href = "#"
bda.textContent = "Bulk Debtor Notes Update"
bda.addEventListener('mouseup', function () {
	postData(window.location.host.split(".")[0], {"pages": ["debtorBulkNotes"]}, "BulkDebtorNotes")


})

function postData(url, data, validate) {
	chrome.runtime.sendMessage({
		validate: validate,
		data: data,
		url: url
	})
}


var obligationsButton = document.createElement('tr');
obligationsButton.innerHTML = `<td class="leftmenufirstcol">&nbsp; </td> 
                				 <td class="leftmenumiddlecol"> 
                   				 	<img src="https://${window.location.host.split(".")[0]}.view.civicacloud.com.au/Common/Images/BulletPnt.gif">&nbsp;<a href="javascript:ConfirmChangesLose(\'https://${window.location.host.split(".")[0]}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorObligationsSummary.aspx\')" accesskey="i" style="VERTICAL-ALIGN: top" target="">Obligations Summary</a></td>
	  							 <td class="leftmenulastcol">&nbsp; </td>`

var sibling = document.querySelector("#dvInformation > table > tbody").children.item(9);
document.querySelector("#dvInformation > table > tbody").insertBefore(obligationsButton, sibling.nextSibling);

var decisionMakerCol1 = document.createElement('tr');


var decisionMakerCol3 = document.createElement('tr');
decisionMakerCol3.innerHTML = `<td class="tdButtons" colspan="9">
									<input type="image" type="button" name="appButton" id="appButton" tabindex="19" src=${chrome.runtime.getURL("Images/applicationOptions.png")} onClick="return false;">																				
									<input type="image" type="button" name="VRISButton" id="VRISButton" tabindex="19" src=${chrome.runtime.getURL("Images/VRISOptions.png")} onClick="return false;">	
									<input type="image" type="button" name="StatsButton" id="StatsButton" tabindex="19" src=${chrome.runtime.getURL("Images/VicRoadsStats.png")} onClick="return false;">
									<input type="image" type="button" name="UpdateID" id="UpdateID" tabindex="19" src=${chrome.runtime.getURL("Images/UpdateID.png")} onClick="return false;">
								</td>`

var decisionMakerCol2 = document.createElement('tr');
decisionMakerCol2.innerHTML = '<td class="firstcoltop">&nbsp;</td>\
                            <td class="seccoltop"><img src="' + chrome.runtime.getURL("Images/decisionOptions.png") + '" style="float:right">\
                            </td>\
                            <td class="thirdcoltop"></td>\
                            <td class="fourthcoltop">    \
                            <select style="width:130px"><optgroup label="No Grounds"><option>Wrong Person</option><option>Person Unaware</option><option>Nomination</option><option>No Grounds Note</option></optgroup><optgroup label="Ineligible"><option>Paid in Full</option><option>Person Unware</option><option>Ineligible Note</option></optgroup><optgroup label="Special Circumstances"><option>Report Needed</option><option>Specials Note</option></optgroup><optgroup label="General"><option>Information Required</option><option>Address Required</option><option>General Note</option></optgroup><optgroup label="Determination"><option>Create Letter(s)</option><option>Determination Note</option></optgroup><optgroup label="Fee Removal"><option>Hold Update</option></optgroup></select><img src="' + chrome.runtime.getURL("Images/Buttons.svg") + '"  style="float: right"></td>\
                            <td class="thirdcoltop"></td>\
                            <td class="fifthcoltop"></td>\
                            <td class="thirdcoltop"></td>'




var sibling2 = document.querySelector("#tblStandardDisplay > tbody").children.item(10)
document.querySelector("#tblStandardDisplay > tbody").insertBefore(decisionMakerCol3, sibling2.nextSibling);

document.querySelector("#tblStandardDisplay > tbody").children.item(12).remove();
document.querySelector("#tblStandardDisplay > tbody").children.item(12).remove();
//document.querySelector("#tblStandardDisplay > tbody").children.item(11).remove();	



var formPopup = document.createElement('div');
formPopup.setAttribute("id", "myForm");
formPopup.setAttribute("class", "form-popup");

formPopup.innerHTML = `
<table border="0" cellpadding="0" cellspacing="0" class="childTable" width="100%" class="form-container">
	<tbody>
		<tr>
			<td>
				<div id="DebtorAddressPanel" style="display: inline">
					<table cellpadding="0" cellspacing="0" width="100%">
						<tbody>
							<tr>
								<td>
								<tr>
										<td class="menu-header" width="20%">&nbsp; Application Options &nbsp;</td>
										<td>&nbsp;</td>
										</tr>
									<div>
										<table class="bordertable">
											<tbody id="radioGroup">
												<tr>
													<td class="tdRowspace" colspan="9"></td>
												</tr>
												<tr>
													<td class="table-label-column"><span class="label-text">3rd Party Application:</span></td>
													<td class="table-value-column"><input tabindex="60" type="checkbox" id="3PA" onchange="var textboxes = document.getElementsByClassName(\'textbox\'); switcher(textboxes, this)""></td>
													<td class="table-label-column"><span class="label-text">Legal Centre:</span></td>
													<td class="table-value-column"><input tabindex="60" type="checkbox" id="3LC"></td>													
												</tr>
												<tr>
													<td class="table-label-column"><span class="label-text">Contact Name:</span></td>
													<td class="table-value-column"><input type="text" maxlength="100" tabindex="41" class="textbox x" name="name" id="Name"></td>
													<td class="table-label-column"><span class="label-text">Organisation:</span></td>
													<td class="table-value-column">
														<div id="DebtorAddressCtrl_sourceCatalogueField">
															<input type="text" maxlength="100" tabindex="41" class="textbox x" name="org" id="Organisation">
														</div>
													</td>
												</tr>
												<tr>
													<td class="table-label-column"><span class="label-text">Street:</span></td>
													<td class="table-value-column"><input type="text" maxlength="100" tabindex="41" class="textbox x" name="street" id="Street"></td>
													<td class="table-label-column"><span class="label-text">Town:</span></td>
													<td class="table-value-column">
														<div>
															<input type="text" maxlength="100" tabindex="41" class="textbox x" name="town" id="Town">
														</div><span id="DebtorAddressCtrl_startDateToEndDateValidator" style="display:none;"></span>
													</td>
												</tr>
												<tr>
													<td class="table-label-column"><span class="label-text">State:</span></td>
													<td class="table-value-column"><input type="text" maxlength="100" tabindex="41" class="textbox x" name="state" id="State"></td>
													<td class="table-label-column"><span class="label-text">Postcode:</span></td>
													<td class="table-value-column"><input type="text" maxlength="100" tabindex="41" class="textbox x" name="postcode" id="PostCode"></td>
												</tr>
												<tr>
													<td class="table-label-column" style="min-height:8px"><span class="label-text">Address debtor letters:</span></td>													
													<td class="table-value-column" colspan="9" style="min-height:8px"><label><input id="to3rdParty" class="textbox x" name="addressTo" style="vertical-align:middle; height:13px" tabindex="60" type="radio""><span class="label-text">To the 3rd Party</span></label></td>
												</tr>
													 <td class="table-label-column" style="min-height:8px"></td>													
													<td class="table-value-column" colspan="9" style="min-height:8px"><label><input id="toTheDebtor" class="textbox x" name="addressTo" style="vertical-align:middle; height:13px" tabindex="60" type="radio"" ><span class="label-text">To the debtor</span></label></td>													
												</tr>
												<tr style="min-height: 0px">
													 <td class="table-label-column" style="min-height: 0px"></td>													
													<td class="table-value-column" style="min-height: 0px"><label><input id="Alt3rdParty" class="textbox x" name="addressTo" style="vertical-align:middle; height:13px; min-height: 0px" tabindex="60" type="radio""><span class="label-text">To an alternative 3rd Party</span></label></td>														
													<td class="table-label-column" style="min-height: 0px"><span class="label-text Hidable" style="min-height:0px; vertical-align:middle; display:none">Legal Centre:</span></td>
													<td class="table-value-column" style="min-height: 0px"><input class="Hidable" tabindex="60" style="min-height:0px; display:none" type="checkbox" id="Alt3LC"></td>	
												</tr>
												<tr class="Hidable" style="display:none">
													<td class="table-label-column"><span class="label-text">Contact Name:</span></td>
													<td class="table-value-column"><input type="text" maxlength="100" tabindex="41" class="textbox x" name="name" id="AltName"></td>
													<td class="table-label-column"><span class="label-text">Organisation:</span></td>
													<td class="table-value-column">
														<div id="DebtorAddressCtrl_sourceCatalogueField">
															<input type="text" maxlength="100" tabindex="41" class="textbox x" name="org" id="AltOrganisation">
														</div>
													</td>
												</tr>
												<tr class="Hidable" style="display:none">
													<td class="table-label-column"><span class="label-text">Street:</span></td>
													<td class="table-value-column"><input type="text" maxlength="100" tabindex="41" class="textbox x" name="street" id="AltStreet"></td>
													<td class="table-label-column"><span class="label-text">Town:</span></td>
													<td class="table-value-column">
														<div>
															<input type="text" maxlength="100" tabindex="41" class="textbox x" name="town" id="AltTown">
														</div><span id="DebtorAddressCtrl_startDateToEndDateValidator" style="display:none;"></span>
													</td>
												</tr>
												<tr class="Hidable" style="display:none">
													<td class="table-label-column"><span class="label-text">State:</span></td>
													<td class="table-value-column"><input type="text" maxlength="100" tabindex="41" class="textbox x" name="state" id="AltState"></td>
													<td class="table-label-column"><span class="label-text">Postcode:</span></td>
													<td class="table-value-column"><input type="text" maxlength="100" tabindex="41" class="textbox x" name="postcode" id="AltPostCode"></td>
												</tr>
												<tr>
													<td class="tdRowspace" colspan="9"></td>
												</tr>
												<tr>
												<td class="tdButtons" colspan="9">
													<button type="button" class="btn cancel" id="sub">Close</button>
												</td>
												</tr>
											</tbody>
										</table>
									</div>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</td>
		</tr>
	</tbody>
</table>
`


var referenceNode = document.querySelector('form > table > tbody > tr > td > table > tbody > tr > td > table');
referenceNode.after(formPopup);

chrome.storage.local.get(['formPopupStatus'], function (items) {
	formPopup.style.display = items.formPopupStatus
	console.log(formPopup.style.display);
})

document.getElementById('appButton').addEventListener("click", function () {
	toggleForm()
	chrome.storage.local.set({ 'formPopupStatus': formPopup.style.display });
});

document.getElementById('sub').addEventListener("click", function () {
	closeForm()
	chrome.storage.local.set({ 'formPopupStatus': formPopup.style.display });
});

function toggleForm() {
	if (formPopup.style.display === "" || formPopup.style.display === "none") {
		formPopup.style.display = "block";
	} else if (formPopup.style.display === "block") {
		formPopup.style.display = "none";
	}

}

function closeForm() {
	formPopup.style.display = "none";
}



chrome.storage.local.get(['value'], function (items) {
	console.log('Settings retrieved', items);
	if (Object.entries(items).length !== 0) {
		storedData = items.value
		console.log(storedData);
		for (item in items.value) {
			var debtorId = document.querySelector('#NoticeInfo_lblOtherInfo').textContent;
			debtorId = debtorId.match(/Debtor: (.*?)[\s]/)[1];
			if (debtorId === items.value[item][0]) {
				fill(items.value[item])
				break;
			} else {
				if (items.value.length - 1 === parseInt(item)) { defaults() }
			}

		}
	} else {
		defaults()
	}

});

function fill(value) {
	document.getElementById('3PA').checked = value[1];
	var inputs = document.getElementsByClassName('textbox x')
	for (input in inputs) {
		if (value[1] === true) {
			inputs[input].disabled = false;
		} else {
			inputs[input].disabled = true;
		}


	}
	document.getElementById('Name').value = value[2];
	document.getElementById('Organisation').value = value[3];
	document.getElementById('Street').value = value[4];
	document.getElementById('Town').value = value[5];
	document.getElementById('State').value = value[6];
	document.getElementById('PostCode').value = value[7];
	document.getElementById('to3rdParty').checked = value[8];
	document.getElementById('toTheDebtor').checked = value[9];
	document.getElementById('Alt3rdParty').checked = value[10];
	document.getElementById('AltName').value = value[11];
	document.getElementById('AltOrganisation').value = value[12];
	document.getElementById('AltStreet').value = value[13];
	document.getElementById('AltTown').value = value[14];
	document.getElementById('AltState').value = value[15];
	document.getElementById('AltPostCode').value = value[16];
	document.getElementById('3LC').checked = value[17];
	document.getElementById('Alt3LC').checked = value[18];

	if (document.getElementById('Alt3rdParty').checked === true) {
		let Alt3rdParty = document.getElementById('Alt3rdParty')
		let Hidable = document.getElementsByClassName('Hidable')
		if (Alt3rdParty.checked === true) {
			for (let row of Hidable) {
				row.style.display = ""
			}
		} else {
			for (let row of Hidable) {
				row.style.display = "none"
			}
		}
	}

}

function defaults() {
	document.getElementById('3PA').checked = false;
	document.getElementById('to3rdParty').checked = true;
	var inputs = document.getElementsByClassName('textbox x')
	for (input in inputs) {
		inputs[input].disabled = true;

	}
}


var s = document.createElement('script');
s.src = chrome.runtime.getURL('js/helper.js');
(document.head || document.documentElement).appendChild(s);


window.addEventListener('beforeunload', (event) => {
	saveIT()
});

function saveIT() {
	var value = []
	var debtorId = document.querySelector('#NoticeInfo_lblOtherInfo').textContent;
	debtorId = debtorId.match(/Debtor: (.*?)[\s]/)[1];
	value.push(debtorId)
	var box = document.getElementById('3PA')
	value.push(box.checked)
	var classname = document.getElementsByClassName('textbox x')
	for (var i = 0; i < classname.length; i++) {
		if (classname[i].type !== "radio") {
			value.push(classname[i].value);
		} else {
			value.push(classname[i].checked)
		}
	}

	var LC = document.getElementById('3LC')
	value.push(LC.checked)
	var Alt3LC = document.getElementById('Alt3LC')
	value.push(Alt3LC.checked)

	if (storedData.length === 0) {
		storedData.push(value);
	}
	for (array in storedData) {
		if (value[0] === storedData[array][0]) {
			storedData[array] = value;
			break;
		} else {
			console.log(storedData.length);
			console.log(array);
			if (storedData.length - 1 === parseInt(array)) { console.log(value); storedData.push(value) }
		}
	}


	chrome.storage.local.set({ 'value': storedData });
}

function pushToArray(arr, obj) {
	const index = arr.findIndex((e) => e.id === obj.id);

	if (index === -1) {
		arr.push(obj);
	} else {
		arr[index] = obj;
	}
}

chrome.storage.onChanged.addListener(function (changes, namespace) {
	for (var key in changes) {
		var storageChange = changes[key];
		console.log('Storage key "%s" in namespace "%s" changed. ' +
			'Old value was "%s", new value is "%s".',
			key,
			namespace,
			storageChange.oldValue,
			storageChange.newValue);
	}
});

document.getElementById('VRISButton').addEventListener('click', function () {
	let Requestor
	let ID
	let Reason
	chrome.storage.local.get(['Requestor', 'ID'], function (result) {
		console.log(result);
		if (result.Requestor === undefined) {
			Requestor = prompt('What is your name?')
			chrome.storage.local.set({ 'Requestor': Requestor })
			ID = prompt('What is you user id?', 'Both VRIS/DLS seperated by a "/"')
			chrome.storage.local.set({ 'ID': ID })
		} else {
			Requestor = result.Requestor
			ID = result.ID

		}
		Reason = prompt('What is the reason for accessing VicRoads records?', 'A, N, O, S or X')
		chrome.runtime.sendMessage([Requestor, ID, Reason, "lookup"], function () { });
		alert('You have added a new record to the VicRoads / DLS Record Sheet. Click VicRoads stats to download the records sheet.');
	});
})

document.getElementById('StatsButton').addEventListener('click', function () {
	chrome.runtime.sendMessage([, , , "stats"], function () { });
})

document.getElementById('UpdateID').addEventListener('click', function () {
	let Requestor
	let ID
	let Reason
	chrome.storage.local.get(['Requestor', 'ID'], function (result) {
		Requestor = prompt('What is your name?', result.Requestor !== undefined ? result.Requestor : "")
		chrome.storage.local.set({ 'Requestor': Requestor })
		ID = prompt('What is you user id?', result.ID !== undefined ? result.ID : "")
		chrome.storage.local.set({ 'ID': ID })
		alert('The Requestor Name and ID have been updated');
	});
})

document.getElementById('radioGroup').addEventListener('click', function () {
	let Alt3rdParty = document.getElementById('Alt3rdParty')
	let Hidable = document.getElementsByClassName('Hidable')
	if (Alt3rdParty.checked === true) {
		for (let row of Hidable) {
			row.style.display = ""
		}
	} else {
		for (let row of Hidable) {
			row.style.display = "none"
		}
	}
})

/* chrome.storage.local.get(['records'], function(result) {
	let array = []
	for (sheet in result.records.sheet){
		for (record in result.records.sheet[sheet]) {
			for (item in result.records.sheet[sheet][record]) {
				let secondArray = []
				for (key in result.records.sheet[sheet][record][item]) {

					secondArray.push(result.records.sheet[sheet][record][item][key])
				}
				array.push(secondArray)

			}

		}
	}
	array.unshift(["NO.", "Date", "Registration/ Licence Number", "Obligation Number/Debtor Id", "Requestor Name", "User Id", "Reason"])
	const editor = new EditorJS({

	 holder: 'myForm',
	 tools: {
		table: {
			class: Table,
			inlineToolbar: false
		}
	 },
	 data: {
		"blocks": [{
			"type" : "table",
			"data" : {
				"content" : array
			}
		}]
	 }
});




})
	 */



