/******/ (() => { // webpackBootstrap
/*!******************************!*\
  !*** ./src/js/bankruptcy.js ***!
  \******************************/
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
var opts = {
  lines: 13,
  // The number of lines to draw
  length: 38,
  // The length of each line
  width: 17,
  // The line thickness
  radius: 45,
  // The radius of the inner circle
  scale: .3,
  // Scales overall size of the spinner
  corners: 1,
  // Corner roundness (0..1)
  color: '#43088e',
  // CSS color or array of colors
  fadeColor: 'transparent',
  // CSS color or array of colors
  speed: 1,
  // Rounds per second
  rotate: 0,
  // The rotation offset
  animation: 'spinner-line-fade-default',
  // The CSS animation name for the lines
  direction: 1,
  // 1: clockwise, -1: counterclockwise
  zIndex: 2e9,
  // The z-index (defaults to 2000000000)
  className: 'spinner',
  // The CSS class to assign to the spinner
  top: '35px',
  // Top position relative to parent
  left: '50%',
  // Left position relative to parent
  shadow: '0 0 1px transparent',
  // Box-shadow for the lines
  position: 'relative' // Element positioning
};
function bankruptcy() {
  return _bankruptcy.apply(this, arguments);
}
function _bankruptcy() {
  _bankruptcy = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
    var ph, ctrlTemplate, bankruptcyCtrl, registerCtrl, dataArea, regSpinner, appsSpinner, taskPage, formData, table, tableData, registerDataTable, indexes, debtorTable, debtorDataTable;
    return _regeneratorRuntime().wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          ph = "ctl00$mainContentPlaceHolder$taskSearchControl$"; //Remove Address control
          document.getElementById("DebtorAddressCtrl").remove();

          //Make a template for controls
          ctrlTemplate = function ctrlTemplate(props) {
            return "\n    <table id=\"".concat(props.Ctrl, "\" cellspacing=\"0\" cellpadding=\"0\" width=\"100%\" class=\"Ctrl\">\n        <tbody>\n            <tr>\n                <td>\n                    <div class=\"menu-header\">\n                        <span id=\"").concat(props.header, "\" >").concat(props.name, "</span>\n                    </div>\n                    <div id=\"").concat(props.body, "\">\n                        <table class=\"bordertable\">\n                            <tbody>\n                                <tr>\n                                    <td class=\"tdRowspace\"></td>\n                                </tr>\n                                <tr>\n                                    <td id=\"").concat(props.id, "\" style=\"padding:6px\">\n                                        <div class=\"placeholder\" id=\"").concat(props.id, "1\"></div>\n                                        <table class=\"target\"></table>\n                                    </td>\n                                </tr>\n                            </tbody>\n                        </table>\n                    </div>\n                </td>\n            </tr>\n        </tbody>\n    </table>");
          }; //Create debtor bankruptcy control
          bankruptcyCtrl = ctrlTemplate({
            Ctrl: "DebtorBankruptcyCtrl",
            id: "apps",
            header: "DebtorBankruptcyCtrl_lblDebtorBankruptcyNotifications",
            name: "Debtor: Bankruptcy Notifications",
            body: "DebtorBankruptcyCtrll_debtorBankruptcyNotification"
          }); //Create register control
          registerCtrl = ctrlTemplate({
            Ctrl: "BankruptcyRegisterCtrl",
            id: "reg",
            header: "DebtorRegisterCtrl_lblBankrutcyRegister",
            name: "Bankruptcy Register",
            body: "DebtorRegisterCtrll_BankrutcyRegister"
          }); //Get container for controls
          dataArea = document.querySelector("td.dataArea"); //Append debtor bankruptcy control to DOM
          dataArea.insertAdjacentHTML('beforeend', bankruptcyCtrl);

          //Append register control to DOM
          dataArea.insertAdjacentHTML('beforeend', registerCtrl);

          //Add buttons
          addButtons("#DebtorBankruptcyCtrl", "New Application");
          addButtons("#BankruptcyRegisterCtrl", "Check Holds");

          //Add spinner
          regSpinner = new Spin.Spinner(opts).spin(document.getElementById("reg1"));
          appsSpinner = new Spin.Spinner(opts).spin(document.getElementById("apps1")); //Get stateless task page
          _context.next = 14;
          return getHTMLDocument("https://".concat(document.location.host.split('.')[0], ".view.civicacloud.com.au/Taskflow/Forms/Management/TaskMaintenance.aspx?ProcessMode=User"), "get");
        case 14:
          taskPage = _context.sent;
          //Get form data from task page
          formData = getFormData(taskPage, _defineProperty(_defineProperty(_defineProperty(_defineProperty({}, "".concat(ph, "statusText"), "OPEN"), "".concat(ph, "taskTypeText"), "FVBANKRUPT"), "".concat(ph, "taskSearchButton.x"), 0), "".concat(ph, "taskSearchButton.y"), 0)); //Get stateful task page
          _context.next = 18;
          return getHTMLDocument("https://".concat(document.location.host.split('.')[0], ".view.civicacloud.com.au/Taskflow/Forms/Management/TaskMaintenance.aspx?ProcessMode=User"), "post", formData);
        case 18:
          taskPage = _context.sent;
          if (!(taskPage.querySelector('[id*="goToPageText"]') !== null)) {
            _context.next = 24;
            break;
          }
          formData = getFormData(taskPage, _defineProperty(_defineProperty(_defineProperty({}, "".concat(ph, "goToPageText"), "00"), "".concat(ph, "goToButton.x"), 0), "".concat(ph, "goToButton.y"), 0));
          _context.next = 23;
          return getHTMLDocument("https://".concat(document.location.host.split('.')[0], ".view.civicacloud.com.au/Taskflow/Forms/Management/TaskMaintenance.aspx?ProcessMode=User"), "post", formData);
        case 23:
          taskPage = _context.sent;
        case 24:
          //Sanitise table
          table = sanitiseTable(taskPage.querySelector("#ctl00_mainContentPlaceHolder_taskSearchControl_taskSearchGrid")); //Convert table to array of objects
          tableData = parseTable(table); //Remove white space and special characters from property keys
          tableData = tableData.map(function (row) {
            var newRow = {};
            Object.keys(row).forEach(function (key) {
              newRow[key.replace(/\.|\-|\?|[(]|\//g, "").replace(/\)/g, "").replace(/ /g, "").trim()] = row[key];
            });
            return newRow;
          });

          //Expand task description
          tableData = tableData.map(function (row) {
            var descriptionArray = row.Description.split(/:|,/);
            var descriptionObject = {
              "Status": "",
              "AFSA Reference": "",
              "Date of Bankruptcy": ""
            };
            var newRow = {};
            descriptionArray.some(function (item, index) {
              if (index % 2 === 0 && descriptionArray.length > 1) {
                console.log(descriptionObject);
                descriptionObject[item.trim()] = descriptionArray[index + 1].trim();
              }
              return index > 4;
            });
            descriptionObject["Date of Bankruptcy"] = descriptionObject["Date of Bankruptcy"].substring(0, 10);
            newRow.TaskId = "<a href = 'https://".concat(window.location.host.split('.')[0], ".view.civicacloud.com.au/Taskflow/Forms/Management/TaskMaintenance.aspx?TaskId=").concat(row.TaskId, "&ProcessMode=User'>").concat(row.TaskId, "</a>");
            newRow.TaskIdRaw = row.TaskId;
            newRow.DebtorId = row.ModRef;
            newRow.ModRef = "<a href='javascript:document.getElementById(\"DebtorDetailsCtrl_DebtorIdSearch\").value = ".concat(row.ModRef, "; document.getElementById(\"DebtorDetailsCtrl_debtorIdTextBoxButton\").click()'>").concat(row.ModRef, "</a>");
            newRow.TaskType = row.TaskType;
            return newRow = _objectSpread(_objectSpread({}, newRow), descriptionObject);
          });
          $.fn.dataTable.moment('DD/MM/YYYY');

          //Create register datatable
          registerDataTable = makeDataTable(tableData, "#reg > table", [{
            "data": "TaskId",
            "title": "Task Id"
          }, {
            "data": "Status",
            "title": "Status",
            "width": "100%"
          }, {
            "data": "AFSA Reference",
            "title": "AFSA Reference"
          }, {
            "data": "Date of Bankruptcy",
            "title": "Date of Bankruptcy"
          }, {
            "data": "ModRef",
            "title": "Debtor ID"
          }, {
            "data": "DebtorId",
            "title": "DebtorId",
            "visible": false
          }, {
            "data": "TaskIdRaw",
            "title": "TaskIdRaw",
            "visible": false
          }], [{
            extend: 'excelHtml5',
            autoFilter: true,
            title: null,
            filename: function filename() {
              return "Bankruptcy and Debt Agreements Register - As of " + moment(new Date()).format("DD-MM-YYYY");
            },
            exportOptions: {
              columns: ':visible'
            }
          }]); //Get rows, if any, that match current debtor id
          indexes = registerDataTable.rows().eq(0).filter(function (rowIdx) {
            return registerDataTable.cell(rowIdx, 5).data() === document.getElementById("DebtorDetailsCtrl_DebtorIdSearch").value.trim() ? true : false;
          }); //Extract the rows from the register data table that match current debtor id
          debtorTable = registerDataTable.rows(indexes).data(0).toArray(); //Create datatable for current debtor
          debtorDataTable = makeDataTable(debtorTable, "#apps > table", [{
            "data": "TaskId",
            "title": "Task Id"
          }, {
            "data": "Status",
            "title": "Status",
            "width": "100%"
          }, {
            "data": "AFSA Reference",
            "title": "AFSA Reference"
          }, {
            "data": "Date of Bankruptcy",
            "title": "Date of Bankruptcy"
          }, {
            "data": null,
            "title": "Actions",
            "defaultContent": "<span class=\"updateButton mybutton\" onClick='return false;'>Update</span>"
          }], []); //Remove spinners
          document.querySelectorAll(".placeholder").forEach(function (element) {
            return element.remove();
          });

          //Add gridheader class to table rows
          document.querySelectorAll(".target > thead > tr").forEach(function (element) {
            return element.className = "gridheader";
          });
          document.querySelectorAll(".updateButton").forEach(function (element) {
            element.addEventListener("mouseup", function () {
              postData({
                taskNote: "updateBankruptcy",
                source: document.location.host.split('.')[0],
                debtorid: document.getElementById('DebtorDetailsCtrl_DebtorIdSearch').value,
                taskId: element.parentElement.parentElement.firstElementChild.textContent,
                pages: ["uploadDocuments", "bankruptcyDate", "removeHolds", "placeHolds", "liftProceduralHolds", "proceduralHolds", "taskNote", "application", "letter", "finish"]
              });
            });
          });
        case 36:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }));
  return _bankruptcy.apply(this, arguments);
}
bankruptcy();
function getHTMLDocument(_x, _x2, _x3) {
  return _getHTMLDocument.apply(this, arguments);
}
function _getHTMLDocument() {
  _getHTMLDocument = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(url, method, body) {
    var parser, opts, res, resText;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          parser = new DOMParser();
          opts = {
            method: method
          };
          if (body) {
            opts.body = new URLSearchParams(body);
          }
          _context2.next = 5;
          return fetch(url, opts);
        case 5:
          res = _context2.sent;
          _context2.next = 8;
          return res.text();
        case 8:
          resText = _context2.sent;
          return _context2.abrupt("return", parser.parseFromString(resText, "text/html"));
        case 10:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  }));
  return _getHTMLDocument.apply(this, arguments);
}
function getFormData(parsedDocument, formDataToAppend) {
  var formData = new FormData(parsedDocument.querySelector('form'));
  for (var _i = 0, _Object$entries = Object.entries(formDataToAppend); _i < _Object$entries.length; _i++) {
    var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
      key = _Object$entries$_i[0],
      value = _Object$entries$_i[1];
    formData.set(key, value);
  }
  return formData;
}
function sanitiseTable(table) {
  var headerRow = table.firstElementChild.firstElementChild;
  var thead = document.createElement('thead');
  table.insertAdjacentElement('afterbegin', thead);
  thead.append(headerRow);
  return table;
}
function setAttributes(el, attrs) {
  for (var key in attrs) {
    el.setAttribute(key, attrs[key]);
  }
}
function makeDataTable(tableData, target, columns, buttons) {
  var opts = {
    "data": tableData,
    "dom": 'rt<"clear"><"bottom"lpi>fB',
    "pageLength": 10,
    "lengthMenu": [[-1, 5, 10, 20, 30, 40, 50], ["All Records", "5 Records per page", "10 Records per page", "20 Records per page", "30 Records per page", "40 Records per page", "50 Records per page"]],
    "bFilter": false,
    "language": {
      "emptyTable": "No current notification of bankruptcy"
    },
    "oLanguage": {
      "sInfo": "<b>Results</b>: _START_-_END_ of _TOTAL_",
      "sLengthMenu": "_MENU_",
      "oPaginate": {
        "sNext": "Next >>",
        "sPrevious": "&lt&lt Last"
      }
    }
  };
  buttons && (opts.buttons = buttons);
  opts.columns = columns;
  var dataTable = $(document.querySelector(target)).DataTable(opts);
  return dataTable;
}
function postData(data) {
  chrome.runtime.sendMessage({
    validate: new URL(document.location).searchParams.get("mode"),
    data: data
  });
}
function addButtons(parentElement, buttonText) {
  var tr = document.createElement('tr');
  var td = document.createElement('td');
  var button = document.createElement('span');
  tr.append(td);
  td.append(button);
  button.innerText = buttonText;
  setAttributes(button, {
    onclick: "return false",
    style: "cursor: hand",
    "class": "mybutton"
  });
  setAttributes(td, {
    "class": "tdButtons",
    align: "right"
  });
  document.querySelector("".concat(parentElement, " .bordertable > tbody")).insertAdjacentElement('beforeend', tr);
  button.addEventListener("mouseup", function () {
    if (!confirm("Are you sure you wish to create a new bankruptcy task?")) return;
    postData({
      taskNote: "createBankruptcy",
      source: document.location.host.split('.')[0],
      debtorid: document.getElementById('DebtorDetailsCtrl_DebtorIdSearch').value,
      pages: ["bankruptcyDate", "removeHolds", "placeHolds", "liftProceduralHolds", "proceduralHolds", "letter", "uploadDocuments", "application", "debtorNote", "taskNote", "finish"]
    });
  });
}
/******/ })()
;
//# sourceMappingURL=bankruptcy.js.map