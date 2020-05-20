chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

	if ((sender.tab !== undefined && sender.tab.title === "Work and Development Permit Scheme") && request.type === "Initialise") {
		(async () => {
			const payload = await showVIEWInWDP(request.data);
			sendResponse({ payload });
		})();
		return true; // keep the messaging channel open for sendResponse
	}
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if ((sender.tab !== undefined && sender.tab.title === "Work and Development Permit Scheme") && request.type === "Scrape") {
		(async () => {
			const payload = await getData(request.data);
			sendResponse({ payload });
		})();
		return true; // keep the messaging channel open for sendResponse
	}
});

async function switchObligationsR(obligation) {
	//Changes the active obligation
	const res = fetch("https://djr.view.civicacloud.com.au/Traffic/Notices/forms/NoticesManagement/SearchNotice.aspx?&NoticeNo=" + obligation, {
		method: 'GET',
		redirect: 'follow'
	});
	return res
}

async function showVIEWInWDP(message) {
	let hit = false;
	let captured = switchObligationsR(message[0])
	let obpage = await captured
	const res = await fetch("https://djr.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorObligations.aspx")
	let htmlText = await res.text();
	let formData = await getFormData($(htmlText));
	formData.set("DebtorNoticesCtrl$DebtorNoticesTable$ddRecordsPerPage", 0);
	htmlText = await getPage({ "url": "https://djr.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorObligations.aspx" }, formData);
	let obligationTable = $(htmlText).find("#DebtorNoticesCtrl_DebtorNoticesTable_tblData tbody")
	captured = []
	if (obligationTable[0] === undefined) { captured = false; return captured }
	for (let i = 0; i < obligationTable[0].childNodes.length; i++) {
		if (obligationTable[0].childNodes[i].nodeName === "TR") {
			let row = obligationTable[0].childNodes[i].childNodes;
			if (row[1].textContent == message[0]) { hit = true }
			captured.push(
				{
					"Notice Number": row[1].textContent,
					"Issued": row[5].textContent,
					"Balance Outstanding": row[6].textContent,
					"Notice Status": row[7].textContent.replace("/", "/\n"),
					"Offence": row[8].textContent,
				}
			)
		}
	}
	if (hit === false) { captured = false };
	return captured
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (((sender.tab !== undefined && sender.tab.title === "Work and Development Permit Scheme") && request.type !== "Initialise" && request.type !== "Scrape") ||
		(sender.tab !== undefined && sender.tab.title === "Wizard")
	) {

		(async () => {
			//Handle files
			if (request.init && request.init.body.ctl01$mainContentPlaceHolder$documentImportFileUpload) {
				let fileContainer = request.init.body.ctl01$mainContentPlaceHolder$documentImportFileUpload;
				console.log(fileContainer);
				request.init.body.ctl00$mainContentPlaceHolder$documentImportFileUpload = await urltoFile(fileContainer.file, fileContainer.name, fileContainer.file.split(';')[0].split(':')[1])
			}

			//Convert object to URLSearchParams
			if (request.opt === "URLSearchParams") {
				request.init.body = new URLSearchParams(request.init.body);
			}
			console.log(request.opt);
			//Convert object to FormData
			if (request.opt === "FormData") {
				let formData = new FormData();
				for (var key in request.init.body) {
					formData.append(key, request.init.body[key]);
				}
				request.init.body = formData;
			}

			fetch(request.input, request.init).then(function (response) {
				console.log(response.url);
				return response.text().then(function (text) {
					sendResponse([{
						body: text,
						status: response.status,
						statusText: response.statusText,
						url: response.url
					}, null]);
				});
			}, function (error) {
				endResponse([null, error]);
			});
		})();

		return true;
	}
});

//return a promise that resolves with a File instance
function urltoFile(url, filename, mimeType) {
	return (fetch(url)
		.then(function (res) { return res.arrayBuffer(); })
		.then(function (buf) { return new File([buf], filename, { type: mimeType }); })
	);
}

chrome.runtime.onMessage.addListener(function (request) {
	let valArray = ["bankruptcy", "BulkDebtorNotes"]
	if (request.validate && valArray.includes(request.validate)) {
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {request.data.catalystURL = tabs[0].url; request.data.catalystTabID = tabs[0].id});
		chrome.windows.create({"url": chrome.extension.getURL("wizard/wizard.html"), "type": "popup", "width":900, "height":650, "left": 200, "top": 200}, function(window) {
			var handler = function(tabId, changeInfo) {
				if(window.tabs[0].id === tabId && changeInfo.status === "complete"){
					chrome.windows.onCreated.removeListener(handler);
					chrome.tabs.sendMessage(tabId, {url: request.url, data: request.data});
				}
			  }
			  
			chrome.tabs.onUpdated.addListener(handler); // in case we're faster than page load (usually) (Guessing that this listener is added after the windows has already been created)
			  chrome.tabs.sendMessage(window.tabs[0].id, {url:request.url, data: request.data}); 	// just in case we're too late with the listener (Guessing event listener is not ready when this is sent)
		});
	}
})

