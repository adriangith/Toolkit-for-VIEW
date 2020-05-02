var bleep;
var counter;
var state;

async function bulkObligationAdder(Obligations){
	bleep = 0;
	counter = 0;
	state = "";
		let mode = Obligations[1] === "Bulk Notes Update" ? 'N' : 'H'
		startData = await setup(mode);
		ObligationsArray = Obligations[0]
		let miniObligationsArray = []
		bleep = ObligationsArray.length;
		let countToTen = 0;
		for (let ObligationNumber in ObligationsArray) {
				//startData is form data, but becomes an html string once the last obligation has been looped
				startData = await addObligation(ObligationsArray[ObligationNumber], startData, mode, countToTen, miniObligationsArray)
			}
		
		postData("https://" + source + ".view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkGenericUpdate.aspx?mode=" + mode, startData);	
}

function postData(url, data, sender) {
	chrome.windows.create({"url": chrome.extension.getURL("post.html"), "type": "popup", "width":1029, "height":844}, function(window) {
		var handler = function(tabId, changeInfo) {
			console.log(tabId);
			if(window.tabs[0].id === tabId && changeInfo.status === "complete"){
				chrome.windows.onCreated.removeListener(handler);
				chrome.tabs.sendMessage(tabId, {url: url, data: data});
			}
      	}
      	
		chrome.tabs.onUpdated.addListener(handler); // in case we're faster than page load (usually) (Guessing that this listener is added after the windows has already been created)
      	chrome.tabs.sendMessage(window.tabs[0].id, {url: url, data: data}); 	// just in case we're too late with the listener (Guessing event listener is not ready when this is sent)
	});
}

function postData2(url, data) {
  chrome.tabs.update({ url: chrome.extension.getURL("post.html")}, function(tab) {
      	var handler = function(tabId, changeInfo) {
			if(tabId === tab.id && changeInfo.status === "complete"){
				chrome.tabs.onUpdated.removeListener(handler);
				chrome.tabs.sendMessage(tabId, {url: url, data: data});
			}
      	}
      	
     	chrome.tabs.onUpdated.addListener(handler); // in case we're faster than page load (usually)
      	chrome.tabs.sendMessage(tab.id, {url: url, data: data}); 	// just in case we're too late with the listener
    });  
}

async function addObligation(Obligation, outData, mode, countToTen, miniObligationsArray) {
	counter++
	console.log(counter)
	outData = await outData;
	outData.set('txtNoticeNo', Obligation);
	miniObligationsArray.push(Obligation)
	outData.set('txtNoticeCheck', miniObligationsArray.toString());
	if (countToTen < 10) {
		outData.set(Obligation, 'on');
		countToTen++
	} else if (countToTen === 10) {
		countToTen = 0;	
	}
	const page = await fetch("https://" + source + '.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkGenericUpdate.aspx?mode=' + mode, {
      method: 'POST',
      body: outData
	});
	
	
	let bulkText = page.text();
	content = await bulkText;
	bulkText = $($.parseHTML(await bulkText))
	const $formElement = bulkText.filter('Form')
	const formElement = $formElement[0]
	if(counter < bleep) {
		outData = new URLSearchParams();
		for (const pair of new FormData(formElement)) {
		outData.append(pair[0], pair[1]);
		}
		outData.set('btnNoticeAdd.x', 0)
		outData.set('btnNoticeAdd.y', 0)
		outData.set('hdtxtUpdateAvailability', true)
		outData.set('hdtxtIncludeClosedNotices', false)
		outData.set('hdtxtIncludeClosedNoticesCheckBoxValue', false)
		return await outData
	} else {return await content};
}

async function setup(mode) {
	const page = await fetch("https://" + source + '.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkGenericUpdate.aspx?mode=' + mode, {
      method: 'GET'
	});
	htmlText = await page.text()
	const parser = new DOMParser();
    const htmlDocument = await parser.parseFromString(htmlText, "text/html");
    const formElement = htmlDocument.documentElement.querySelector("form");
	outData = new URLSearchParams();
	for (const pair of new FormData(formElement)) {
      outData.append(pair[0], pair[1]);
	}
	
	outData.set('txtNoticeNo', 0)
	outData.set('btnNoticeAdd.x', 0)
	outData.set('btnNoticeAdd.y', 0)
	outData.set('hdtxtUpdateAvailability', true)
	outData.set('hdtxtIncludeClosedNotices', false)
	outData.set('hdtxtIncludeClosedNoticesCheckBoxValue', false)
	return await outData;
}

