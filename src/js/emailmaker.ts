import marked from 'marked';
import { letterDataProps } from './letter-logic';

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

export async function emailMaker(data: Partial<letterDataProps>, parameters: [string, keyof typeof templateMap, ...unknown[]]) {


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
	const result = template.split('----boundary_text_string');
	marked.setOptions({ 'breaks': true, "gfm": true });
	result[1] = await marked.parse(result[1]);
	template = result.join('----boundary_text_string \n');
	template = template.replace('<p>Content-Type: text/html</p>', 'Content-Type: text/html \n');
	downloadEmail(template, parameters, data);
}

export { };

declare global {
	interface Date {
		addDays(days: number): Date;
	}
}

Date.prototype.addDays = function (days: number) {
	const date = new Date(this.valueOf());
	date.setDate(date.getDate() + days);
	return date;
}

export function getDates() {
	const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	const todayDate = new Date();
	const dd = String(todayDate.getDate()).padStart(2, '0');
	const mm = monthNames[todayDate.getMonth()];
	const yyyy = todayDate.getFullYear();
	const today: string = dd + ' ' + mm + ' ' + yyyy;
	const todayplus28 = new Date().addDays(28);
	const dd28 = String(todayplus28.getDate()).padStart(2, '0');
	const mm28 = monthNames[todayplus28.getMonth()];
	const yyyy28 = todayplus28.getFullYear();
	const todayplus21 = new Date().addDays(21);
	const dd21 = String(todayplus21.getDate()).padStart(2, '0');
	const mm21 = monthNames[todayplus21.getMonth()];
	const yyyy21 = todayplus21.getFullYear();
	const todayplus14 = new Date().addDays(14);
	const dd14 = String(todayplus14.getDate()).padStart(2, '0');
	const mm14 = monthNames[todayplus14.getMonth()];
	const yyyy14 = todayplus14.getFullYear();
	return { "today": today, "todayplus14": dd14 + ' ' + mm14 + ' ' + yyyy14, "todayplus28": dd28 + ' ' + mm28 + ' ' + yyyy28, "todayplus21": dd21 + ' ' + mm21 + ' ' + yyyy21 };
}

function downloadEmail(emlContent: string, parameters: [string, "Report Needed" | "MOU" | "Unable to Contact Applicant" | "FVS Further Information Required" | "Further Information Required", ...unknown[]] | string[], data: { today?: string; todayplus14?: string; emailTo?: string; EmailAddress?: undefined; First_Name?: string; Last_Name?: string; enforcename?: string; }) {
	let encodedUri = encodeURI(emlContent); //encode spaces etc like a url
	encodedUri = encodedUri.replace(/#/g, '%23')
	const a = document.createElement('a'); //make a link in document
	const linkText = document.createTextNode("fileLink");
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