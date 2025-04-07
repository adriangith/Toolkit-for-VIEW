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

/***/ "./src/js/bulkWriteoffEnhance.js":
/*!***************************************!*\
  !*** ./src/js/bulkWriteoffEnhance.js ***!
  \***************************************/
/***/ (() => {

eval("if (document.querySelector(\"#lblPageHeader\").textContent.includes(\"Bulk\")) {\r\n    calculateOutstanding()\r\n}\r\n\r\nasync function calculateOutstanding() {\r\n\r\n\r\n    const headerSpace = document.querySelector(\"#pnlResultGrid > table > tbody > tr:nth-child(1) > td > table > tbody > tr:nth-child(1) > td\")\r\n\r\n    const obligationArray = document.querySelector(\"#txtNoticeCheck\").value.split(\",\")\r\n    const debtorPageObligations = await getDebtorObligations(window.location.host.split(\".\")[0])\r\n    let totalObligationBalance = 0;\r\n    debtorPageObligations.forEach(row => {\r\n        if (obligationArray.includes(row['Notice Number'])) {\r\n            totalObligationBalance += parseFloat(row['Balance Outstanding'].replace(\"$\", \"\").replace(\",\", \"\"));\r\n        }\r\n    })\r\n    const htmlFragment = `\r\n    <span style=\"padding: 10;vertical-align: sub;font-weight: bold;\">\r\n        Value of Obligations: $${totalObligationBalance.toFixed(2)}\r\n    </span>`\r\n    headerSpace.insertAdjacentHTML('beforeend', htmlFragment);\r\n}\r\n\r\nasync function getDebtorObligations(source) {\r\n    //Get stateless page\r\n    let vDocument = await fetch(`https://${source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorObligationsSummary.aspx`);\r\n    let parsedDocument = await parsePage(vDocument)\r\n    let formData = await getFormData(parsedDocument)\r\n\r\n    let formDataN = new FormData();\r\n    for (var key in formData) {\r\n        formDataN.append(key, formData[key]);\r\n    }\r\n\r\n    //Get page with all obligations if more than 50\r\n    let rowCount = parsedDocument.querySelector(\"#DebtorNoticesCtrl_DebtorNoticesTable_PageChooserCell > span\").textContent.trim().split(\" \");\r\n    if (Number(rowCount[rowCount.length - 1]) > 50) {\r\n        formDataN.set(\"DebtorNoticesCtrl$DebtorNoticesTable$ddRecordsPerPage\", 0)\r\n        vDocument = await fetch(`https://${source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorObligationsSummary.aspx`, {\r\n            method: \"POST\",\r\n            body: formDataN\r\n        })\r\n        parsedDocument = await parsePage(vDocument)\r\n    }\r\n\r\n    return (parseTable(parsedDocument.getElementById(\"DebtorNoticesCtrl_DebtorNoticesTable_tblData\")))\r\n}\r\n\r\nasync function parsePage(vDocument) {\r\n    let htmlText = await vDocument.text();\r\n    const parser = new DOMParser();\r\n    const parsedDocument = parser.parseFromString(htmlText, \"text/html\");\r\n    return parsedDocument;\r\n}\r\n\r\nasync function getFormData(parsedDocument) {\r\n    const formElement = parsedDocument.querySelector(\"form\");\r\n    let formData = new FormData(formElement);\r\n    var formDataObject = {};\r\n    formData.forEach((value, key) => { formDataObject[key] = value });\r\n    return formDataObject;\r\n}\r\n\r\n/**\r\n * @license\r\n *\r\n * The MIT License (MIT)\r\n *\r\n * Copyright (c) 2014 Nick Williams\r\n *\r\n * Permission is hereby granted, free of charge, to any person obtaining a copy\r\n * of this software and associated documentation files (the \"Software\"), to deal\r\n * in the Software without restriction, including without limitation the rights\r\n * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\r\n * copies of the Software, and to permit persons to whom the Software is\r\n * furnished to do so, subject to the following conditions:\r\n *\r\n * The above copyright notice and this permission notice shall be included in\r\n * all copies or substantial portions of the Software.\r\n *\r\n * THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\r\n * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\r\n * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\r\n * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\r\n * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\r\n * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\r\n * THE SOFTWARE.\r\n */\r\n\r\n/**\r\n * generates factory functions to convert table rows to objects,\r\n * based on the titles in the table's <thead>\r\n * @param  {Array<String>} headings the values of the table's <thead>\r\n * @return {(row: HTMLTableRowElement) => Object} a function that takes a table row and spits out an object\r\n */\r\nfunction mapRow(headings) {\r\n    return function mapRowToObject({ cells }) {\r\n        return [...cells].reduce(function(result, cell, i) {\r\n            const input = cell.querySelector(\"input,select\");\r\n            var value;\r\n\r\n            if (input) {\r\n                value = input.type === \"checkbox\" ? input.checked : input.value;\r\n            } else {\r\n                value = cell.innerText;\r\n            }\r\n\r\n            return Object.assign(result, {\r\n                [headings[i]]: value\r\n            });\r\n        }, {});\r\n    };\r\n}\r\n\r\n/**\r\n * given a table, generate an array of objects.\r\n * each object corresponds to a row in the table.\r\n * each object's key/value pairs correspond to a column's heading and the row's value for that column\r\n *\r\n * @param  {HTMLTableElement} table the table to convert\r\n * @return {Array<Object>}       array of objects representing each row in the table\r\n */\r\nfunction parseTable(table) {\r\n    var headings = [...table.tHead.rows[0].cells].map(\r\n        heading => heading.innerText\r\n    );\r\n\r\n    return [...table.tBodies[0].rows].map(mapRow(headings));\r\n}\n\n//# sourceURL=webpack://Toolkit-for-VIEW/./src/js/bulkWriteoffEnhance.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/js/bulkWriteoffEnhance.js"]();
/******/ 	
/******/ })()
;