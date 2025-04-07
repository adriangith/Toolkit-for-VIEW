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

/***/ "./src/js/noticeLHM.js":
/*!*****************************!*\
  !*** ./src/js/noticeLHM.js ***!
  \*****************************/
/***/ (() => {

eval("var obligationsButton = document.createElement('tr');\r\nobligationsButton.innerHTML = `<td class=\"leftmenufirstcol\">&nbsp; </td> \r\n                \t\t\t\t <td class=\"leftmenumiddlecol\"> \r\n                   \t\t\t\t \t<img src=\"https://${window.location.host.split(\".\")[0]}.view.civicacloud.com.au/Common/Images/BulletPnt.gif\">&nbsp;<a href=\"javascript:ConfirmChangesLose(\\'https://${window.location.host.split(\".\")[0]}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorObligationsSummary.aspx\\')\" accesskey=\"i\" style=\"VERTICAL-ALIGN: top\" target=\"\">Obligations Summary</a></td>\r\n\t  \t\t\t\t\t\t\t <td class=\"leftmenulastcol\">&nbsp; </td>`\r\n\r\nvar sibling = document.querySelector(\"#dvInformation > table > tbody > tr:nth-child(11)\")\r\ndocument.querySelector(\"#dvInformation > table > tbody\").insertBefore(obligationsButton, sibling.nextSibling);\r\n\n\n//# sourceURL=webpack://Toolkit-for-VIEW/./src/js/noticeLHM.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/js/noticeLHM.js"]();
/******/ 	
/******/ })()
;