var storedData = [];
var time = 0;

var bankruptcyLink = document.createElement('tr');
bankruptcyLink.innerHTML  =	`<td class="leftmenufirstcol">&nbsp; </td> 
                				 <td class="leftmenumiddlecol"> 
                   				 	<img src="https://${window.location.host.split(".")[0]}.view.civicacloud.com.au/Common/Images/BulletPnt.gif">&nbsp;<a href="${chrome.runtime.getURL("bankruptcy/bankruptcy.html")}"	 accesskey="i" style="VERTICAL-ALIGN: top" target="">Bankruptcy</a></td>
								   <td class="leftmenulastcol">&nbsp; </td>`
					
bankruptcyLink.querySelector("td > a").addEventListener("mouseup", sendURL)

function sendURL() {
	chrome.runtime.sendMessage({URLHost: window.location.host.split(".")[0]}, function(response) {
		console.log(response);
	  });
}
    
var sibling = document.querySelector("#dvInformation > table > tbody").children.item(9);
document.querySelector("#dvInformation > table > tbody").insertBefore(bankruptcyLink, sibling.nextSibling);

var decisionMakerCol1 = document.createElement('tr');
decisionMakerCol1.innerHTML  =	`<tr>
                            <td class="table-label-column">
                                <img id="appButton" src="${chrome.runtime.getURL("Images/applicationOptions.png")}" style="float:right">
                            </td>
                            <td class="table-value-column"><div id="myItem1" data-preset="stripe"></div>
                            </td>
                            <td class="table-label-column">
                                <span id="DebtorDetailsCtrl_lblNominationCount" class="label-text">Nomination count:</span>
                            </td>
                            <td class="table-value-column">
                                <span id="DebtorDetailsCtrl_nominationCountTxt" class="label-text-value">2</span>
                            </td>
                        </tr>
							`
							

var sibling2 = document.querySelector("#DebtorDetailsCtrl_debtorDetailsPanel > table > tbody").children.item(7)							
document.querySelector("#DebtorDetailsCtrl_debtorDetailsPanel > table > tbody").insertBefore(decisionMakerCol1, sibling2.nextSibling);


var formPopup = document.createElement('div');
formPopup.setAttribute("id", "myForm");
formPopup.setAttribute("class", "form-popup");



formPopup.innerHTML  = `
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


  var referenceNode = document.querySelector('#DebtorInfo');
  if (referenceNode === null) {
  referenceNode = document.querySelector('#DebtorDetailsInfo');}
  referenceNode.after(formPopup);
  
  chrome.storage.local.get(['formPopupStatus'], function(items) {
	  formPopup.style.display = items.formPopupStatus
	})

  document.getElementById('appButton').addEventListener("click", function(){
	toggleForm()
	chrome.storage.local.set({'formPopupStatus': formPopup.style.display});
});

document.getElementById('sub').addEventListener("click", function(){
	closeForm()
	chrome.storage.local.set({'formPopupStatus': formPopup.style.display});
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
  
  chrome.storage.local.get(['value'], function(items) {
	  if (Object.entries(items).length !== 0) {
		  storedData = items.value
		  for(item in items.value) {
			var debtorId = document.querySelector('html > head > title').textContent;
			debtorId = debtorId.match(/Civica Debtors (.*)/)[1];
		  if (debtorId === items.value[item][0]) {	
			fill(items.value[item])
			break;
		  } else {
			  if (items.value.length - 1 === parseInt(item)) {defaults()}
			  
		  }
		
		  }} else {
			  defaults()
		  }
		  
		  });
	  
function fill(value) {
		  
	  document.getElementById('3PA').checked = value[1];
	  var inputs = document.getElementsByClassName('textbox x')
	  for (input in inputs) {
		if (value[1] ===  true) {
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
	hide()  
	  }
	  
function defaults() {
	document.getElementById('3PA').checked = false;
	 var inputs = document.getElementsByClassName('textbox x')
	 for (input in inputs) {
		  inputs[input].disabled = true;
	  
	}
}

var s = document.createElement('script');
s.src = chrome.runtime.getURL('js/helper.js');
//s = s.outerHTML

//document.body.insertAdjacentHTML('beforeend', s);


	(document.head || document.documentElement).appendChild(s);
	
	window.addEventListener('beforeunload', (event) => {
		saveIT()	
	});
	
function saveIT () {
	var value = []
	var debtorId = document.querySelector('html > head > title').textContent;
			debtorId = debtorId.match(/Civica Debtors (.*)/)[1];
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
		if(value[0] === storedData[array][0]) {
			storedData[array] = value;
			break;
		} else {

			if (storedData.length - 1 === parseInt(array)) {console.log(value); storedData.push(value)}
		}
	} 
	

	chrome.storage.local.set({'value': storedData});
}

function pushToArray(arr, obj) {
    const index = arr.findIndex((e) => e.id === obj.id);

    if (index === -1) {
        arr.push(obj);
    } else {
        arr[index] = obj;
    }
}

var bar = new ldBar(document.getElementById("myItem1"));
//bar.set(100);

chrome.storage.onChanged.addListener(function(changes, namespace) {
        for (var key in changes) {
			chrome.storage.local.get(['obligationsCountFixed'], function(items) {
				if (changes.obligationsCount !== undefined) {
					bar.set(Math.ceil(100 - (changes.obligationsCount.newValue  - 1) / items.obligationsCountFixed * 100));
				}
				
				if (changes.obligationsCount !== undefined && changes.obligationsCount.newValue > 1) {
					document.getElementById("tableButton").disabled = true;
					document.getElementById("letterButton").disabled = true;
				} else {
					document.getElementById("tableButton").disabled = false;
					document.getElementById("letterButton").disabled = false;
				}
				
			})
			
          var storageChange = changes[key];
        }
		
      });
	  
	  document.getElementById('radioGroup').addEventListener('click', function() {
	hide()
}) 

function hide() {
	let Alt3rdParty = document.getElementById('Alt3rdParty')
	let Hidable = document.getElementsByClassName('Hidable')
	if (Alt3rdParty.checked === true) {
		for(let row of Hidable) {
			row.style.display = ""
		}		
	} else {
		for(let row of Hidable) {
			row.style.display = "none"
		}
	}
}

document.getElementById('3PA').addEventListener("click", function(){

	let to3rdParty = document.getElementById('to3rdParty')
	let toTheDebtor = document.getElementById('toTheDebtor')
	let Alt3rdParty = document.getElementById('Alt3rdParty')
	
		
	
	if (to3rdParty.checked === false && toTheDebtor.checked === false & Alt3rdParty.checked === false){
		to3rdParty.checked = true				
	}
});