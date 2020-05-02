function postData(url, data) {
	chrome.windows.create({"url": chrome.extension.getURL("wizard/wizard.html"), "type": "popup", "width":847, "height":600}, function(window) {
		var handler = function(tabId, changeInfo) {
			console.log(tabId);
			if(window.tabs[0].id === tabId && changeInfo.status === "complete"){
                console.log(tabId);
                chrome.windows.onCreated.removeListener(handler);
				chrome.tabs.sendMessage(tabId, {url: url, data: data});
			}
      	}
      	
		chrome.tabs.onUpdated.addListener(handler); // in case we're faster than page load (usually) (Guessing that this listener is added after the windows has already been created)
      	chrome.tabs.sendMessage(window.tabs[0].id, {url: url, data: data}); 	// just in case we're too late with the listener (Guessing event listener is not ready when this is sent)
	});
}

async function buildTable(container, bankruptcyData, source) {
    bankruptcyData = await bankruptcyData;
    let DebtorId = document.getElementById('DebtorDetailsCtrl_DebtorIdSearch').value; 
    arr = bankruptcyData.filter(elemnt =>  elemnt.children[4].innerText.trim() === DebtorId)
    /*Handle if no current bankruptcy applications*/
    console.log(arr.length);
    if (arr.length === 0) {
        const notification = document.createElement("p");
        notification.align = "Center";
        notification.innerText = "No current notification of bankruptcy" 
        container.appendChild(notification);
        return;
    }
    let bankruptcyTable = document.createElement("table");
    Object.assign(bankruptcyTable, {
        className: "labelbox",
        id: "DebtorBankruptcyCtrl_AllApplicationsGrid_tblData",
        cellspacing: 0,
        cellpadding: 1,
        align: "Center",
        rules: "all",
        style: "border-color:#CCCCCC;border-width:1px;border-style:solid;width:100%;border-collapse:collapse;border-color:#CCCCCC;border-collapse:collapse;"
    })
    bankruptcyTable.innerHTML = `
    <thead>
        <tr id="DebtorBankruptcyCtrl_DebtorApplicationsGrid_HeaderRow" class="gridheader" align="center" style="color:White;">
            <th id="DebtorBankruptcyCtrl_DebtorApplicationsGrid_HeaderCellTaskID" onclick="javascript:__doPostBack('DebtorDocumentsCtrl$DebtorScannedDocumentsGrid','Sort-Title')" style="border-width:1px;border-style:solid;Cursor:Hand;">Task Id</th>
            <th id="DebtorBankruptcyCtrl_DebtorApplicationsGrid_HeaderCellDescription" onclick="javascript:__doPostBack('DebtorDocumentsCtrl$DebtorScannedDocumentsGrid','Sort-Extension')" style="border-width:1px;border-style:solid;Cursor:Hand;">Description</th>
            <th id="DebtorBankruptcyCtrl_DebtorApplicationsGrid_HeaderCellActions" onclick="javascript:__doPostBack('DebtorDocumentsCtrl$DebtorScannedDocumentsGrid','Sort-CreatedDateTime')" style="border-width:1px;border-style:solid;Cursor:Hand;">Actions</th>
        </tr>
    </thead>`
    tableBody = document.createElement("tbody")
    for(let row = 0; row < arr.length; row++) {
        let tableRow = `<tr id="DebtorBankruptcyCtrl_DebtorApplicationsGrid_DataRow-${row - 1}" class="labelbox" align="center" onmouseover="javascript:cellOnMouseOver(this, &quot;#99ccff&quot;);" onmouseout="javascript:cellOnMouseOut(this);" style="">
            <td id="DebtorBankruptcyCtrl_DebtorApplicationsGrid_Row0CellDataTaskID" class="break-word-350" align="center" onclick="javascript:__doPostBack('DebtorDocumentsCtrl$DebtorScannedDocumentsGrid','RowClicked-0')" style="border-width:1px;border-style:solid;Cursor:Hand">${arr[row].children[0].innerText}</td>
            <td id="DebtorBankruptcyCtrl_DebtorApplicationsGrid_Row0CellDataDescription" align="center" onclick="javascript:__doPostBack('DebtorDocumentsCtrl$DebtorScannedDocumentsGrid','RowClicked-0')" style="border-width:1px;border-style:solid;Cursor:Hand">${arr[row].children[1].innerText.trim()}</td>
            <td id="DebtorBankruptcyCtrl_DebtorApplicationsGrid_Row0CellDataActions" align="center" onclick="javascript:__doPostBack('DebtorDocumentsCtrl$DebtorScannedDocumentsGrid','RowClicked-0')" style="border-width:1px;border-style:solid;Cursor:Hand">${arr[row].children[4].innerText}</td>
        </tr>`
        tableBody.insertAdjacentHTML('beforeend', tableRow);
    }
    bankruptcyTable.insertBefore(tableBody, null);
    container.appendChild(bankruptcyTable);
}

async function buildRegisterTable(container, source) {
    let parser = new DOMParser();
    let res = await fetchResource(`https://${source}.view.civicacloud.com.au/Taskflow/Forms/Management/TaskMaintenance.aspx?ProcessMode=User`)
    let resText = await res.text()
    let taskPage = parser.parseFromString(resText, "text/html")
    let urlParams = new URLSearchParams(new FormData(taskPage.querySelector("#aspnetForm")));
    urlParams.set("ctl00$mainContentPlaceHolder$taskSearchControl$statusText", "OPEN");
    urlParams.set("ctl00$mainContentPlaceHolder$taskSearchControl$taskTypeText", "FVBANKRUPT");
    urlParams.set("ctl00$mainContentPlaceHolder$taskSearchControl$taskSearchButton.x", 0);
    urlParams.set("ctl00$mainContentPlaceHolder$taskSearchControl$taskSearchButton.y", 0);
    let outData = urlParams.toString()
    res = await fetchResource(`https://${source}.view.civicacloud.com.au/Taskflow/Forms/Management/TaskMaintenance.aspx?ProcessMode=User`, {
        method: 'POST',
        body: outData
      }, "URLSearchParams")
    resText = await res.text()
    taskPage = parser.parseFromString(resText, "text/html")
    //Todo: Handle not finding any results
    //console.log(taskPage.querySelector("#ctl00_mainContentPlaceHolder_messageLable").innerText.includes("No record found"));
    
    //--------------------- Handle more than 5 results
    if (taskPage.querySelector('[id*="goToPageText"]') !== null) {
        urlParams = new URLSearchParams(new FormData(taskPage.querySelector("#aspnetForm")));
        urlParams.set("ctl00$mainContentPlaceHolder$taskSearchControl$goToPageText", "00");
        urlParams.set("ctl00$mainContentPlaceHolder$taskSearchControl$goToButton.x", 0);
        urlParams.set("ctl00$mainContentPlaceHolder$taskSearchControl$goToButton.y", 0);
        urlParams.set("ctl00$mainContentPlaceHolder$taskSearchControl$htxtTaskSearchPagesCount", 1);
        urlParams.set("__ASYNCPOST", true);
        urlParams.set("ctl00$applicationScriptManager", "ctl00$mainContentPlaceHolder$taskSearchControl$searchResultUpdatePanel|ctl00$mainContentPlaceHolder$taskSearchControl$goToButton");
        outData = urlParams.toString()
        res = await fetchResource(`https://${source}.view.civicacloud.com.au/Taskflow/Forms/Management/TaskMaintenance.aspx?ProcessMode=User`, {
            method: 'POST',
            body: outData
        }, "URLSearchParams")
        resText = await res.text()
        taskPage = parser.parseFromString(resText, "text/html")
    }
    //---------------------
    let rows = taskPage.querySelector("#ctl00_mainContentPlaceHolder_taskSearchControl_taskSearchGrid").querySelectorAll("tr");
    var arr = [];
    for(var i = rows.length; i--; arr.unshift(rows[i]));
    let register = document.createElement("table");
    Object.assign(register, {
        className: "labelbox",
        id: "DebtorBankruptcyCtrl_DebtorApplicationsGrid_tblData",
        cellspacing: 0,
        cellpadding: 1,
        align: "Center",
        rules: "all",
        style: "border-color:#CCCCCC;border-width:1px;border-style:solid;width:100%;border-collapse:collapse;border-color:#CCCCCC;border-collapse:collapse;"
    })
    register.innerHTML = `
    <thead>
        <tr id="DebtorBankruptcyCtrl_DebtorApplicationsGrid_HeaderRow" class="gridheader" align="center" style="color:White;">
            <th id="DebtorBankruptcyCtrl_DebtorApplicationsGrid_HeaderCellTaskID" onclick="javascript:__doPostBack('DebtorDocumentsCtrl$DebtorScannedDocumentsGrid','Sort-Title')" style="border-width:1px;border-style:solid;Cursor:Hand;">Task Id</th>
            <th id="DebtorBankruptcyCtrl_DebtorApplicationsGrid_HeaderCellDescription" onclick="javascript:__doPostBack('DebtorDocumentsCtrl$DebtorScannedDocumentsGrid','Sort-Extension')" style="border-width:1px;border-style:solid;Cursor:Hand;">Description</th>
            <th id="DebtorBankruptcyCtrl_DebtorApplicationsGrid_HeaderCellActions" onclick="javascript:__doPostBack('DebtorDocumentsCtrl$DebtorScannedDocumentsGrid','Sort-CreatedDateTime')" style="border-width:1px;border-style:solid;Cursor:Hand;">Debtor Id</th>
        </tr>
    </thead>`
    tableBody = document.createElement("tbody")
    for(let row = 1; row < arr.length; row++) {
        let tableRow = `<tr id="DebtorBankruptcyCtrl_DebtorApplicationsGrid_DataRow-${row - 1}" class="labelbox" align="center" onmouseover="javascript:cellOnMouseOver(this, &quot;#99ccff&quot;);" onmouseout="javascript:cellOnMouseOut(this);" style="">
            <td id="DebtorBankruptcyCtrl_DebtorApplicationsGrid_Row0CellDataTaskID" class="break-word-350" align="center" onclick="javascript:__doPostBack('DebtorDocumentsCtrl$DebtorScannedDocumentsGrid','RowClicked-0')" style="border-width:1px;border-style:solid;Cursor:Hand">${arr[row].children[0].innerText}</td>
            <td id="DebtorBankruptcyCtrl_DebtorApplicationsGrid_Row0CellDataDescription" align="center" onclick="javascript:__doPostBack('DebtorDocumentsCtrl$DebtorScannedDocumentsGrid','RowClicked-0')" style="border-width:1px;border-style:solid;Cursor:Hand">${arr[row].children[1].innerText.trim()}</td>
            <td id="DebtorBankruptcyCtrl_DebtorApplicationsGrid_Row0CellDataActions" align="center" onclick="javascript:__doPostBack('DebtorDocumentsCtrl$DebtorScannedDocumentsGrid','RowClicked-0')" style="border-width:1px;border-style:solid;Cursor:Hand">${arr[row].children[4].innerText}</td>
        </tr>`
        tableBody.insertAdjacentHTML('beforeend', tableRow);
    }
    register.insertBefore(tableBody, null);
    container.appendChild(register);
    return arr
}

function customiseTemplate(template, source) {
    let DebtorBankruptcyCtrl = template.getElementById("DebtorAddressCtrl");
    debtorLabel = template.getElementById("DebtorAddressCtrl_lblDebtorAddressDetails");
    debtorLabel.innerText = "Debtor: Bankruptcy Applications"
    let container = `
    <tbody>
        <tr>
            <td valign="top"> 
            </td>
        </tr>
        <tr>
            <td valign="top">
                <table id="tblDownload" cellspacing="0" cellpadding="0" width="100%" border="0">
                    <tbody>
                        <tr>
                            <td valign="middle" align="center">
                                <br>
                                <div id="DebtorBankruptcyCtrl_DebtorApplicationsGrid" style="width:100%;">
                                    <defaultitemstyle horizontalalign="Center" borderwidth="1px">
                                        <defaultheaderstyle borderwidth="1px">
                                            <table id="DebtorBankruptcyCtrl_DebtorApplicationsGrid_tblMain" style="width:100%;">
                                                <tbody>
                                                    <tr>
                                                        <td valign="top"></td>
                                                    </tr>
                                                    <tr>
                                                        <td valign="top" id="tableSpace">
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </defaultheaderstyle>
                                    </defaultitemstyle>
                                </div>
    
                            </td>
                        </tr>
                        <tr>
                            <td class="tdRowspace"></td>
                        </tr>
                        <tr>
                            <td id="DebtorDocumentsCtrl_addButtonTd" class="tdButtons" align="right">
                                <image onClick="return false;" style="Cursor:Hand;" id="DebtorBankruptcyButton" tabindex="36" src=${chrome.runtime.getURL("Images/newApplication.png")}>
                            </td>
    
                        </tr>
                    </tbody>
                </table>
            </td>
        </tr>
    </tbody>`
    DebtorBankruptcyCtrl.querySelector("#DebtorAddressCtrl_debtorAddressPanel > table").innerHTML = container;
    BankruptcyCtrl = DebtorBankruptcyCtrl.cloneNode(true);
    let target = BankruptcyCtrl.querySelector("#tableSpace");
    let bankruptcyData = buildRegisterTable(target, source);
    target = DebtorBankruptcyCtrl.querySelector("#tableSpace")
    buildTable(target, bankruptcyData, source);
    bankruptcyLabel = BankruptcyCtrl.querySelector('#DebtorAddressCtrl_lblDebtorAddressDetails')
    BankruptcyCtrl.querySelector('#DebtorDocumentsCtrl_addButtonTd').remove();
    bankruptcyLabel.innerText = "Bankruptcy Register"
    insertAfter(BankruptcyCtrl, DebtorBankruptcyCtrl)
    return template;
}

async function getTemplate() {
    let source = "djr-tst7"
    let parser = new DOMParser();
    let res = await fetchResource(`https://${source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorDetails.aspx`)
    let resText = await res.text();
    resText = resText.replace(/..\/..\/../g, `https://${source}.view.civicacloud.com.au`)
    let template = parser.parseFromString(resText, "text/html")
    let form = template.getElementById("frmDebt");
    let content = document.getElementById("content");
    if (!template.getElementById("DebtorDetailsCtrl_DebtorIdSearch").hasAttribute("value")) {
        content.appendChild(form);
        return;
    }
    template = customiseTemplate(template, source); 
    content.appendChild(form);
    document.getElementById("DebtorBankruptcyButton").addEventListener("mouseup", function() {postData(null, {debtorid: document.getElementById('DebtorDetailsCtrl_DebtorIdSearch').value})});
}

function fetchResource(input, init, opt) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({input, init, opt}, messageResponse => {
        const [response, error] = messageResponse;
        if (response === null) {
            reject(error);
        } else {
            // Use undefined on a 204 - No Content
            const body = response.body ? new Blob([response.body]) : undefined;
            resolve(new Response(body, {
            status: response.status,
            statusText: response.statusText,
            }));
        }
        });
    });
}

getTemplate();

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}


