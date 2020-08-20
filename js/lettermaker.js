var agencies = {}
fetch('https://trimapi.justice.vic.gov.au/record/12965363/File/document2')
	.then(response => {
		return response.json()
	})
	.then(data => {
		// Work with JSON data here
		agencies = data.addresses;
	})
	.catch(err => {
		// Do something for an error here
	})

let agencyEnforcement;
let agencyFee;

async function letterSelector(grabbed, obligations) {

	grabbed.Challenge = await grabbed.a[0].Challenge;
	generateLetter(await grabbed, obligations[1]);
	grabbed.Town2 = toTitleCase(grabbed.Town)
	grabbed.State2 = toTitleCase(grabbed.State)
	if (obligations[1] === 'Enforcement Cancelled') {
		generateAgencyLetters('Cancelled', grabbed);
	} else if (obligations[1] === 'Fee Removal Granted' || obligations[1] === 'Fee Removal / Confirmed') {
		generateAgencyLetters('FeeGranted', grabbed);
	}
}

async function generateAgencyLetters(letterType, grabbed) {
	let location = "https://trimapi.justice.vic.gov.au/record/";
	let downCode = "/File/document2";

	switch (letterType) {
		case 'Cancelled':
			var url = location + '12918371' + downCode;
			agencyEnforcement = await loadLetter(url);
			var letterTemplate = agencyEnforcement;   
			break;
		case 'FeeGranted':
			var url = location + '12918361' + downCode;
			agencyEnforcement = await loadLetter(url);
			var letterTemplate = agencyEnforcement;   
			break;
	}

	var o = groupBy(grabbed.a, 'Agency');
	for (item in o) {
		GAB = JSON.parse(JSON.stringify(grabbed));
		GAB.a = o[item];
		GAB.Challenge = GAB.a[0].Challenge;
		GAB.enforcename = GAB.a[0].enforcename;
		GAB.Address2 = GAB.a[0].Address2;
		GAB.MOU = GAB.a[0].MOU;
		GAB.Address3 = GAB.a[0].Address3;
		console.log(GAB);
		generateLetter(GAB, letterType, letterTemplate);
		console.log(letterType);
		if (GAB.a[0].EmailAddress !== undefined) { GAB.Email = GAB.a[0].Email; GAB.AgencyEmail = GAB.a[0].EmailAddress };
		if (GAB.Email === true && letterType !== 'FeeGranted') {
			emailMaker(GAB, [GAB.AgencyEmail, 'MOU']);
		}
	}
}

var expressions = require('angular-expressions');

function angularParser(tag) {
	if (tag === '.') {
		return {
			get: function (s) { return s; }
		};
	}
	const expr = expressions.compile(tag.replace(/(’|“|”)/g, "'"));
	return {
		get: function (s) {
			return expr(s);
		}
	};
}

function loadLetter(url) {
	return new Promise((resolve, reject) => {
		JSZipUtils.getBinaryContent(url, function (err, data) {
			if (err) {
				throw err; // or handle err
			}
			data = resolve(data);
			return data;
		});
	});
}

async function generateLetter(letterData, type, letterTemplate) {
	let name;
	let filename = ""
	let location = "https://trimapi.justice.vic.gov.au/record/";
	let downCode = "/File/document2";

	if (letterData.First_Name !== "") {
		name = letterData.First_Name + " " + letterData.Last_Name;
	} else if (letterData.First_Name === "") {
		name = letterData.Company_Name;
	}

	let OBL = ""
	if (letterData.a.length === 1) {
		OBL = " " + letterData.a[0].Obligation;
	} else {
		OBL = " x " + letterData.a.length;
	}

	for (let obligation in letterData.a) {

		function currToNum(strng) {
			let regEx = /[^0-9.-]+/g;
			return Math.abs(parseFloat(strng.replace(regEx, "")));
		}

		let Ob = letterData.a[obligation]

		//Add the fees together to get the total fee amount
		let penaltyPlusRegistrationPlusWarrant = Math.round((currToNum(Ob.Penalty_Reminder_Fee) + currToNum(Ob.Enforcement_Fee) + currToNum(Ob.Registration_Fee) + currToNum(Ob.Warrant_Issue_Fee)) * 100) / 100
		//Remove the penalty reminder fee from the total to get the warrant plus enforcement fees
		let registrationPlusWarrant = Math.round((penaltyPlusRegistrationPlusWarrant - currToNum(Ob.Penalty_Reminder_Fee)) * 100) / 100
		//Warrant
		let warrant = currToNum(Ob.Warrant_Issue_Fee)

		//True if warrant fees are waived. E.g. If the amount removed is equal to the fees except penalty and enforcement fees.
		if (currToNum(Ob.Amount_Waived) === warrant) {
			Ob.isEnforcementFeeRemoved = true;
		}

		//True if warrant and enforcement fees are waived. E.g. If the amount removed is equal to the fees except penalty fee.
		if (currToNum(Ob.Amount_Waived) === registrationPlusWarrant) {
			Ob.isEnforcementFeeRemoved = true;
		}

		//True if all fees are waived. E.g. If the amount removed is equal to all fees.
		if (currToNum(Ob.Amount_Waived) === penaltyPlusRegistrationPlusWarrant) {
			Ob.isPenaltyFeeRemoved = true;
			Ob.isEnforcementFeeRemoved = true;
		}
	}

	switch (type) {
		case 'Cancelled':
			filename = name + " - " + letterData.enforcename + " - " + "Cancelled" + OBL
			var url = location + '12918371' + downCode;  
			break;
		case 'FeeGranted':
			filename = name + " - " + letterData.enforcename + " - Fee Removal Granted" + OBL
			var url = location + '12918361' + downCode;
			break;
		case 'Enforcement Confirmed':
			filename = name + " - " + "Confirmed" + OBL
			var url = location + '12918374' + downCode;
			break;
		case 'Fee Removal Refused':
			filename = name + " - " + "Fee Removal Refused" + OBL
			var url = location + '12918365' + downCode;
			break;
		case 'Enforcement Cancelled':
			filename = name + " - " + "Cancelled" + OBL
			var url = location + '12918372' + downCode
			break;
		case 'Nomination. No grounds':
			filename = name + " - " + "Nomination not eligible for Review" + OBL;
			var url = location + '12918370' + downCode;
			letterData.Is_Nomination = true;
			break;
		case 'Fee Removal Granted':
			filename = name + " - " + "Fee Removal Granted Debtor" + OBL;
			var url = location + '12918364' + downCode;
			break;
		case 'Fee Removal / Confirmed':
			filename = name + " - " + "Confirmed Fee Removal Granted Debtor" + OBL;
			var url = location + '12918374' + downCode;
			letterData.ECCV = true;
			break;
		case 'Report Needed':
			filename = name + " - " + "Report Needed" + OBL;
			var url = location + '12918375' + downCode;
			console.log(getDates());
			letterData.todayplus14 = getDates().todayplus14;
			break;
		case 'Wrong person applying. No grounds':
			filename = name + " - " + "Wrong person applying. No grounds" + OBL;
			var url = location + '12918368' + downCode;
			break;
		case 'Paid in full. Ineligible':
			filename = name + " - " + "Paid in full. Ineligible" + OBL;
			var url = location + '12918367' + downCode;
			break;
		case 'Outside Person Unaware. Ineligible':
			filename = name + " - " + "Outside Person Unaware. Ineligible" + OBL;
			var url = location + '12918370' + downCode;
			letterData.Person_unaware_1 = true;
			break;
		case 'Offence n/e Person Unaware. No grounds':
			filename = name + " - " + "Offences not Eligible for Person Unaware. No grounds" + OBL;
			var url = location + '12918370' + downCode
			letterData.Person_unaware_2 = true;
			break;
		case 'Unable to Contact Applicant':
			filename = name + " - " + "Unable to Contact Applicant" + OBL;
			var url = location + '12918377' + downCode
			break;
		case "Offence Type Ineligible":
			filename = name + " - " + "Offence Type Ineligible" + OBL;
			var url = location + '12918370' + downCode
			letterData.Offence_Ineligible = true;
			break;
		case "No Grounds":
			filename = name + " - " + "No Grounds for Review" + OBL;
			var url = location + '12918370' + downCode
			letterData.No_Grounds = true;
			break;

	}


	if(type !== 'FeeGranted' && type !== 'Cancelled') {
		letterTemplate = await loadLetter(url)
	}

	/* Create a letter for each of the objects in letterData */
	const letter = makeLetter(letterData, letterTemplate, filename)


}

function makeLetter(content, letterTemplate, filename) {
	var zip = new JSZip(letterTemplate);
	var doc = new window.Docxtemplater().loadZip(zip)
	doc.setOptions({
		parser: angularParser
	})

	doc.setData(content);
	try {
		// render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
		doc.render()
	}
	catch (error) {
		var e = {
			message: error.message,
			name: error.name,
			stack: error.stack,
			properties: error.properties,
		}
		console.log(JSON.stringify({ error: e }));
		// The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
		throw error;
	}
	var out = doc.getZip().generate({
		type: "blob",
		mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	}) //Output the document using Data-URI 
	saveAs(out, filename + ".docx")
}


var toTitleCaseHypen = function (str) {
	return str.toLowerCase().replace(/(?:^|\s|\/|\-)\w/g, function (match) {
		return match.toUpperCase();
	});
}

function groupBy(arr, property) {
	return arr.reduce(function (memo, x) {
		if (!memo[x[property]]) { memo[x[property]] = []; }
		memo[x[property]].push(x);
		return memo;
	}, {});
}



