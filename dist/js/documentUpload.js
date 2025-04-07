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

/***/ "./src/js/documentUpload.js":
/*!**********************************!*\
  !*** ./src/js/documentUpload.js ***!
  \**********************************/
/***/ (() => {

eval("uploadControl = document.getElementById('ctl00_mainContentPlaceHolder_documentImportFileUpload')\r\n\tuploadControl.onchange = function() {\r\n\tdocument.getElementById('ctl00_mainContentPlaceHolder_lstApplicationModule').value = \"Debtors\"\r\n\tfunction Matches(value){\r\n\t\treturn uploadControl.value.indexOf(value) !== -1;\r\n\t}\r\n\r\n\tlet type = [\r\n\t\t\"East Gippsland Shire Council\", \r\n\t\t\"City of Melbourne\", \r\n\t\t\"Victoria Police Toll Enforcement\", \r\n\t\t\"Victoria Police\", \r\n\t\t\"City of Darebin\", \r\n\t\t\"Public Transport Regulatory Operations\", \r\n\t\t'City of Moreland',\r\n\t\t'Traffic Camera Office',\r\n\t\t\"City of Ballarat\",\r\n\t\t\"City of Stonnington\",\r\n\t\t\"Hobsons Bay City Council\",\r\n\t\t\"City of Port Phillip\",\r\n\t\t\"Victorian Electoral Commission\",\r\n\t\t\"City of Greater Geelong\",\r\n\t\t\"Glen Eira City Council\",\r\n\t\t\"Manningham City Council\"\r\n\t].find(Matches);\r\n\t\r\n\tif (type !== undefined) {\r\n\t\ttype = type.toString()\r\n\t\t\r\n\t}\r\n\r\n\ttype = type === \"East Gippsland Shire Council\" ? \"EastGpslnd - \" \r\n\t\t: type === \"City of Melbourne\" ? \"Melbourne - \" \r\n\t\t: type === \"Victoria Police\" ? \"VicPol - \"\r\n\t\t: type === 'Victoria Police Toll Enforcement' ? \"VicPolToll - \"\r\n\t\t: type === 'City of Darebin' ? \"Darebin - \"\r\n\t\t: type === \"Public Transport Regulatory Operations\" ? \"PTRO - \"\r\n\t\t: type === \"City of Moreland\" ? \"Moreland - \"\r\n\t\t: type === \"Traffic Camera Office\" ? \"TCO - \"\r\n\t\t: type === \"City of Ballarat\" ? \"Ballarat - \"\r\n\t\t: type === \"City of Stonnington\" ? \"Stonningtn - \"\r\n\t\t: type === \"City of Port Phillip\" ? \"PortPhllp - \"\r\n\t\t: type === \"City of Greater Geelong\" ? \"Geelong - \"\r\n\t\t: type === \"Monash City Council\" ? \"Monash - \"\r\n\t\t: type === \"Victorian Electoral Commission\" ? \"VEC - \"\r\n\t\t: type === \"Glen Eira City Council\" ? \"GlenEira - \"\r\n\t\t: type === \"Manningham City Council\" ? \"Manningham - \"\r\n\t\t: type === \"Whitehorse City Council\" ? \"Whitehorse - \"\r\n\t\t: type === \"Hobsons Bay City Council\" ? \"HobsonsBay - \" : \"ER Special - \";\r\n\t\t\r\n\tlet outcome = [\r\n\t\t\"Confirmed\", \r\n\t\t\"Cancelled\", \r\n\t\t\"Refused\", \r\n\t\t\"Granted\", \r\n\t\t\"Wrong person applying. No grounds\", \r\n\t\t\"Paid in full. Ineligible\", \r\n\t\t'Outside Person Unaware. Ineligible',\r\n\t\t'Offences n/e Person Unaware. No grounds',\r\n\t\t\"Offence Type Ineligible\",\r\n\t\t\"No Grounds\"\r\n\t].filter(Matches).toString();\r\n\r\n\toutcome = outcome === \"Wrong person applying. No grounds\" ? \"Ineligible Grounds\" \r\n\t\t: outcome === \"No Grounds\" ? \"Ineligible Grounds\" \r\n\t\t: outcome === \"Paid in full. Ineligible\" ? \"Ineligible Paid\"\r\n\t\t: outcome === 'Outside Person Unaware. Ineligible' ? \"Ineligible PU\"\r\n\t\t: outcome === 'Offences n/e Person Unaware. No grounds' ? \"Ineligible PU\"\r\n\t\t: outcome === \"Offence Type Ineligible\" ? \"Ineligible OT\"\r\n\t\t: outcome === \"Granted\" ? \"Fee Removal - Granted\"\r\n\t\t: outcome === \"Refused\" ? \"Fee Removal - Refused\"\r\n\t\t: outcome === \"Confirmed\" ? \"Confirmed\"\r\n\t\t: outcome === \"Cancelled\" ? \"Cancelled\"\r\n\t\t: outcome === \"Confirmed, Granted\" ? \"Confirmed CV\" : outcome;\r\n\t\t\r\n\tobligations = uploadControl.value.match(/[0-9]+/)[0]\r\n\tobligations = obligations.length > 4 ? \" OBL \" + obligations : \" x \" + obligations;\r\n\r\n\tchrome.storage.local.get([\"userName\"], function(items){\r\n\t\ttextArea = document.getElementById('ctl00_mainContentPlaceHolder_documentDescriptionText')\r\n\t\ttextArea.value = type + outcome + obligations + \" - \" + items.userName\r\n\t});\r\n}\n\n//# sourceURL=webpack://Toolkit-for-VIEW/./src/js/documentUpload.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/js/documentUpload.js"]();
/******/ 	
/******/ })()
;