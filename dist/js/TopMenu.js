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

/***/ "./src/js/TopMenu.js":
/*!***************************!*\
  !*** ./src/js/TopMenu.js ***!
  \***************************/
/***/ (() => {

eval("let tmnotices =  document.getElementById('Cell_Notices');\r\ntmbulkupdate = tmnotices.cloneNode(true);\r\ntmnotices.after(tmbulkupdate);\r\ntmbulkupdate.id = 'Cell_Bulk_Update';\r\nlet tmbul = tmbulkupdate.querySelector('span > a');\r\ntmbul.textContent = \"Bulk Update\";\r\nlet tmbulArray = tmbul.href.split('/')\r\ntmbulArray[tmbulArray.length - 1] = 'BulkUpdateMain.aspx';\r\ntmbul.href = tmbulArray.join('/');\r\n\n\n//# sourceURL=webpack://Toolkit-for-VIEW/./src/js/TopMenu.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/js/TopMenu.js"]();
/******/ 	
/******/ })()
;