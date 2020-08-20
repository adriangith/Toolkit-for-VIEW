/////Helper functions/////////////////////////////////////////////////////////////////////////////////

function toggle(source) {
	checkboxes = document.getElementsByName('boxes');
	for (var checkbox in checkboxes)
		checkboxes[checkbox].checked = source.checked;
}

async function selectEnforcementReview() {
	let table = document.querySelector("#DebtorNoticesCtrl_DebtorNoticesTable_tblData > tbody");
	let tableRows = table.childNodes;
	for (let row = 1; row < tableRows.length - 1; row++) {
		let cells = tableRows[row].childNodes;
		let contraventionCodeCell, noticeStatusCell, noticeNumberCell, balanceOutstandingCell, CurrentChallengeLoggedCell;
		for (let cell = 2; cell < cells.length - 2; cell++) {
			if (cells[cell].id.includes("CurrentChallengeLogged")) { CurrentChallengeLoggedCell = cells[cell] }
		}

		//Make sure all rows are unchecked
		cells[1].querySelector('input').checked = false;

		//Checks all enforcement review challenge logged.
		if (CurrentChallengeLoggedCell.textContent.includes("Enforcement Review")) {
			cells[1].querySelector('input').checked = true;
		}
	}
}

function compare(txtValue, cells, trd) {
	for (j = 1; j < trd.length - 1; j++) {
		let tdd = trd[j].childNodes;
		let celld = tdd[2];
		let txtValued = celld.innerText;
		if (txtValue === txtValued) {
			cells[1].querySelector('input').checked = true;
		}
	}
}

async function selectApplicable() {
	let table = document.querySelector("#DebtorNoticesCtrl_DebtorNoticesTable_tblData > tbody");
	let tableRows = table.childNodes;

	enforcementActionableStatuses = ["WARRNT", "NFDP", "SELNFD"];
	ESIOffences = ["2095", "1992", "1999", "1996", "1929", "1930", "1931", "1932", "1933", "1934", "1949", "1950", "1951", "1952", "1953", "1954", "0000"]

	//Iterate table rows
	for (let row = 1; row < tableRows.length - 1; row++) {
		let cells = tableRows[row].childNodes;
		let contraventionCodeCell, noticeStatusCell, noticeNumberCell, balanceOutstandingCell, CurrentChallengeLoggedCell;
		for (let cell = 2; cell < cells.length - 2; cell++) {
			if (cells[cell].id.includes("CellDataContraventionCode")) { contraventionCodeCell = cells[cell] }
			else if (cells[cell].id.includes("CellDataNoticeStatus")) { noticeStatusCell = cells[cell] }
			else if (cells[cell].id.includes("CurrentChallengeLogged")) { CurrentChallengeLoggedCell = cells[cell] }
			else if (cells[cell].id.includes("CellDataNoticeNumber")) { noticeNumberCell = cells[cell] }
			else if (cells[cell].id.includes("CellDataBalanceOutstanding")) { balanceOutstandingCell = cells[cell] }
		}

		//Make sure all rows are unchecked
		cells[1].querySelector('input').checked = false;

		//Checks all enforcement review challenge logged.
		if (CurrentChallengeLoggedCell.textContent.includes("Enforcement Review")) {
			cells[1].querySelector('input').checked = true;
		}

		//Checks all actionable statuses.
		for (let Status in enforcementActionableStatuses) {
			if (noticeStatusCell.textContent.indexOf(enforcementActionableStatuses[Status]) > -1) {
				cells[1].querySelector('input').checked = true;
			}
		}

		//Uncheck all ineligible offenses.
		for (let offence in ESIOffences) {
			if (contraventionCodeCell.textContent.indexOf(ESIOffences[offence]) > -1) {
				cells[1].querySelector('input').checked = false;
			}
		}

		//Uncheck offences that have a balance of $0 or less. Sometimes the offence status is not updated correctly in VIEW.
		if (Number(balanceOutstandingCell.textContent.replace(/[^0-9.-]+/g, "")) <= 0) {
			cells[1].querySelector('input').checked = false;
		}
	}
}



async function getReviewDecisionTable() {
	let reviewPage = await fetch('https://' + window.location.host.split(".")[0] + '.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorDecisionReview.aspx')
	reviewPage = await reviewPage.text()
	reviewPage = $($.parseHTML(reviewPage))


	let d = reviewPage.find("#DebtorDecisionCtrl_dropdownReviewType")
	if (d[0].value !== 2) {
		let theForm = reviewPage.filter('form')[0]
		let outData = new URLSearchParams();
		for (const pair of new FormData(theForm)) {
			outData.append(pair[0], pair[1]);
		}
		outData.set("DebtorDecisionCtrl$dropdownReviewType", 2)
		outData.set("__EVENTTARGET", "DebtorDecisionCtrl$dropdownReviewType")
		reviewPage = await fetch("https://" + window.location.host.split(".")[0] + ".view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorDecisionReview.aspx", {
			method: 'POST',
			body: outData
		});
		reviewPage = await reviewPage.text()
		reviewPage = $($.parseHTML(reviewPage))
	}

	let decisiontable = reviewPage.find('#DebtorDecisionCtrl_DebtorNoticesTable_tblData > tbody');
	return decisiontable[0].childNodes
}




function switcher(inputs, that) {
	for (var i = 0; i < inputs.length; i++) {
		inputs[i].disabled = !that.checked;
	}
}
