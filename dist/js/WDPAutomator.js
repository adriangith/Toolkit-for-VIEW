/******/ (() => { // webpackBootstrap
/*!********************************!*\
  !*** ./src/js/WDPAutomator.js ***!
  \********************************/
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
var DataTable;
var obStatus;
var aggregateId;
function find_str(array) {
  for (var i = 0; i < array.length; i++) {
    if (array[i][0].includes("idToken")) {
      return array[i][1];
    }
  }
}
function WDPAutomator(elem) {
  $.getScript(chrome.runtime.getURL('js/External/dataTables.select.min.js'));
  var obligation1;
  var addExternalInfrigementsButton = elem;
  addInfringementsFromViewButton = ViewButton(addExternalInfrigementsButton);
  $('body').append('<script id="script">$(document).ready(function(){$(\'[data-toggle=\"tooltip\"]\').tooltip(); }); <' + '/' + 'script>');
  addInfringementsFromViewButton.addEventListener("click", function () {
    var obligations = [];

    // Check if the element with id "obligationNumber1" exists
    var obligationNumber1 = document.getElementById("obligationNumber1");
    if (obligationNumber1) {
      // If it exists, get its value
      obligations.push(document.getElementById("obligationNumber1").value);
      obligations.push(document.getElementById("obligationNumber2").getAttribute("ng-reflect-model"));
      obligations.push(document.getElementById("obligationNumber3").getAttribute("ng-reflect-model"));
    } else {
      // If it doesn't exist, get the value of the element with id "notes"

      var notesValue = document.querySelector("#notes").value;
      if (notesValue.length !== 10 || !/^\d+$/.test(notesValue)) {
        alert('Obligation number stored in note field must be exactly 10 characters long and contain only numbers.');
      }
      obligations.push(notesValue);
    }
    var message = {
      "type": "Initialise",
      "data": obligations
    };
    $("#table").html("<div class=\"lds-ring\"><div></div><div></div><div></div><div></div></div>");
    chrome.runtime.sendMessage(message, function (response) {
      console.log(response);
      response.payload !== false ? convertToHTMLTable(response.payload) : $("#table").html("Obligation not found. Please make sure that you are logged into VIEW and that you have you have typed a valid obligation number into the 'Obligation number 1' field");
    });
  });
}
function clean() {
  document.getElementById("script").parentNode.removeChild(document.getElementById("script"));
  //document.getElementById("ViewButton").parentNode.removeChild(document.getElementById("ViewButton"))
  //document.getElementById("exampleModal").parentNode.removeChild(document.getElementById("exampleModal"))
}
function ViewButton(addExternalInfrigementsButton) {
  var addInfringementsFromViewButton = document.createElement("button");
  var modalWrap = document.createElement("span");
  modalWrap.setAttribute("data-toggle", "modal");
  modalWrap.setAttribute("data-target", "#exampleModal");
  addInfringementsFromViewButton.className = "btn btn-primary pull-left";
  addInfringementsFromViewButton.id = "ViewButton";
  addInfringementsFromViewButton.textContent = "Show obligations from VIEW";
  addInfringementsFromViewButton.setAttribute("data-toggle", "tooltip");
  addInfringementsFromViewButton.setAttribute("title", "Caution: Using this feature may change your active debtor and obligation in VIEW");
  modalWrap.appendChild(addInfringementsFromViewButton);
  var button = addExternalInfrigementsButton.querySelector('button');
  button.parentNode.insertBefore(modalWrap, button.nextSibling);
  // addExternalInfrigementsButton.parentNode.lastChild.previousSibling.previousSibling.previousSibling.firstChild.nextSibling.appendChild(modalWrap)
  return addInfringementsFromViewButton;
}
function addModal() {
  var modal = "\n\t\t<div class=\"modal fade\" id=\"exampleModal\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"exampleModalLabel\" aria-hidden=\"true\">\n  <div class=\"modal-dialog\" role=\"document\">\n    <div class=\"modal-content\">\n      <div class=\"modal-header\">\n        <h5 class=\"modal-title\" id=\"exampleModalLabel\">Obligations from VIEW</h5>\n        <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\">\n          <span aria-hidden=\"true\">&times;</span>\n        </button>\n      </div>\n      <div class=\"modal-body\">\n\t\t<div id=\"table\">\n\t\t\n\t\t</div>\n      </div>\n      <div class=\"modal-footer\">\n        <button type=\"button\" class=\"btn btn-secondary\" data-dismiss=\"modal\">Close</button>\n        <button id=\"submit\" type=\"button\" class=\"btn btn-primary\" data-dismiss=\"modal\">Add to WDP</button>\n\t\t<button type=\"button\" class=\"btn btn-primary\">Place Holds</button>\n      </div>\n    </div>\n  </div>\n</div>\n\t";
  modal = $.parseHTML(modal);
  $('body').prepend(modal);
}
function convertToHTMLTable(rows) {
  var html = '<table id="example" class="table table-striped table-bordered" style="width:100%">';
  html += '<thead><tr>';
  for (var j in rows[0]) {
    html += '<th>' + j + '</th>';
  }
  html += '</tr></thead>';
  for (var i = 0; i < rows.length; i++) {
    html += '<tr>';
    for (var j in rows[i]) {
      html += '<td>' + rows[i][j] + '</td>';
    }
    html += '</tr>';
  }
  html += '</table>';
  document.getElementById('table').innerHTML = html;
  DataTable = $("#example").DataTable({
    "dom": 'Blfrtip',
    "ordering": true,
    "paging": false,
    "select": {
      "style": "multi"
    },
    "buttons": ["selectAll", "selectNone"],
    "language": {
      "buttons": {
        "selectAll": "Select all items",
        "selectNone": "Select none"
      }
    }
  });
}
$(document).ready(function () {
  var $app = $("body");
  addModal();
  $app.livequery("div:contains(Add external infringements)", function (elem) {
    WDPAutomator(elem);
  }, function () {
    clean();
  });
  document.getElementById("submit").addEventListener("click", function () {
    //Get the current WDP application from the page and store in aggregateId global variable
    aggregateId = parseInt($("[for=WDPApplicationId]")[0].parentNode.textContent.match(/[^-]+$/)[0].replace(/\s/g, ''));
    var currentWDPInfringements = getCurrentWDPInfringements(aggregateId);
    var data = DataTable.rows({
      selected: true
    }).data();
    if (data.length === 0) {
      alert("You must select at least one obligation");
      throw "No Obligations Selected";
    }
    var obligations = [];
    obStatus = [];
    for (var i = 0; i < data.length; i++) {
      obligations.push(data[i][0]);
      obStatus[data[i][0]] = data[i][3];
    }
    var message = {
      "type": "Scrape",
      "data": obligations
    };
    waitingDialog.show('Getting obligation data from VIEW');
    $("#prog").addClass("in");
    waitingDialog.progress(0);
    chrome.runtime.sendMessage(message, /*#__PURE__*/function () {
      var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(response) {
        var i, j, temparray, chunk, r, array, slicedArray;
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              waitingDialog.hide();
              chunk = 15;
              r = 0;
              array = response.payload.a;
              _context.next = 6;
              return currentWDPInfringements;
            case 6:
              currentWDPInfringements = _context.sent;
              array = array.filter(function (obl) {
                return !currentWDPInfringements.includes(obl.Infringement);
              });
              console.log(array);
              slicedArray = [];
              for (i = 0, j = array.length; i < j; i += chunk) {
                slicedArray.push(array.slice(i, i + chunk));
              }
              batchRequests(slicedArray, response.payload, obStatus).then(function (res) {
                var selectedApplication = "WDP-".concat(aggregateId);
                var $app = $("body");
                // Get all buttons on the page
                $app.livequery("button:contains(Save)", function (elem) {
                  elem.click();
                });
                $app.livequery("#content > app-root > div > app-approved-wdp > div:nth-child(2) > div > div > a", function (elem) {
                  elem.click();
                });

                // Select the target node
                var targetNode = document.documentElement; // You can choose a more specific target if needed

                // Options for the observer (in this case, we want to observe the addition of nodes)
                var config = {
                  childList: true,
                  subtree: true
                };

                // Callback function to execute when mutations are observed
                var callback = function callback(mutationsList, observer) {
                  var _iterator = _createForOfIteratorHelper(mutationsList),
                    _step;
                  try {
                    for (_iterator.s(); !(_step = _iterator.n()).done;) {
                      var mutation = _step.value;
                      if (mutation.type === 'childList') {
                        // Check if nodes were added
                        if (mutation.addedNodes.length > 0) {
                          // Check if any of the added nodes has the ID 'global_filter'
                          var addedNodesArray = Array.from(mutation.addedNodes);
                          var filteredNodesArray = addedNodesArray.filter(function (node) {
                            return typeof node.id === 'string' && node.id !== '';
                          });
                          var globalFilterAdded = filteredNodesArray.some(function (node) {
                            return node.id === 'wdps-data-table';
                          });
                          setTimeout(function () {
                            observer.disconnect();
                          }, 8000); // 5000 milliseconds (5 seconds)

                          if (globalFilterAdded) {
                            try {
                              var globalFilter = document.getElementById('global_filter');
                              globalFilter.value = selectedApplication;
                              globalFilter.click();
                              $('button:contains("View")').click();
                            } catch (error) {
                              // Handle errors
                              console.error('Error:', error.message);
                            } finally {
                              // Disconnect the observer in the finally block
                              observer.disconnect();
                              //console.log('Observer disconnected');
                            }

                            // Disconnect the observer to stop further observations
                          }
                        }
                      }
                    }
                  } catch (err) {
                    _iterator.e(err);
                  } finally {
                    _iterator.f();
                  }
                };

                // Create a new obsersver with the specified callback and options
                var observer = new MutationObserver(callback);

                // Start observing the target node for configured mutations
                observer.observe(targetNode, config);
              });
            case 12:
            case "end":
              return _context.stop();
          }
        }, _callee);
      }));
      return function (_x) {
        return _ref.apply(this, arguments);
      };
    }());
  });
});
function selectApplication(searchbar) {
  var $app = $("body");
  searchbar.value = "WDP-127";
  searchbar.focus();
}
function submitToWDP(obdata, fulldata, obStatus) {
  console.log(obdata);
  var date = new Date();
  var dateISO = date.toISOString();
  var FillerDate;
  var DateofIssue = new Date();
  var DateofBirth = new Date();
  if (obdata["Date of Issue"] !== "") {
    DateofIssue = obdata["Date of Issue"].split("/");
    DateofIssue = new Date(+DateofIssue[2], DateofIssue[1] - 1, +DateofIssue[0]).toISOString();
  }
  if (obdata["Date_of_Birth"] !== "") {
    DateofBirth = obdata["Date_of_Birth"].split("/");
    DateofBirth = new Date(+DateofBirth[2], DateofBirth[1] - 1, +DateofBirth[0]).toISOString();
  }
  var DateofOffence = "";
  if (obdata["Date_of_Offence"] !== "") {
    if (obdata["Offence Time"] !== "") {
      DateofOffence = obdata["Date_of_Offence"].split("/").concat(obdata["Offence Time"].split(":"));
      DateofOffence = new Date(DateofOffence[2], DateofOffence[1] - 1, +DateofOffence[0], +DateofOffence[3], +DateofOffence[4], +DateofOffence[5]);
      FillerDate = new Date(DateofOffence);
      DateofOffence.toISOString();
    } else {
      DateofOffence = obdata["Date_of_Offence"].split("/");
      DateofOffence = new Date(DateofOffence[2], DateofOffence[1] - 1, +DateofOffence[0]);
      FillerDate = new Date(DateofOffence);
      DateofOffence = DateofOffence.toISOString();
    }
  }
  if (obdata["Date of Issue"] === "") {
    DateofIssue.setHours(FillerDate.getHours() - 1);
    DateofIssue.toISOString();
  }
  var Obligation = obdata.Obligation;
  var isVariationPresent = window.location.href.includes('/wdp-applications/variation');
  var commandType = isVariationPresent ? 'addObligationToWDPVariationCommand' : 'addExternalEnforcementAgenciesObligationCommand';
  var sequence = isVariationPresent ? 'obligation' : 'externalEnforcementAgenciesObligation';
  var eventType = isVariationPresent ? 35 : 12;
  var baseCharge = parseFloat(obdata["Reduced_Charge"].replace(/\$/g, '')) + parseFloat(obdata["Court_Fine"].replace(/\$/g, '')) + parseFloat(obdata["Court_Costs"].replace(/\$/g, ''));
  var amountFee = parseFloat(obdata["Penalty_Reminder_Fee"].replace(/\$/g, '')) + parseFloat(obdata["Registration_Fee"].replace(/\$/g, '')) + parseFloat(obdata["Enforcement_Fee"].replace(/\$/g, '')) + parseFloat(obdata["Warrant_Issue_Fee"].replace(/\$/g, '')) + parseFloat(obdata["Amount_Waived"].replace(/\$/g, ''));
  var amountDueAndFee = (amountFee + baseCharge).toString();
  var body = [_defineProperty({
    "commandTimeStamp": dateISO,
    "eventType": eventType
  }, commandType, _defineProperty({
    "aggregateId": aggregateId,
    "commandEventType": eventType,
    "commandTimeStamp": dateISO,
    "latestTimeStamp": dateISO
  }, sequence, {
    "debtorID": obdata.DebtorID,
    "debtorDateOfBirth": DateofBirth,
    "infringementNumber": obdata.Infringement,
    "infringementNoticeIssueDate": DateofIssue,
    "issuingAgency": obdata.issuingAgency,
    "infringementIndicator": obStatus[Obligation] === "NFDP" ? "NFD" : (obStatus[Obligation] === "CHLGLOG" || obStatus[Obligation] === "PAID") && parseInt(obdata["Warrant_Issue_Fee"].replace(/\$/g, '')) > 0 ? "EW" : (obStatus[Obligation] === "CHLGLOG" || obStatus[Obligation] === "PAID") && parseInt(obdata["Enforcement_Fee"].replace(/\$/g, '')) > 0 ? "NFD" : (obStatus[Obligation] === "CHLGLOG" || obStatus[Obligation] === "PAID") && parseInt(obdata["Penalty_Reminder_Fee"].replace(/\$/g, '')) > 0 ? "PRN" : (obStatus[Obligation] === "CHLGLOG" || obStatus[Obligation] === "PAID") && parseInt(obdata["Penalty_Reminder_Fee"].replace(/\$/g, '')) === 0 ? "I" : obStatus[Obligation] === "SELENF" ? "PRN" : obStatus[Obligation] === "SELDEA" ? "NFD" : obStatus[Obligation] === "WARRNT" ? "EW" : obStatus[Obligation] === "INF" ? "I" : obStatus[Obligation] === "INFP" ? "I" : obStatus[Obligation] === "PRN" ? "PRN" : obStatus[Obligation] === "PRNP" ? "PRN" : "NFD",
    "enforcementAgencyID": obdata["enforcementAgencyID"],
    "enforcementAgencyCode": obdata["enforcementAgencyCode"],
    "offenceCode": obdata["Offence_Code"],
    "offenceCodeDescription": obdata["Offence_Description"],
    "enforcementAgencyName": obdata["Agency"],
    "offenceStreetSuburb": obdata["Offence Location"],
    "offenceStreetandSuburb": obdata["Offence Location"],
    "offenceDateTime": DateofOffence,
    "registrationStatePlate": obdata["Driver License State"] + " " + obdata["VRM Number"],
    "amountDueAndFee": amountDueAndFee,
    // Total Amount Owing
    "amountDue": baseCharge,
    // Original penalty amount
    "amountFee": amountFee,
    // All fees
    "debtorName": fulldata.First_Name + " " + fulldata.Last_Name,
    "debtorAddressLine1": fulldata.Address_1,
    "debtorAddressSuburb": fulldata.Town,
    "debtorAddressState": fulldata.State,
    "debtorAddressPostCode": fulldata.Post_Code,
    "debtorLicenceState": obdata["Driver License State"] + " " + obdata["Driver License No."],
    "wdpHoldStatusID": parseInt(obdata["Balance_Outstanding"].replace(/\$/g, '')) <= 0 || obStatus[Obligation] === "CHLGLOG" || obStatus[Obligation] === "PAID" || obStatus[Obligation] === "CANCL" ? 97 : 96,
    "eligibility": parseInt(obdata["Balance_Outstanding"].replace(/\$/g, '')) <= 0 || obStatus[Obligation] === "CHLGLOG" || obStatus[Obligation] === "PAID" || obStatus[Obligation] === "CANCL" ? "INELIGIBLE" : "ELIGIBLE",
    "workedOffAmount": 0,
    "manualAdjustmentAmount": Math.abs(parseFloat(obdata['Amount_Paid'].replace(/\$/g, '')))
  }))];
  if (isVariationPresent) {
    body[0].addObligationToWDPVariationCommand["wdpVariationID"] = 6;
  }
  if (isVariationPresent) {
    body[0].addObligationToWDPVariationCommand["obligation"]["obligationNumber"] = obdata.Obligation;
  }
  body = JSON.stringify(body);
  apiUrl = location.hostname === "uat.wdp.vic.gov.au" ? "uatapi" : location.hostname === "uat2.wdp.vic.gov.au" ? "uat2api" : "api";
  var data = fetch("https://" + apiUrl + ".wdp.vic.gov.au/api/WorkDevelopmentPermit/SubmitListOfCommands", {
    // "credentials": "include",
    "headers": {
      "accept": "application/json; charset=UTF-8",
      "authorization": find_str(Object.entries(localStorage)),
      "cache-control": "no-cache",
      "content-type": "application/json; charset=UTF-8",
      "expires": "-1",
      "pragma": "no-cache"
    },
    "referrer": "https://" + location.hostname + "/wdp-applications/external-enforcement-agencies-list?filter=submitted",
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": body,
    "method": "POST",
    "mode": "cors"
  });
  return data;
}
chrome.storage.onChanged.addListener(function (changes, namespace) {
  for (var key in changes) {
    chrome.storage.local.get(['obligationsCountFixed'], function (items) {
      if (changes.obligationsCount !== undefined) {
        var progress = Math.ceil(100 - (changes.obligationsCount.newValue - 1) / items.obligationsCountFixed * 100);
        waitingDialog.progress(progress, 100);
      }
    });
  }
});
function batchRequests(obdata, fulldata, obStatus) {
  return new Promise(function (resolve, reject) {
    var results = [];
    var index = 0;
    function next() {
      if (index < obdata.length) {
        Promise.all(obdata[index++].map(function (ob) {
          return submitToWDP(ob, fulldata, obStatus);
        })).then(function (data) {
          results.push(data);
          setTimeout(function () {
            next();
          }, 1000);
        }, reject);
      } else {
        resolve(results);
      }
    }
    // start first iteration
    next();
  });
}
function getCurrentWDPInfringements(_x2) {
  return _getCurrentWDPInfringements.apply(this, arguments);
}
function _getCurrentWDPInfringements() {
  _getCurrentWDPInfringements = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(appNumber) {
    var res, jsonData, infringementNumbers;
    return _regeneratorRuntime().wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          apiUrl = location.hostname === "uat.wdp.vic.gov.au" ? "uatapi" : location.hostname === "uat2.wdp.vic.gov.au" ? "uat2api" : "api";
          _context2.next = 3;
          return fetchResource("https://" + apiUrl + ".wdp.vic.gov.au/api/WorkDevelopmentPermit/" + appNumber, {
            "credentials": "include",
            "headers": {
              "accept": "application/json; charset=UTF-8",
              "authorization": find_str(Object.entries(localStorage)),
              "cache-control": "no-cache",
              "content-type": "application/json",
              "expires": "-1",
              "pragma": "no-cache"
            },
            "referrer": "https://" + location.hostname + "/wdp-applications/app-wdp-list?filter=inProgress",
            "referrerPolicy": "no-referrer-when-downgrade",
            "body": null,
            "method": "GET",
            "mode": "cors"
          });
        case 3:
          res = _context2.sent;
          _context2.next = 6;
          return res.json();
        case 6:
          jsonData = _context2.sent;
          infringementNumbers = [];
          jsonData.externalEnforcementAgenciesObligations.map(function (ob) {
            infringementNumbers.push(ob.infringementNumber);
          });
          return _context2.abrupt("return", infringementNumbers);
        case 10:
        case "end":
          return _context2.stop();
      }
    }, _callee2);
  }));
  return _getCurrentWDPInfringements.apply(this, arguments);
}
function fetchResource(input, init) {
  return new Promise(function (resolve, reject) {
    chrome.runtime.sendMessage({
      input: input,
      init: init
    }, function (messageResponse) {
      var _messageResponse = _slicedToArray(messageResponse, 2),
        response = _messageResponse[0],
        error = _messageResponse[1];
      if (response === null) {
        reject(error);
      } else {
        // Use undefined on a 204 - No Content
        var body = response.body ? new Blob([response.body]) : undefined;
        resolve(new Response(body, {
          status: response.status,
          statusText: response.statusText
        }));
      }
    });
  });
}
function addStyleString(str) {
  var node = document.createElement('style');
  node.innerHTML = str;
  document.body.appendChild(node);
}
addStyleString(".lds-ring {\n\tdisplay: block;\n\tposition: relative;\n\twidth: 80px;\n\theight: 80px;\n\tmargin: auto;\n  }\n  .lds-ring div {\n\tbox-sizing: border-box;\n\tdisplay: block;\n\tposition: absolute;\n\twidth: 64px;\n\theight: 64px;\n\tmargin: auto;\n\tborder: 8px solid #e7e7e7;\n\tborder-radius: 50%;\n\tanimation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;\n\tborder-color: #e7e7e7 transparent transparent transparent;\n\tdisplay: flex;\n\talign-items: center\n  }\n  .lds-ring div:nth-child(1) {\n\tanimation-delay: -0.45s;\n  }\n  .lds-ring div:nth-child(2) {\n\tanimation-delay: -0.3s;\n  }\n  .lds-ring div:nth-child(3) {\n\tanimation-delay: -0.15s;\n  }\n  @keyframes lds-ring {\n\t0% {\n\t  transform: rotate(0deg);\n\t}\n\t100% {\n\t  transform: rotate(360deg);\n\t}\n  }\n  ");
/******/ })()
;
//# sourceMappingURL=WDPAutomator.js.map