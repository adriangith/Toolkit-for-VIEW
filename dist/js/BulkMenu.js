/******/ (() => { // webpackBootstrap
/*!****************************!*\
  !*** ./src/js/BulkMenu.js ***!
  \****************************/
document.getElementById('lnkBulkUpdates').click();
DebtorNotesUpdate = new Link('pnl3BulkDebtorNoteUpdate', "Bulk Debtor Notes Update", {
  "source": document.location.host.split('.')[0],
  "pages": ["debtorBulkNotes", "finish"],
  "titleTxt": "Bulk Debtor Notes Update"
});
BulkWriteoff = new Link('pnl3BulkWriteOffUpdate', "Bulk Notice Writeoff", {
  "source": document.location.host.split('.')[0],
  "pages": ["bulkWriteOff", "finish"],
  "titleTxt": "Bulk Writeoff Update"
});
BulkRequestEnforcementWarrant = new Link('pnl3BulkRequestEnforcementWarrant', "Bulk Request Enforcement Warrant", {
  "source": document.location.host.split('.')[0],
  "pages": ["bulkRequestEnforcementWarrant", "finish"],
  "titleTxt": "Bulk Request Enforcement Warrant"
});
BulkRequestEnforcementWarrant.appendElement(20);

/* DebtorNotesUpdate.appendElement(20);
BulkWriteoff.appendElement(20); */

function postData(data) {
  chrome.runtime.sendMessage({
    validate: "BulkDebtorNotes",
    data: data
  });
}
function Link(id, textContent, data) {
  this.parent = document.getElementById('divBulkUpdates');
  this.element = pnl3BulkNoteUpdate.cloneNode(true);
  this.element.id = id;
  this.element.querySelector('a').href = "#";
  this.element.querySelector('a').textContent = textContent;
  this.element.addEventListener('mouseup', function () {
    postData(data);
  });
  this.appendElement = function (position) {
    n = this.parent.children.length > position ? position : this.parent.children.length;
    this.parent.children[n - 1].after(this.element);
  };
}
/******/ })()
;
//# sourceMappingURL=BulkMenu.js.map