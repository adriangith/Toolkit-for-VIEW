async function bulkFeeWaive(bulkFeeWaiveProcess){
	
	
	
	if(progressButton is clicked) {
		bulkFeeWaiveProcess()
	}
}

async function bulkFeeWaiveProcess(oblgations, sender){
	fetch("https://djr.view.civicacloud.com.au/Traffic/Notices/forms/NoticesManagement/SearchNotice.aspx?&NoticeNo=" + Obligations[obligation]).then(
	sender.tab.url = "https://djr.view.civicacloud.com.au/Traffic/Notices/Forms/NoticesManagement/NoticeActions.aspx?mode=V"
		chrome.tabs.sendMessage(sender.tab.id, {progressButton: true}, function(response) {
    console.log(response.farewell);
  });


	
}

