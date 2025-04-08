/******/ (() => { // webpackBootstrap
/*!*****************************!*\
  !*** ./src/js/pasteBulk.js ***!
  \*****************************/
var referenceButton = document.getElementById('btnNoticesSearch');
if (!referenceButton) referenceButton = document.querySelector("#btnNoticeAdd");
var pasteButton = document.createElement('input');
pasteButton.setAttribute('type', 'image');
pasteButton.setAttribute('tabindex', 5.1);
pasteButton.setAttribute('align', 'middle');
pasteButton.setAttribute('onclick', 'return false');
pasteButton.id = 'btnNoticePaste';
pasteButton.src = chrome.runtime.getURL("Images/paste.png");
pasteButton.addEventListener('mouseup', function () {
  var obArray = prompt("Paste obligations from excel here.\r\nHint: You can copy and paste an entire column.");
  if (obArray === null) {
    console.log("You didn't paste any obligations");
    return;
  }
  obArray = obArray.split("\n");
  data = [obArray, document.querySelector("#lblPageHeader").textContent, null, null, null, window.location.host.split(".")[0]];
  chrome.runtime.sendMessage(data);
});
insertAfter(pasteButton, referenceButton);
function insertAfter(newNode, referenceNode) {
  if (referenceNode) referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}
/******/ })()
;
//# sourceMappingURL=pasteBulk.js.map