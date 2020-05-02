/////Config Objects and Variables/////////////////////////////////////////////////////////////////////////////
let optionChain = []

/////Script Launcher///////////////////////////////////////////////////////////////////////////////

addCheckboxes();
addElements();


/////Input creation functions/////////////////////////////////////////////////////////////////////////////////

function generateButton(button, dropDown) {
	//Adds buttons for data extraction.
	
	if (button.image !== undefined) {
		button.element = document.createElement("input")
		button.element.setAttribute('type', 'image');
		button.element.setAttribute('onclick', "return false");
		button.element.style.paddingBottom = '0px';
		button.element.style.paddingLeft = button.paddingLeft !== undefined ? button.paddingLeft : '0px';
		button.element.setAttribute('src', chrome.runtime.getURL("Images/" + button.image))
	} else {
		button.element = document.createElement("button")
		button.element.innerHTML = button.description;
		button.element.setAttribute('type', 'button');
	}

	button.element.setAttribute('id', button.name);

	document.getElementById("NoticesDataGrid").appendChild(button.element);
		if (button.name !== "letterButton") {
			button.element.addEventListener('click', function(){exportData(button.description)});
		} else {
			document.getElementById("NoticesDataGrid").appendChild(dropDown);
			button.element.addEventListener('click', function(){exportData(dropDown.value)});
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
    //Button properties
    var buttons = [
		{name: "tableButton", description: "Export obligations", image: "xlxs.png", paddingLeft: "6px"},
		{name: "tableSettings", description: "Table settings", image: "options.png"},
    	{name: "letterButton", description: "Generate letter(s)"},
		{name: "holdButton", description: "Bulk Notes Update"},
		{name: "holdButton", description: "Bulk Hold Update"}//,
	//	{name: "FeeButton", description: "Bulk Fee Waive"}
    ];
    buttons.map(button => generateButton(button, dropDown));
     
    var options = [
    	{description: "Enforcement Confirmed"},
    	{description: "Enforcement Cancelled"},
    	{description: "Fee Removal Refused"},
    	{description: "Fee Removal Granted"},
		{description: "Fee Removal / Confirmed"},
		{description: "Offence Type Ineligible"},
    	{description: "Wrong person applying. No grounds"},
    	{description: "Paid in full. Ineligible"},
    	{description: "Nomination. No grounds"},
		{description: "Outside Person Unaware. Ineligible"},
		{description: "Offence n/e Person Unaware. No grounds"},
		{description: "Report Needed"},
		{description: "No Grounds"},
		{description: "Unable to Contact Applicant"}
    ];
    options.map(option => generateOption(option, dropDown));
	
	let auditCheck = document.createElement('input')
	auditCheck.setAttribute('type', 'checkbox');
	auditCheck.setAttribute('id', 'auditCheck');
	var auditCheckLabel = document.createElement('label'); 
	auditCheckLabel.appendChild(document.createTextNode('Parse Audit Trail?')); 
	auditCheckLabel.appendChild(auditCheck);
	//document.getElementById("NoticesDataGrid").appendChild(auditCheckLabel);
	
	
	let email = document.createElement('input')
	email.setAttribute('type', 'checkbox');
	email.setAttribute('id', 'email');
	var emailCheckLabel = document.createElement('label'); 
	emailCheckLabel.appendChild(document.createTextNode('Send email to applicant?')); 
	emailCheckLabel.appendChild(email);
	document.getElementById("NoticesDataGrid").appendChild(emailCheckLabel);
	
	let ObSelector = '\
	<tr> \
        <td style="padding: 6px; padding-bottom:0px"> \
			<input type="image" name="DebtorDecisionCtrl$selectAllButton" id="DebtorDecisionCtrl_selectAllButton" tabindex="42" src="' + chrome.runtime.getURL('Images/selectApplicable.png') +'" onclick="selectApplicable(); return false" > \
			<input style="float:left" type="image" name="DebtorDecisionCtrl$selectAllButton" id="DebtorDecisionCtrl_selectAllButton" tabindex="42" src="' + chrome.runtime.getURL('Images/selectenfreview.png') +'" onclick="selectEnforcementReview(); return false" > \
		</td> \
    </tr>'
	

	document.querySelector("#NoticesDataGrid > tbody").insertAdjacentHTML( 'afterbegin', ObSelector );



		
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

function exportData(value) {
	let obligationArray = captureObligationNumbers()
//	let PAT = document.getElementById('auditCheck').checked;
	PAT = false
	//email = false
	let email = document.getElementById('email').checked;
	if (obligationArray.length > 0) {
		let data = [obligationArray, value, null, PAT, email, window.location.host.split(".")[0]]
		saveIT()

		chrome.runtime.sendMessage(data, function(response) {
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



















