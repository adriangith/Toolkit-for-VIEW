uploadControl = document.getElementById('ctl00_mainContentPlaceHolder_documentImportFileUpload')
	uploadControl.onchange = function() {
	document.getElementById('ctl00_mainContentPlaceHolder_lstApplicationModule').value = "Debtors"
	function Matches(value){
		return uploadControl.value.indexOf(value) !== -1;
	}

	let type = [
		"East Gippsland Shire Council", 
		"City of Melbourne", 
		"Victoria Police Toll Enforcement", 
		"Victoria Police", 
		"City of Darebin", 
		"Public Transport Regulatory Operations", 
		'City of Moreland',
		'Traffic Camera Office',
		"City of Ballarat",
		"City of Stonnington",
		"Hobsons Bay City Council",
		"City of Port Phillip",
		"Victorian Electoral Commission",
		"City of Greater Geelong",
		"Glen Eira City Council",
		"Manningham City Council"
	].find(Matches);
	
	if (type !== undefined) {
		type = type.toString()
		
	}

	type = type === "East Gippsland Shire Council" ? "EastGpslnd - " 
		: type === "City of Melbourne" ? "Melbourne - " 
		: type === "Victoria Police" ? "VicPol - "
		: type === 'Victoria Police Toll Enforcement' ? "VicPolToll - "
		: type === 'City of Darebin' ? "Darebin - "
		: type === "Public Transport Regulatory Operations" ? "PTRO - "
		: type === "City of Moreland" ? "Moreland - "
		: type === "Traffic Camera Office" ? "TCO - "
		: type === "City of Ballarat" ? "Ballarat - "
		: type === "City of Stonnington" ? "Stonningtn - "
		: type === "City of Port Phillip" ? "PortPhllp - "
		: type === "City of Greater Geelong" ? "Geelong - "
		: type === "Monash City Council" ? "Monash - "
		: type === "Victorian Electoral Commission" ? "VEC - "
		: type === "Glen Eira City Council" ? "GlenEira - "
		: type === "Manningham City Council" ? "Manningham - "
		: type === "Whitehorse City Council" ? "Whitehorse - "
		: type === "Hobsons Bay City Council" ? "HobsonsBay - " : "ER Special - ";
		
	let outcome = [
		"Confirmed", 
		"Cancelled", 
		"Refused", 
		"Granted", 
		"Wrong person applying. No grounds", 
		"Paid in full. Ineligible", 
		'Outside Person Unaware. Ineligible',
		'Offences n/e Person Unaware. No grounds',
		"Offence Type Ineligible",
		"No Grounds"
	].filter(Matches).toString();

	outcome = outcome === "Wrong person applying. No grounds" ? "Ineligible Grounds" 
		: outcome === "No Grounds" ? "Ineligible Grounds" 
		: outcome === "Paid in full. Ineligible" ? "Ineligible Paid"
		: outcome === 'Outside Person Unaware. Ineligible' ? "Ineligible PU"
		: outcome === 'Offences n/e Person Unaware. No grounds' ? "Ineligible PU"
		: outcome === "Offence Type Ineligible" ? "Ineligible OT"
		: outcome === "Granted" ? "Fee Removal - Granted"
		: outcome === "Refused" ? "Fee Removal - Refused"
		: outcome === "Confirmed" ? "Confirmed"
		: outcome === "Cancelled" ? "Cancelled"
		: outcome === "Confirmed, Granted" ? "Confirmed CV" : outcome;
		
	obligations = uploadControl.value.match(/[0-9]+/)[0]
	obligations = obligations.length > 4 ? " OBL " + obligations : " x " + obligations;

	chrome.storage.local.get(["userName"], function(items){
		textArea = document.getElementById('ctl00_mainContentPlaceHolder_documentDescriptionText')
		textArea.value = type + outcome + obligations + " - " + items.userName
	});
}