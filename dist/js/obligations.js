/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/js/sharedUtils.ts":
/*!*******************************!*\
  !*** ./src/js/sharedUtils.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, exports) => {


// TypeScript version of sharedUtils
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.saveIT = saveIT;
// Typed function - better code completion and error checking
function saveIT() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
    if ((_b = (_a = document.querySelector('html > head > title')) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.match(/Civica Debtors (.*)/)) {
        const titleElement = document.querySelector('html > head > title');
        const debtorId = ((_c = titleElement === null || titleElement === void 0 ? void 0 : titleElement.textContent) === null || _c === void 0 ? void 0 : _c.match(/Civica Debtors (.*)/)[1]) || '';
        // Type-safe form element access with null checking
        const thirdParty = ((_d = document.getElementById('3PA')) === null || _d === void 0 ? void 0 : _d.checked) || false;
        const contactName = ((_e = document.getElementById('Name')) === null || _e === void 0 ? void 0 : _e.value) || '';
        const organisation = ((_f = document.getElementById('Organisation')) === null || _f === void 0 ? void 0 : _f.value) || '';
        // Add the rest of your form fields here
        // Type-safe array with proper structure
        const debtorData = {
            id: debtorId,
            thirdParty,
            contactName,
            organisation,
            // Add other properties
            street: ((_g = document.getElementById('Street')) === null || _g === void 0 ? void 0 : _g.value) || '',
            town: ((_h = document.getElementById('Town')) === null || _h === void 0 ? void 0 : _h.value) || '',
            state: ((_j = document.getElementById('State')) === null || _j === void 0 ? void 0 : _j.value) || '',
            postCode: ((_k = document.getElementById('PostCode')) === null || _k === void 0 ? void 0 : _k.value) || '',
            to3rdParty: ((_l = document.getElementById('to3rdParty')) === null || _l === void 0 ? void 0 : _l.checked) || false,
            toTheDebtor: ((_m = document.getElementById('toTheDebtor')) === null || _m === void 0 ? void 0 : _m.checked) || false,
            alt3rdParty: ((_o = document.getElementById('Alt3rdParty')) === null || _o === void 0 ? void 0 : _o.checked) || false,
            altName: ((_p = document.getElementById('AltName')) === null || _p === void 0 ? void 0 : _p.value) || '',
            altOrganisation: ((_q = document.getElementById('AltOrganisation')) === null || _q === void 0 ? void 0 : _q.value) || '',
            altStreet: ((_r = document.getElementById('AltStreet')) === null || _r === void 0 ? void 0 : _r.value) || '',
            altTown: ((_s = document.getElementById('AltTown')) === null || _s === void 0 ? void 0 : _s.value) || '',
            altState: ((_t = document.getElementById('AltState')) === null || _t === void 0 ? void 0 : _t.value) || '',
            altPostCode: ((_u = document.getElementById('AltPostCode')) === null || _u === void 0 ? void 0 : _u.value) || '',
            legalCentre: ((_v = document.getElementById('3LC')) === null || _v === void 0 ? void 0 : _v.checked) || false,
            altLegalCentre: ((_w = document.getElementById('Alt3LC')) === null || _w === void 0 ? void 0 : _w.checked) || false
        };
        // Type-safe Chrome API usage
        chrome.storage.local.get(['value'], (items) => {
            const existingValues = items.value || [];
            const index = existingValues.findIndex(item => item.id === debtorId);
            if (index !== -1) {
                existingValues[index] = debtorData;
            }
            else {
                existingValues.push(debtorData);
            }
            chrome.storage.local.set({ 'value': existingValues });
            console.log('Data saved for debtor:', debtorId);
        });
    }
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!*******************************!*\
  !*** ./src/js/obligations.js ***!
  \*******************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _sharedUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./sharedUtils */ "./src/js/sharedUtils.ts");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }


/////Config Objects and Variables/////////////////////////////////////////////////////////////////////////////
var optionChain = [];

/////Script Launcher///////////////////////////////////////////////////////////////////////////////

addCheckboxes();
addElements();

/////Input creation functions/////////////////////////////////////////////////////////////////////////////////

function generateButton(button, dropDown, options) {
  //Adds buttons for data extraction.

  button.element = document.createElement('span');
  button.element.innerText = button.text;
  setAttributes(button.element, button.attributes);
  setAttributes(button.element, {
    onclick: "return false",
    "class": "mybutton"
  });
  button.element.setAttribute('id', button.name);
  document.getElementById("NoticesDataGrid").appendChild(button.element);
  if (button.name !== "letterButton") {
    button.element.addEventListener('click', function () {
      exportData(button.description);
    });
  } else {
    document.getElementById("NoticesDataGrid").appendChild(dropDown);
    button.element.addEventListener('click', function () {
      var option = options.find(function (option) {
        return option.description === dropDown.value;
      });
      exportData(option.description, option.agency, option.letters, option.extended, option.SharePoint);
    });
  }
  return button;
}
function generateOption(option, dropDown) {
  //Adds options to the drop down.
  option.element = document.createElement("option");
  option.element.text = option.description;
  dropDown.add(option.element);
  return option;
}
function addElements() {
  var dropDown = document.createElement("select");
  ;
  dropDown.style.width = "180px";
  dropDown.style.marginLeft = "6px";
  //Button properties
  var buttons = [{
    name: "tableButton",
    description: "Export obligations",
    text: "xlxs",
    attributes: {
      "style": "margin-left: 6px; cursor: hand"
    }
  },
  //	{ name: "tableSettings", description: "Table settings" },
  {
    name: "letterButton",
    description: "Generate letter(s)",
    text: "Generate letter(s)",
    attributes: {
      "style": "margin-left: 37px; cursor: hand"
    }
  }, {
    name: "holdButton",
    description: "Bulk Notes Update",
    text: "Bulk Notes",
    attributes: {
      "style": "margin-left: 44px; cursor: hand"
    }
  }, {
    name: "holdButton",
    description: "Bulk Hold Update",
    text: "Bulk Hold",
    attributes: {
      "style": "margin-left: 3px; cursor: hand"
    }
  }, {
    name: "WriteoffButton",
    description: "Bulk Writeoff Update",
    text: "Bulk Writeoff",
    attributes: {
      "style": "margin-left: 3px; cursor: hand"
    }
  } //,
  //{ name: "DeregistrationButton", description: "Bulk Deregistration Update", text: "Bulk Deregistration", attributes: { "style": "margin-left: 3px; cursor: hand" } }//,
  //,
  //	{name: "FeeButton", description: "Bulk Fee Waive"}
  ];
  var options = [{
    description: "Enforcement Confirmed",
    letters: ["Enforcement Confirmed"]
  }, {
    description: "Enforcement Cancelled",
    agency: true,
    letters: ["Enforcement Cancelled", "Agency Enforcement Cancelled"]
  }, {
    description: "ER Confirm/ FW Grant",
    agency: true,
    letters: ["ER Confirm/ FW Grant", "Agency FR Granted"]
  }, {
    description: "Report Needed",
    letters: ["Report Needed"]
  }, {
    description: "Unable to Contact Applicant",
    letters: ["Unable to Contact Applicant"]
  }, {
    description: "Notice of Deregistration",
    agency: true,
    letters: ["Notice of Deregistration"]
  }, {
    description: "FVS Eligible",
    agency: true,
    letters: ["FVS Eligible Debtor", "FVS Eligible Agency"]
  }, {
    description: "FVS Ineligible",
    letters: ["FVS Ineligible"]
  }, {
    description: "FVS Further Information Required",
    letters: ["FVS Further Information Required"]
  }, {
    description: "PSL",
    extended: true,
    letters: ["PSL"]
  }, {
    description: "Suspension of driver licence",
    extended: true,
    letters: ["Suspension of driver licence"]
  }, {
    description: "Suspension of driver registration - Ind",
    extended: true,
    letters: ["Suspension of vehicle registration - Ind"]
  }, {
    description: "Suspension of driver registration - Corp",
    extended: true,
    letters: ["Suspension of vehicle registration - Corp"]
  }, {
    description: "POI - direction to produce",
    extended: true,
    letters: ["POI - direction to produce"]
  }, {
    description: "PA Refused - Active 7DN",
    extended: true,
    letters: ["PA Refused - Active 7DN"]
  }, {
    description: "No Grounds",
    letters: ["No Grounds"]
  }, {
    description: "PA Refused",
    letters: ["PA Refused"]
  }, {
    description: "EOT Refused",
    letters: ["EOT Refused"]
  }, {
    description: "PA Refused-Sanction",
    letters: ["PA Refused-Sanction"]
  }, {
    description: "PA App Incomplete",
    letters: ["PA App Incomplete"]
  }, {
    description: "Company PA Ineligible SZWIP",
    letters: ["Company PA Ineligible SZWIP"]
  }, {
    description: "EOT Refused - Infringements stage",
    letters: ["EOT Refused - Infringements stage"]
  }, {
    description: "PA Refused Expired 7DN",
    letters: ["PA Refused Expired 7DN"]
  }, {
    description: "Fee Removal PIF",
    letters: ["Fee Removal PIF"]
  }, {
    description: "CF Fee Removal Granted",
    letters: ["CF Fee Removal Granted"]
  }, {
    description: "CF Fee Removal Refused",
    letters: ["CF Fee Removal Refused"]
  }, {
    description: "Fee Removal Refused",
    letters: ["Fee Removal Refused"]
  }, {
    description: "FR Refused - Active 7DN",
    letters: ["FR Refused - Active 7DN"]
  }, {
    description: "FW Refused - Sanction",
    letters: ["FW Refused - Sanction"]
  }, {
    description: "FR Granted",
    agency: true,
    letters: ["FR Granted", "Agency FR Granted"]
  }, {
    description: "FR Granted - Active 7DN",
    agency: true,
    letters: ["FR Granted - Active 7DN", "Agency FR Granted"]
  }, {
    description: "FR Granted - Sanction",
    agency: true,
    letters: ["FR Granted - Sanction", "Agency FR Granted"]
  }, {
    description: "Ineligible for ER - offence type",
    letters: ["Ineligible for ER - offence type"]
  }, {
    description: "Court not an option",
    letters: ["Court not an option"]
  }, {
    description: "ER Ineligible Deregistered Company",
    letters: ["ER Ineligible Deregistered Company"]
  }, {
    description: "Ineligible Paid in full",
    letters: ["Ineligible Paid in full"]
  }, {
    description: "Appeal not available",
    letters: ["Appeal not available"]
  }, {
    description: "Nomination Not Grounds",
    letters: ["Nomination Not Grounds"]
  }, {
    description: "ER Ineligible Court Fine",
    letters: ["ER Ineligible Court Fine"]
  }, {
    description: "Spec Circ Options",
    letters: ["Spec Circ Options"]
  }, {
    description: "ER Additional Info",
    letters: ["ER Additional Info"]
  }, {
    description: "Ineligible for ER enforcement action",
    letters: ["Ineligible for ER enforcement action"]
  }, {
    description: "Ineligible PU - Outside Time",
    letters: ["Ineligible PU - Outside Time"]
  }, {
    description: "Ineligible for ER previous review",
    letters: ["Ineligible for ER previous review"]
  }, {
    description: "ER Ineligible PU",
    letters: ["ER Ineligible PU"]
  }, {
    description: "Claim of payment to agency",
    letters: ["Claim of payment to agency"]
  }, {
    description: "Request for photo evidence",
    letters: ["Request for photo evidence"]
  }, {
    description: "Ineligible Incorrect company applying",
    letters: ["Ineligible Incorrect company applying"]
  }, {
    description: "Spec Circ No Grounds",
    letters: ["Spec Circ No Grounds"]
  }, {
    description: "Spec Circ Report Required",
    letters: ["Spec Circ Report Required"]
  }, {
    description: "Unauthorised 3rd party applying",
    letters: ["Unauthorised 3rd party applying"]
  }, {
    description: "Ineligible Incorrect person applying",
    letters: ["Ineligible Incorrect person applying"]
  }, {
    description: "Spec Circ App Required",
    letters: ["Spec Circ App Required"]
  }, {
    description: "Spec Circ Report Insufficient",
    letters: ["Spec Circ Report Insufficient"]
  }, {
    description: "SC 3P Lawyer - Report Insufficient",
    letters: ["SC 3P Lawyer - Report Insufficient"]
  }, {
    description: "ER Application Incomplete",
    letters: ["ER Application Incomplete"]
  }, {
    description: "SC 3P Lawyer - Report Required",
    letters: ["SC 3P Lawyer - Report Required"]
  }, {
    description: "ER Confirm/FW Grant - Active 7DN",
    letters: ["ER Confirm/FW Grant - Active 7DN"]
  }, {
    description: "ER Confirm/FW Grant - 7DN Expired option",
    letters: ["ER Confirm/FW Grant - 7DN Expired option"]
  }];
  buttons.map(function (button) {
    return generateButton(button, dropDown, options);
  });
  options.map(function (option) {
    return generateOption(option, dropDown);
  });
  var auditCheck = document.createElement('input');
  auditCheck.setAttribute('type', 'checkbox');
  auditCheck.setAttribute('id', 'auditCheck');
  var auditCheckLabel = document.createElement('label');
  auditCheckLabel.appendChild(document.createTextNode('Parse Audit Trail?'));
  auditCheckLabel.appendChild(auditCheck);
  //document.getElementById("NoticesDataGrid").appendChild(auditCheckLabel);

  var email = document.createElement('input');
  email.setAttribute('type', 'radio');
  email.setAttribute('id', 'email');
  email.setAttribute('name', 'method');
  var emailCheckLabel = document.createElement('label');
  emailCheckLabel.appendChild(email);
  emailCheckLabel.className = 'label';
  emailCheckLabel.appendChild(document.createTextNode('Email'));
  dropDown.after(emailCheckLabel);
  var letter = document.createElement('input');
  letter.setAttribute('type', 'radio');
  letter.setAttribute('id', 'letter');
  letter.setAttribute('name', 'method');
  letter.setAttribute('checked', 'checked');
  var letterCheckLabel = document.createElement('label');
  letterCheckLabel.className = 'label';
  letterCheckLabel.appendChild(letter);
  letterCheckLabel.appendChild(document.createTextNode('Letter'));
  dropDown.after(letterCheckLabel);
  document.querySelectorAll('.label').forEach(function (element) {
    element.addEventListener('mouseup', function () {
      updateButton(element);
    });
  });
  function updateButton(element) {
    if (element.innerHTML.includes('Email')) {
      document.getElementById('letterButton').innerText = 'Generate email';
    } else if (element.innerHTML.includes('Letter')) {
      document.getElementById('letterButton').innerText = 'Generate letter(s)';
    }
  }
  var ObSelector = '\
	<tr> \
        <td style="padding: 6px; padding-bottom:0px"> \
			<input type="image" name="DebtorDecisionCtrl$selectAllButton" id="DebtorDecisionCtrl_selectAllButton" tabindex="42" src="' + chrome.runtime.getURL('Images/selectApplicable.png') + '" onclick="selectApplicable(); return false" > \
			<input style="float:left" type="image" name="DebtorDecisionCtrl$selectAllButton" id="DebtorDecisionCtrl_selectAllButton" tabindex="42" src="' + chrome.runtime.getURL('Images/selectenfreview.png') + '" onclick="selectEnforcementReview(); return false" > \
			<input style="float:left" type="image" name="DebtorDecisionCtrl$selectAllButton" id="DebtorDecisionCtrl_selectAllButton" tabindex="42" src="' + chrome.runtime.getURL('Images/selectFVSPEND.png') + '" onclick="selectFVSHolds(); return false" > \
			<input style="float:left" type="image" name="DebtorDecisionCtrl$selectAllButton" id="DebtorDecisionCtrl_selectAllButton" tabindex="42" src="' + chrome.runtime.getURL('Images/selectFVSPEND.png') + '" onclick="selectPAHolds(); return false" > \
		</td> \
    </tr>';
  document.querySelector("#NoticesDataGrid > tbody").insertAdjacentHTML('afterbegin', ObSelector);
}
function addCheckboxes() {
  //Adds checkboxes next to each obligation
  var table = document.getElementById("DebtorNoticesCtrl_DebtorNoticesTable_tblData");
  for (var i = 0, row; row = table.rows[i]; i++) {
    var x = row.insertCell(0);
    var checkbox = document.createElement('input');
    checkbox.setAttribute('type', 'checkbox');
    if (i !== 0) checkbox.setAttribute('name', 'boxes');
    x.appendChild(checkbox);
    if (i === 0) checkbox.setAttribute('onClick', 'toggle(this)');
  }
}
function captureObligationNumbers() {
  //Reference the Table.
  var grid = document.getElementById("DebtorNoticesCtrl_DebtorNoticesTable_tblData");

  //Reference the CheckBoxes in Table.
  var checkBoxes = grid.getElementsByTagName("input");
  var obligationChain = [];
  //Loop through the CheckBoxes.
  for (var i = 1; i < checkBoxes.length; i++) {
    if (checkBoxes[i].checked) {
      var obligationNumber = checkBoxes[i].parentNode.parentNode.children[1].innerHTML;
      obligationChain.push(obligationNumber);
    }
  }
  return obligationChain;
}
function exportData(value) {
  var agency = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  var letters = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
  var extended = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
  var SharePoint = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
  var obligationArray = captureObligationNumbers();
  //	let PAT = document.getElementById('auditCheck').checked;
  var PAT = false;
  //email = false
  var email = document.getElementById('email').checked;
  if (obligationArray.length > 0) {
    var rows = parseTable(document.querySelector("#DebtorNoticesCtrl_DebtorNoticesTable_tblData"));
    var filteredRows = rows.filter(function (row) {
      return Object.values(row)[0] === true;
    });
    console.log(filteredRows);
    var data = [obligationArray, value, null, PAT, email, window.location.host.split(".")[0], filteredRows, agency, letters, extended, SharePoint];
    //saveIT()

    chrome.runtime.sendMessage(data, function (response) {
      console.log(response.farewell);
    });
  } else {
    alert('You need to select at least one obligation');
  }
}
function setAttributes(el, attrs) {
  for (var key in attrs) {
    el.setAttribute(key, attrs[key]);
  }
}

/**
* @license
*
* The MIT License (MIT)
*
* Copyright (c) 2014 Nick Williams
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
* THE SOFTWARE.
*/

/**
 * generates factory functions to convert table rows to objects,
 * based on the titles in the table's <thead>
 * @param  {Array<String>} headings the values of the table's <thead>
 * @return {(row: HTMLTableRowElement) => Object} a function that takes a table row and spits out an object
 */
function mapRow(headings) {
  return function mapRowToObject(_ref) {
    var cells = _ref.cells;
    return _toConsumableArray(cells).reduce(function (result, cell, i) {
      var input = cell.querySelector("input,select");
      var value;
      if (input) {
        value = input.type === "checkbox" ? input.checked : input.value;
      } else if (headings[i] === "Offence") {
        value = cell.title;
      } else {
        value = cell.innerText;
      }
      return Object.assign(result, _defineProperty({}, headings[i], value));
    }, {});
  };
}

/**
 * given a table, generate an array of objects.
 * each object corresponds to a row in the table.
 * each object's key/value pairs correspond to a column's heading and the row's value for that column
 *
 * @param  {HTMLTableElement} table the table to convert
 * @return {Array<Object>}       array of objects representing each row in the table
 */
function parseTable(table) {
  var headings = _toConsumableArray(table.tHead.rows[0].cells).map(function (heading) {
    return heading.innerText.replace(" ▲ 1", "").replace(" ▼ 1", "").replace(" ▼ 2", "").replace(" ▲ 2", "");
  });
  return _toConsumableArray(table.tBodies[0].rows).map(mapRow(headings));
}
})();

/******/ })()
;
//# sourceMappingURL=obligations.js.map