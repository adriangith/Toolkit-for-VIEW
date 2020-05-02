let searchButton = document.getElementById('btnNoticesSearch');

let pasteButton = document.createElement('input');
pasteButton.setAttribute('type', 'image');
pasteButton.setAttribute('tabindex', 5.1);
pasteButton.setAttribute('align', 'middle');
pasteButton.setAttribute('onclick', 'return false');
pasteButton.id = 'btnNoticePaste'
pasteButton.src = chrome.runtime.getURL("Images/paste.png")
pasteButton.addEventListener('mouseup', function() {
    let obArray = prompt("Paste obligations from excel here. Hint: You can copy and paste the entire column");
    
    if (obArray === null) {
        console.log("You didn't paste any obligations");
        return;
    }
    obArray = obArray.split("\n");
    let type = window.location.search.match(/ode=(.*)/)[1][0] === 'N' ? "Bulk Notes Update" : "Bulk Hold Update";
    data = [obArray, type];
    chrome.runtime.sendMessage(data);
})

insertAfter(pasteButton, searchButton)

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}
