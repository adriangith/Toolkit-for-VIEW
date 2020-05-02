let records = {"records":[]}

function getRequestor() {
	
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
	  if (request[3] === 'lookup') {
		getNoticeKeeper(request)
	  } else if(request[3] === 'stats') {
		exportDocx()  
	  }
  });


async function getNoticeKeeper(request) {
	fetch('https://djr.view.civicacloud.com.au/Traffic/Notices/Forms/NoticesManagement/NoticeKeeper.aspx')
		.then(async data => {
			let pageText = await data.text()
			let records = {}
			chrome.storage.local.get(['records'], function(result) {
				if (result.records === undefined) {
					records.sheet = [{'records': []}]
				} else {
					records.sheet = result.records.sheet
				}
				console.log(records.sheet[records.sheet.length - 1]);
				currentSheet = records.sheet[records.sheet.length - 1]
				console.log(currentSheet.records.length);
					if (currentSheet.records.length === 21)  {
						let object = {'records': []}
						records.sheet.push(object);
						currentSheet = object
					}
				currentSheet.records.push(getDetails(pageText, currentSheet.records.length, request))
			chrome.storage.local.set({'records': records})
			})
		})
		.catch(err => {
			console.log(err);
		})
}

function getDetails(pageText, No, request) {
	pageText = $($.parseHTML(pageText))
	let VRM = pageText.find('#NoticeInfo_lblVrmNo').text();
	let licence = "/" + pageText.find('#lblDriverLicenceNo').text();
	if (licence === "/") {licence = ""}
	let obligation = pageText.find('#hiddenNoticeNo').val();
	let today = new Date(Date.now()).toLocaleString().split(',')[0]
	return {"No": No + 1, "Date": today,  "Registration": VRM + licence, "Obligation":obligation, 'Requestor': request[0], 'ID': request[1], 'Reason': request[2]};
}

function exportDocx(){
        loadFile("https://vicgov-my.sharepoint.com/:w:/g/personal/adrian_zafir_justice_vic_gov_au/EddQ1zJltghPsrVp_1-5IgAB8hJ75Z0M0O5jENkg0Uvo7w?e=cyYUmH?&download=1",function(error,content){
            if (error) { throw error };
            var zip = new JSZip(content);
            var doc=new window.Docxtemplater().loadZip(zip)
			chrome.storage.local.get(['records'], function(result) {
			doc.setData(result.records);
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
					console.log(JSON.stringify({error: e}));
					// The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
					throw error;
				}
				var out=doc.getZip().generate({
					type:"blob",
					mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				}) //Output the document using Data-URI
				saveAs(out,"output.docx")
			})})
    }
