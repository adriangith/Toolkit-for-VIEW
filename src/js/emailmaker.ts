import Sqrl from 'squirrelly'
import marked from 'marked';

const templateMap = {
	'Report Needed': 'https://trimapi.justice.vic.gov.au/record/13724486/File/document2',
	'MOU': {
		'Agency FR Granted': 'https://trimapi.justice.vic.gov.au/record/21673543/File/document2',
		'default': 'https://trimapi.justice.vic.gov.au/record/13733834/File/document2'
	},
	'Unable to Contact Applicant': 'https://trimapi.justice.vic.gov.au/record/13735474/File/document2',
	'FVS Further Information Required': 'https://trimapi.justice.vic.gov.au/record/15111431/File/document2',
	'Further Information Required': 'https://trimapi.justice.vic.gov.au/record/15111431/File/document2'
};

export async function emailMaker(data: { today: string; todayplus14: string; emailTo: any; EmailAddress: undefined; }, parameters: [any, keyof typeof templateMap, ...any[]]) {


	let templateUrl;
	if (parameters[1] === 'MOU') {
		templateUrl = parameters[2] === 'Agency FR Granted' ?
			templateMap.MOU['Agency FR Granted'] :
			templateMap.MOU.default;
	} else {
		templateUrl = templateMap[parameters[1]];
	}

	const res = await fetch(templateUrl);

	let template = await res.text();
	data.today = getDates().today
	data.todayplus14 = getDates().todayplus14
	data.emailTo = data.EmailAddress !== undefined ? data.EmailAddress : "None";
	let result = template.split('----boundary_text_string');
	marked.setOptions({ 'breaks': true, "gfm": true });
	result[1] = await marked.parse(result[1]);
	template = result.join('----boundary_text_string \n');
	template = template.replace('<p>Content-Type: text/html</p>', 'Content-Type: text/html \n');
	downloadEmail(template, parameters, data);
}

function readFileAsync(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		let reader = new FileReader();

		reader.onload = () => {
			resolve(reader.result as string); // Type assertion here
		};

		reader.onerror = reject;

		reader.readAsDataURL(blob);
	});
}
/* 
Sqrl.helpers.define('addAttachment', async function (str) {
	let out: string
	let res = await fetch('https://trimapi.justice.vic.gov.au/record/' + str.params[0] + '/File/document2');
	let blob = await res.blob();

	out = await readFileAsync(blob);
	out = out.replace('data:application/octet-stream;base64,', '')
	return out
}) */

export { };

declare global {
	interface Date {
		addDays(days: number): Date;
	}
}

Date.prototype.addDays = function (days: number) {
	var date = new Date(this.valueOf());
	date.setDate(date.getDate() + days);
	return date;
}

export function getDates() {
	var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	const todayDate = new Date();
	var dd = String(todayDate.getDate()).padStart(2, '0');
	var mm = monthNames[todayDate.getMonth()];
	var yyyy = todayDate.getFullYear();
	var today: string = dd + ' ' + mm + ' ' + yyyy;
	var todayplus28 = new Date().addDays(28);
	var dd28 = String(todayplus28.getDate()).padStart(2, '0');
	var mm28 = monthNames[todayplus28.getMonth()];
	var yyyy28 = todayplus28.getFullYear();
	var todayplus21 = new Date().addDays(21);
	var dd21 = String(todayplus21.getDate()).padStart(2, '0');
	var mm21 = monthNames[todayplus21.getMonth()];
	var yyyy21 = todayplus21.getFullYear();
	var todayplus14 = new Date().addDays(14);
	var dd14 = String(todayplus14.getDate()).padStart(2, '0');
	var mm14 = monthNames[todayplus14.getMonth()];
	var yyyy14 = todayplus14.getFullYear();
	return { "today": today, "todayplus14": dd14 + ' ' + mm14 + ' ' + yyyy14, "todayplus28": dd28 + ' ' + mm28 + ' ' + yyyy28, "todayplus21": dd21 + ' ' + mm21 + ' ' + yyyy21 };
}

function downloadEmail(emlContent: string, parameters: [any, "Report Needed" | "MOU" | "Unable to Contact Applicant" | "FVS Further Information Required" | "Further Information Required", ...any[]] | string[], data: { today?: string; todayplus14?: string; emailTo?: any; EmailAddress?: undefined; First_Name?: any; Last_Name?: any; enforcename?: any; }) {
	var encodedUri = encodeURI(emlContent); //encode spaces etc like a url
	encodedUri = encodedUri.replace(/#/g, '%23')
	var a = document.createElement('a'); //make a link in document
	var linkText = document.createTextNode("fileLink");
	a.appendChild(linkText);
	a.href = encodedUri;
	a.id = 'fileLink';
	if (parameters[1] !== 'MOU') {
		a.download = data.First_Name + " " + data.Last_Name + ' - ' + parameters[1] + '.eml';
	} else {
		a.download = data.First_Name + " " + data.Last_Name + ' - ' + data.enforcename + '.eml';
	}
	a.style = "display:none;"; //hidden link
	document.body.appendChild(a);
	const fileLink = document.getElementById('fileLink');
	if (fileLink) {
		fileLink.click(); //click the link
	}
	a.remove();
}