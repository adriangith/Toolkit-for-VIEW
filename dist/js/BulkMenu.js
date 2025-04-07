/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/js/BulkMenu.js":
/*!****************************!*\
  !*** ./src/js/BulkMenu.js ***!
  \****************************/
/***/ (() => {

eval("document.getElementById('lnkBulkUpdates').click();\r\n\r\nDebtorNotesUpdate = new Link('pnl3BulkDebtorNoteUpdate', \"Bulk Debtor Notes Update\", {\r\n\t\"source\": document.location.host.split('.')[0],\r\n\t\"pages\": [\"debtorBulkNotes\", \"finish\"],\r\n\t\"titleTxt\": \"Bulk Debtor Notes Update\"\r\n})\r\n\r\nBulkWriteoff = new Link('pnl3BulkWriteOffUpdate', \"Bulk Notice Writeoff\", {\r\n\t\"source\": document.location.host.split('.')[0],\r\n\t\"pages\": [\"bulkWriteOff\", \"finish\"],\r\n\t\"titleTxt\": \"Bulk Writeoff Update\"\r\n})\r\n\r\nBulkRequestEnforcementWarrant = new Link('pnl3BulkRequestEnforcementWarrant', \"Bulk Request Enforcement Warrant\", {\r\n\t\"source\": document.location.host.split('.')[0],\r\n\t\"pages\": [\"bulkRequestEnforcementWarrant\", \"finish\"],\r\n\t\"titleTxt\": \"Bulk Request Enforcement Warrant\"\r\n})\r\n\r\nBulkRequestEnforcementWarrant.appendElement(20);\r\n\r\n/* DebtorNotesUpdate.appendElement(20);\r\nBulkWriteoff.appendElement(20); */\r\n\r\nfunction postData(data) {\r\n\tchrome.runtime.sendMessage({\r\n\t\tvalidate: \"BulkDebtorNotes\",\r\n\t\tdata: data\r\n\t})\r\n}\r\n\r\nfunction Link(id, textContent, data) {\r\n\tthis.parent = document.getElementById('divBulkUpdates');\r\n\tthis.element = pnl3BulkNoteUpdate.cloneNode(true);\r\n\tthis.element.id = id;\r\n\tthis.element.querySelector('a').href = \"#\";\r\n\tthis.element.querySelector('a').textContent = textContent;\r\n\tthis.element.addEventListener('mouseup', function () {\r\n\t\tpostData(data)\r\n\t})\r\n\r\n\tthis.appendElement = function (position) {\r\n\t\tn = this.parent.children.length > position ? position : this.parent.children.length\r\n\t\tthis.parent.children[n - 1].after(this.element);\r\n\t}\t\r\n}\r\n\r\n\n\n//# sourceURL=webpack://Toolkit-for-VIEW/./src/js/BulkMenu.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/js/BulkMenu.js"]();
/******/ 	
/******/ })()
;