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

/***/ "./src/js/pasteBulk.js":
/*!*****************************!*\
  !*** ./src/js/pasteBulk.js ***!
  \*****************************/
/***/ (() => {

eval("let referenceButton = document.getElementById('btnNoticesSearch');\r\nif (!referenceButton) referenceButton = document.querySelector(\"#btnNoticeAdd\");\r\n\r\nlet pasteButton = document.createElement('input');\r\npasteButton.setAttribute('type', 'image');\r\npasteButton.setAttribute('tabindex', 5.1);\r\npasteButton.setAttribute('align', 'middle');\r\npasteButton.setAttribute('onclick', 'return false');\r\npasteButton.id = 'btnNoticePaste'\r\npasteButton.src = chrome.runtime.getURL(\"Images/paste.png\")\r\npasteButton.addEventListener('mouseup', function() {\r\n    let obArray = prompt(\"Paste obligations from excel here.\\r\\nHint: You can copy and paste an entire column.\");\r\n    \r\n    if (obArray === null) {\r\n        console.log(\"You didn't paste any obligations\");\r\n        return;\r\n    }\r\n    obArray = obArray.split(\"\\n\");\r\n    data = [obArray, document.querySelector(\"#lblPageHeader\").textContent, null, null, null, window.location.host.split(\".\")[0]];\r\n    chrome.runtime.sendMessage(data);\r\n})\r\n\r\ninsertAfter(pasteButton, referenceButton)\r\n\r\nfunction insertAfter(newNode, referenceNode) {\r\n    if (referenceNode) referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);\r\n}\r\n\n\n//# sourceURL=webpack://Toolkit-for-VIEW/./src/js/pasteBulk.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/js/pasteBulk.js"]();
/******/ 	
/******/ })()
;