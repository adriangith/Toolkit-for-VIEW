async function emailMaker(data, parameters) {
let res;

	if (parameters[1] === 'Report Needed') {
		res = await fetch('https://trimapi.justice.vic.gov.au/record/13724486/File/document2');
	}

	if (parameters[1] === 'MOU') {
		if (parameters[2] === 'Agency FR Granted') {
			res = await fetch('https://trimapi.justice.vic.gov.au/record/21673543/File/document2')
		} else {
			res = await fetch('https://trimapi.justice.vic.gov.au/record/13733834/File/document2');
		}
	}

	if (parameters[1] === 'Unable to Contact Applicant') {
		res = await fetch('https://trimapi.justice.vic.gov.au/record/13735474/File/document2');
	}

	if (parameters[1] === 'FVS Further Information Required') {
		res = await fetch('https://trimapi.justice.vic.gov.au/record/15111431/File/document2');
	}

	if (parameters[1] === 'Further Information Required') {
		res = await fetch('https://trimapi.justice.vic.gov.au/record/15111431/File/document2');
	}

		let template = await res.text();
		data.today = getDates().today
		data.todayplus14 = getDates().todayplus14
		data.emailTo = data.EmailAddress !== undefined ? data.EmailAddress : "None";
		var result =  await Sqrl.render(template, data, { async: true, asyncHelpers: ['addAttachment'] })
		result = result.split('----boundary_text_string');
		marked.setOptions({'breaks': true, "gfm": true});
		result[1] = marked(result[1]);
		result = result.join('----boundary_text_string \n');
		result = result.replace('<p>Content-Type: text/html</p>', 'Content-Type: text/html \n');
		downloadEmail(result, parameters, data);
}

function readFileAsync(blob) {
	return new Promise((resolve, reject) => {
	  let reader = new FileReader();
  
	  reader.onload = () => {
		resolve(reader.result);
	  };
  
	  reader.onerror = reject;
  
	  reader.readAsDataURL(blob);
	})
  }
 
Sqrl.helpers.define('addAttachment', async function(str) {
	let out;
	let res = await fetch('https://trimapi.justice.vic.gov.au/record/' + str.params[0] + '/File/document2');
	let blob = await res.blob();

	out = await readFileAsync(blob);
	out = out.replace('data:application/octet-stream;base64,', '')
  return out
})

Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

function getDates() {
	var monthNames = ["January", "February", "March", "April", "May","June","July", "August", "September", "October", "November","December"];
	var today = new Date();
	var dd = String(today.getDate()).padStart(2, '0');
	var mm = monthNames[today.getMonth()];
	var yyyy = today.getFullYear();
	var today = dd + ' ' + mm + ' ' + yyyy;
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
	return {"today": today, "todayplus14": dd14 + ' ' + mm14 + ' ' + yyyy14, "todayplus28": dd28 + ' ' + mm28 + ' ' + yyyy28, "todayplus21": dd21 + ' ' + mm21 + ' ' + yyyy21};
}

function downloadEmail(emlContent, parameters, data) {
	var encodedUri = encodeURI(emlContent); //encode spaces etc like a url
	encodedUri = encodedUri.replace(/#/g, '%23')
	var a = document.createElement('a'); //make a link in document
	var linkText = document.createTextNode("fileLink");
	a.appendChild(linkText);
	a.href = encodedUri;
	a.id = 'fileLink';
	if (parameters[1] !== 'MOU') {
		a.download = data.First_Name  + " " + data.Last_Name + ' - ' + parameters[1] + '.eml';
	} else {
		a.download = data.First_Name  + " " + data.Last_Name + ' - ' + data.enforcename + '.eml';
	}
	a.style = "display:none;"; //hidden link
	document.body.appendChild(a);
	document.getElementById('fileLink').click(); //click the link
	a.remove();
}