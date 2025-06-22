import * as wizardLogic from './notes';
import VIEWsubmit from './VIEWSubmit';
import { Api } from 'datatables.net';
import { VIEWsubmitParams } from './types.js';

const __assign = (this && this.__assign) || function () {
  __assign = Object.assign || function (t: { [x: string]: any; }) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (const p in s) if (Object.prototype.hasOwnProperty.call(s, p))
        t[p] = s[p];
    }
    return t;
  };
  return __assign.apply(this, arguments);
};

const defaults = {
  lines: 12,
  length: 7,
  width: 5,
  radius: 10,
  scale: 1.0,
  corners: 1,
  color: '#000',
  fadeColor: 'transparent',
  animation: 'spinner-line-fade-default',
  rotate: 0,
  direction: 1,
  speed: 1,
  zIndex: 2e9,
  className: 'spinner',
  top: '50%',
  left: '50%',
  shadow: '0 0 1px transparent',
  position: 'absolute',
};
const Spinner = /** @class */ (function () {
  function Spinner(this: any, opts: {} | undefined) {
    if (opts === void 0) { opts = {}; }
    this.opts = __assign(__assign({}, defaults), opts);
  }
  /**
   * Adds the spinner to the given target element. If this instance is already
   * spinning, it is automatically removed from its previous target by calling
   * stop() internally.
   */
  Spinner.prototype.spin = function (target: { insertBefore: (arg0: any, arg1: any) => void; firstChild: any; }) {
    this.stop();
    this.el = document.createElement('div');
    this.el.className = this.opts.className;
    this.el.setAttribute('role', 'progressbar');
    css(this.el, {
      position: this.opts.position,
      width: 0,
      zIndex: this.opts.zIndex,
      left: this.opts.left,
      top: this.opts.top,
      transform: "scale(" + this.opts.scale + ")",
    });
    if (target) {
      target.insertBefore(this.el, target.firstChild || null);
    }
    drawLines(this.el, this.opts);
    return this;
  };
  /**
   * Stops and removes the Spinner.
   * Stopped spinners may be reused by calling spin() again.
   */
  Spinner.prototype.stop = function () {
    if (this.el) {
      if (typeof requestAnimationFrame !== 'undefined') {
        cancelAnimationFrame(this.animateId);
      }
      else {
        clearTimeout(this.animateId);
      }
      if (this.el.parentNode) {
        this.el.parentNode.removeChild(this.el);
      }
      this.el = undefined;
    }
    return this;
  };
  return Spinner;
}());
export { Spinner };
/**
 * Sets multiple style properties at once.
 */
function css(el: HTMLDivElement, props: { [x: string]: any; position?: any; width?: string | number; zIndex?: any; left?: any; top?: any; transform?: string; height?: string; background?: any; borderRadius?: string; transformOrigin?: string; boxShadow?: string; animation?: string; }) {
  for (const prop in props) {
    el.style[prop] = props[prop];
  }
  return el;
}
/**
 * Returns the line color from the given string or array.
 */
function getColor(color: string | any[], idx: number) {
  return typeof color == 'string' ? color : color[idx % color.length];
}
/**
 * Internal method that draws the individual lines.
 */
function drawLines(el: { appendChild: (arg0: any) => void; }, opts: { corners: number; width: string | number; shadow: string | boolean; lines: number; rotate: number; length: any; fadeColor: any; radius: string; direction: number; speed: number; color: any; animation: string; }) {
  const borderRadius = (Math.round(opts.corners * opts.width * 500) / 1000) + 'px';
  let shadow = 'none';
  if (opts.shadow === true) {
    shadow = '0 2px 4px #000'; // default shadow
  }
  else if (typeof opts.shadow === 'string') {
    shadow = opts.shadow;
  }
  const shadows = parseBoxShadow(shadow);
  for (let i = 0; i < opts.lines; i++) {
    const degrees = ~~(360 / opts.lines * i + opts.rotate);
    const backgroundLine = css(document.createElement('div'), {
      position: 'absolute',
      top: -opts.width / 2 + "px",
      width: (opts.length + opts.width) + 'px',
      height: opts.width + 'px',
      background: getColor(opts.fadeColor, i),
      borderRadius: borderRadius,
      transformOrigin: 'left',
      transform: "rotate(" + degrees + "deg) translateX(" + opts.radius + "px)",
    });
    let delay = i * opts.direction / opts.lines / opts.speed;
    delay -= 1 / opts.speed; // so initial animation state will include trail
    const line = css(document.createElement('div'), {
      width: '100%',
      height: '100%',
      background: getColor(opts.color, i),
      borderRadius: borderRadius,
      boxShadow: normalizeShadow(shadows, degrees),
      animation: 1 / opts.speed + "s linear " + delay + "s infinite " + opts.animation,
    });
    backgroundLine.appendChild(line);
    el.appendChild(backgroundLine);
  }
}
function parseBoxShadow(boxShadow: string) {
  const regex = /^\s*([a-zA-Z]+\s+)?(-?\d+(\.\d+)?)([a-zA-Z]*)\s+(-?\d+(\.\d+)?)([a-zA-Z]*)(.*)$/;
  const shadows = [];
  for (let _i = 0, _a = boxShadow.split(','); _i < _a.length; _i++) {
    const shadow = _a[_i];
    const matches = shadow.match(regex);
    if (matches === null) {
      continue; // invalid syntax
    }
    const x = +matches[2];
    const y = +matches[5];
    let xUnits = matches[4];
    let yUnits = matches[7];
    if (x === 0 && !xUnits) {
      xUnits = yUnits;
    }
    if (y === 0 && !yUnits) {
      yUnits = xUnits;
    }
    if (xUnits !== yUnits) {
      continue; // units must match to use as coordinates
    }
    shadows.push({
      prefix: matches[1] || '',
      x: x,
      y: y,
      xUnits: xUnits,
      yUnits: yUnits,
      end: matches[8],
    });
  }
  return shadows;
}
/**
 * Modify box-shadow x/y offsets to counteract rotation
 */
function normalizeShadow(shadows: { prefix: any; x: number; y: number; xUnits: any; yUnits: any; end: any; }[], degrees: number) {
  const normalized = [];
  for (let _i = 0, shadows_1 = shadows; _i < shadows_1.length; _i++) {
    const shadow = shadows_1[_i];
    const xy = convertOffset(shadow.x, shadow.y, degrees);
    normalized.push(shadow.prefix + xy[0] + shadow.xUnits + ' ' + xy[1] + shadow.yUnits + shadow.end);
  }
  return normalized.join(', ');
}
function convertOffset(x: number, y: number, degrees: number) {
  const radians = degrees * Math.PI / 180;
  const sin = Math.sin(radians);
  const cos = Math.cos(radians);
  return [
    Math.round((x * cos + y * sin) * 1000) / 1000,
    Math.round((-x * sin + y * cos) * 1000) / 1000,
  ];
}


const opts = {
  lines: 13, // The number of lines to draw
  length: 38, // The length of each line
  width: 17, // The line thickness
  radius: 45, // The radius of the inner circle
  scale: 1, // Scales overall size of the spinner
  corners: 1, // Corner roundness (0..1)
  color: '#43088e', // CSS color or array of colors
  fadeColor: 'transparent', // CSS color or array of colors
  speed: 1, // Rounds per second
  rotate: 0, // The rotation offset
  animation: 'spinner-line-fade-default', // The CSS animation name for the lines
  direction: 1, // 1: clockwise, -1: counterclockwise
  zIndex: 2e9, // The z-index (defaults to 2000000000)
  className: 'spinner', // The CSS class to assign to the spinner
  top: '50%', // Top position relative to parent
  left: '50%', // Left position relative to parent
  shadow: '0 0 1px transparent', // Box-shadow for the lines
  position: 'absolute' // Element positioning
};

let properties: {
  debtorId?: any;
  taskId?: any;
  allObligations?: Api<any>;
  titleTxt: string;
  pages: string[];
  courtFineData?: any;
  dateOfBankruptcy?: any;
  source?: any;
};
const shade = document.getElementById('shade');

const toBase64 = (file: Blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});

function updateDescription(target: EventTarget | null) {
  document.getElementById("editDescription").value = target.value;
}

async function getFormData(parsedDocument: { querySelector: (arg0: string) => any; }) {
  const formElement = parsedDocument.querySelector("form");
  const formData = new FormData(formElement || document.createElement('form'));
  const formDataObject = {};
  formData.forEach((value, key) => { formDataObject[key] = value });
  return formDataObject;
}

async function parsePage(vDocument: Response, url: undefined, fetchOptions: undefined) {
  const getbody = function (vDocument: { text: () => unknown; }) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject('timeout')
      }, 10000)
      resolve(vDocument.text());
    })
  }
  const htmlText = await getbody(vDocument).catch(async (e) => {
    vDocument = await fetchRetryTimeout(url, fetchOptions)
    return getbody(vDocument)
  })
  const parser = new DOMParser();
  const parsedDocument = parser.parseFromString(htmlText, "text/html");
  return parsedDocument;
}

function disambig(parent: { [x: string]: any; }, property: string | number) {
  return (typeof parent[property] === "function") && (parent[property]()) || parent[property] || 0
}

async function createPageElements(data: { [x: string]: any; }, incrementor: string | number, vDocument: boolean | Document) {
  //Update banner text
  document.getElementById("bannertext").innerHTML = `<span class="info">${properties.debtorid || ""}</span><span class="info">${properties.taskId || ""}</span>`

  const stage = data[incrementor]
  const content = document.getElementById("content");
  content.innerHTML = "";
  const elementArray = stage.elements.map(async (element: { tag: string; text: any; label: string; attributes: { id: string; }; noLabel: boolean; dataSource: any; parent: string; prefill: (arg0: any, arg1: any, arg2: any) => any; }) => {
    const field = document.createElement(element.tag);
    element.text && (field.innerHTML = element.text);

    if (element.label) {
      const label = document.createElement("span");
      label.style = "grid-column-start: 1; grid-column-end: 1; justify-self: end; text-align:right";
      label.innerHTML = element.label;
      content.append(label);
      content.append(field);
    }

    if (element.attributes && element.attributes.id && element.attributes.id === "tablecontainer") {
      content.append(field);
    }

    if (element.noLabel === true) {
      content.append(field);
    }

    if (element.dataSource) {
      properties.allObligations = await buildTable(element, field, vDocument);
    }

    element.parent && (element.tag !== "table") && document.getElementById(element.parent).append(field);
    element.prefill && (element.prefill(vDocument, field, properties));
    element.attributes && setAttributes(field, element.attributes);
    if (document.getElementById("descriptionChooser")) {
      document.getElementById("descriptionChooser").addEventListener("click", event => updateDescription(event.target));
    }
  })
  Promise.all(elementArray).then(function () { shade.style.display = "none"; })
}

async function buildPage(data: VIEWsubmitParams, incrementor: number) {
  const stage = data[incrementor] // Current page in the wizard
  document.getElementById(stage.name).click();
  //Show spinner.
  shade.style.display = "block";
  const vDocument = await VIEWsubmit(data, incrementor, undefined, stage);
  createPageElements(data, incrementor, vDocument);
  createProgressButtons(data, incrementor, vDocument);
}

async function createProgressButtons(data: VIEWsubmitParams, incrementor: number, parsedDocument: boolean | Document) {
  const stage = data[incrementor];
  const buttonBar = document.getElementById('buttonBar');
  buttonBar.innerHTML = ""; //Clear footer (submit buttons)
  stage.progressButtons && stage.progressButtons.map((buttonData: { text: string | null; id: string; float: string; }, formData: any) => {
    const button = document.createElement("span")
    button.textContent = buttonData.text;
    button.id = buttonData.id;
    button.className = "mybutton";
    button.style.float = buttonData.float;
    buttonBar.append(button);
    button.addEventListener("mouseup", async () => {
      shade.style.display = "block";
      const next = await VIEWsubmit(data, incrementor, parsedDocument, buttonData, properties);
      if (next) {
        incrementor++;
        buildPage(data, incrementor)
      }
    })
  });
}

async function startWizard(data: any[]) {

  const spinner = new Spinner(opts).spin(shade);
  const navDots = document.getElementById('navDots')

  data.map((stage: { name: string | null; }, i: number) => {
    const a = document.createElement('a');
    a.href = "#";
    a.id = stage.name;
    a.textContent = stage.name;
    const li = document.createElement('li');
    (i === 0) && (li.className = "current");
    li.append(a); navDots.append(li);
    li.addEventListener('mouseup', function () {
      buildPage(data, i)
    });
    [].slice.call(document.querySelectorAll('.dotstyle > ul')).forEach(function (nav) {
      new DotNav(nav, {
        callback: function (idx: any) {
        }
      });
      document.getElementById('navigation').style.justifyContent = "center"
    });
  });

  const incrementor = 0;
  buildPage(data, incrementor);
}

/* Starts the wizard function */
const onCreate = async function (message: {
  data: {
    titleTxt: string,
    pages: string[];
  }
}) {
  // Ensure it is run only once, as we will try to message twice
  chrome.runtime.onMessage.removeListener(onCreate);
  properties = message.data;
  const title = document.getElementById('title');
  if (!title) throw new Error("Title element not found");
  if (properties.titleTxt && document.getElementById('titletxt')) title.innerText = properties.titleTxt;
  const stages = properties.pages.map((page: string | number) => wizardLogic[page](properties, getDebtorObligations))
  startWizard(stages);
}

/* Called when the window is created and loaded */
chrome.runtime.onMessage.addListener(onCreate);

async function getDebtorObligations(source: any, parsedDocument: Document | undefined) {
  let warrantData;
  if (parsedDocument !== undefined && parsedDocument.getElementById("WarrantGrid")) {
    const WarrantGrid = parsedDocument.getElementById("WarrantGrid");
    const headerRow = WarrantGrid.firstElementChild.firstElementChild;
    const thead = document.createElement('thead');
    WarrantGrid.insertAdjacentElement('afterbegin', thead);
    thead.append(headerRow);
    warrantData = parseTable(WarrantGrid);
  }
  //Get stateless page
  let vDocument = await fetch(`https://${source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorObligationsSummary.aspx`);
  parsedDocument = await parsePage(vDocument)
  const formData = await getFormData(parsedDocument)

  //Get page with all obligations if more than 50
  let obligationRowCount;
  let warrantRowCount;
  try {

    if (!parsedDocument.querySelector("#DebtorNoticesCtrl_DebtorNoticesTable_NoRecordsCell")) {
      obligationRowCount = parsedDocument.querySelector("#DebtorNoticesCtrl_DebtorNoticesTable_PageChooserCell > span").textContent.trim().split(" ");
    } else {
      obligationRowCount = 0;
    }

    if (!parsedDocument.querySelector("#DebtorWarrantsCtrl_DebtorWarrantsTable_NoRecordsCell")) {
      warrantRowCount = parsedDocument.querySelector("#DebtorWarrantsCtrl_DebtorWarrantsTable_PageChooserCell > span").textContent.trim().split(" ");
    } else {
      warrantRowCount = 0;
    }

  } catch (err) {
    alert("Unable to access obligations in VIEW");
  }
  if (Number(obligationRowCount[obligationRowCount.length - 1]) > 50 ||
    Number(warrantRowCount[warrantRowCount.length - 1]) > 10
  ) {
    formData["DebtorNoticesCtrl$DebtorNoticesTable$ddRecordsPerPage"] = 0;
    formData["DebtorCourtOrdersCtrl$DebtorCourtFinesTable$ddRecordsPerPage"] = 0;
    formData["DebtorWarrantsCtrl$DebtorWarrantsTable$ddRecordsPerPage"] = 0;
    const form_data = new FormData();
    for (const key in formData) { form_data.append(key, formData[key]); }
    vDocument = await fetch(`https://${source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorObligationsSummary.aspx`, {
      method: "POST",
      body: form_data
    });
    parsedDocument = await parsePage(vDocument)
  }

  properties.courtFineData = parseTable(parsedDocument.getElementById("DebtorCourtOrdersCtrl_DebtorCourtFinesTable_tblData"))

  let debtorData;
  if (!parsedDocument.querySelector("#DebtorNoticesCtrl_DebtorNoticesTable_NoRecordsCell")) {
    debtorData = parseTable(parsedDocument.getElementById("DebtorNoticesCtrl_DebtorNoticesTable_tblData"))
  } else {
    debtorData = [];
  }

  if (warrantData) {
    debtorData = mergeById({
      data: warrantData,
      matchColumn: "Obligation No."
    }, {
      data: debtorData,
      matchColumn: "Notice Number"
    }).filter((item: {}) => Object.keys(item).length > 9)
    debtorData = mergeById({
      data: debtorData,
      matchColumn: "Notice Number"
    }, {
      data: parseTable(parsedDocument.getElementById('DebtorWarrantsCtrl_DebtorWarrantsTable_tblData')),
      matchColumn: "Obligation No."
    })
  }
  console.log(debtorData);
  return debtorData;
}

async function buildTable(element: { dataSource: (arg0: any) => any; parent: string; selectCriteria: string; }, field: string | Node, parsedDocument: any) {
  let tableData = await element.dataSource(parsedDocument)
  tableData = tableData.map(function (row: { [x: string]: any; }) {
    const newRow = {};
    newRow.checkbox = "";
    Object.keys(row).forEach(function (key) {
      newRow[key.replace(/\.|\-|\?|[(]|\//g, "").replace(/\)/g, "").replace(/ /g, "")] = row[key]
    });
    return newRow;
  });

  $.fn.dataTable.moment('DD/MM/YYYY');

  document.getElementById(element.parent).append(field);
  console.log(tableData);
  const dataTableConfig = {
    "data": tableData,
    "columns": [
      { "data": "checkbox" },
      { "data": "NoticeNumber", "title": "Notice Number" },
      { "data": "InfringementNo", "title": "Infringement No." },
      { "data": "InputType", "title": "Input Type" },
      { "data": "OffenceDate", "title": "Offence Date" },
      { "data": "Issued", "title": "Issued" },
      { "data": "BalanceOutstanding", "title": "Balance Outstanding" },
      { "data": "NoticeStatusPreviousStatus", "title": "Notice Status/Previous Status" },
      { "data": "Offence", "title": "Offence" },
      { "data": "HoldCodeEndDate", "title": "Hold Code/End Date" },
      { "data": "EOTCount", "title": "EOT Count" },
      { "data": "CurrentChallengeLogged", "title": "Current Challenge Logged?" },
      { "data": "VRM", "title": "VRM" }
    ],
    "columnDefs": [
      {
        "visible": false,
        "targets": [2, 5, 8, 10, 11, 12]
      },
      {
        "targets": [0],
        className: 'select-checkbox'
      }
    ],
    "order": [[9, "desc"]],
    "dom": 'rt<"clear"><"bottom"lpi>f',
    select: {
      style: 'multi',
      selector: 'td:first-child',
    }, language: {
      select: {
        rows: " (%d selected)"
      }
    },
    "oLanguage": {
      "sInfo": "Results: _START_-_END_ of _TOTAL_",
      "sLengthMenu": "Show _MENU_",
      "oPaginate": {
        "sNext": "&#8594;",
        "sPrevious": "&#8592;"
      }
    },
  }

  if (element.selectCriteria === "WarrantProvableLift") {
    dataTableConfig.columns.push({ "data": "OnHold", "title": "Warrant Hold" });
    dataTableConfig.columns.push({ "data": "Status", "title": "Warrant Status" });
    dataTableConfig.columnDefs[0].targets = [2, 5, 7, 8, 10, 11, 12]
    dataTableConfig.columnDefs.push({ targets: 14, className: "truncate" })
    dataTableConfig.createdRow = function (row: any) {
      const td = $(row).find(".truncate");
      td.attr("title", td.html());
    }
  }

  const dataTable = $(field).DataTable(dataTableConfig);
  properties.allObligations = dataTable;

  if (element.selectCriteria === "WarrantProvable") {
    dataTable.columns(7).search("WARRNT").draw();
  }

  dataTable.rows().every(function (rowIdx: any, tableLoop: any, rowLoop: any) {
    const data = this.data();
    const types = ["1A", "1B", "1C", "2A"];
    let statuses = ["WARRNT", "NFDP", "SELDEA"];
    const bd = moment(properties.dateOfBankruptcy, "YYYY-MM-DD")
    const td = moment(data.OffenceDate, "DD/MM/YYYY")
    const balance = Number(data.BalanceOutstanding.replace(/[^0-9.-]+/g, ""));

    if (element.selectCriteria === "WarrantProvableLift") {
      /*Selects any obligations that are provable and
       and are at warrant stage. */
      (balance > 0) && (bd.isAfter(td)) &&
        (types.some(type => data.InputType === type)) &&
        (data.NoticeStatusPreviousStatus.includes("WARRNT")) &&
        (data.OnHold.includes("Yes")) &&
        (this.select());
    }

    if (element.selectCriteria === "WarrantProvable") {
      /*Selects any obligations that are provable and
       and are at warrant stage. */
      (balance > 0) && (bd.isAfter(td)) &&
        (types.some(type => data.InputType === type)) &&
        (data.NoticeStatusPreviousStatus.includes("WARRNT")) &&
        (this.select());
    }

    if (element.selectCriteria === "Provable") {
      //Selects any obligations that are provable
      (balance > 0) && (bd.isAfter(td)) &&
        (types.some(type => data.InputType === type)) &&
        (statuses.some(status => data.NoticeStatusPreviousStatus.includes(status))) &&
        (!data.HoldCodeEndDate.includes("PROVABLE")) &&
        (this.select());
    }

    if (element.selectCriteria === "BRTHOLD") {
      // Selects provable PA holds and notification of bankruptcy holds
      (balance > 0) && (td < bd) &&
        (types.some(type => data.InputType === type)) &&
        (statuses.some(status => data.NoticeStatusPreviousStatus.includes(status))) &&
        (data.HoldCodeEndDate.trim().includes("PAYARNGMNT")) &&
        (this.select());

      (bd.isBefore(td) || !statuses.some(status => data.NoticeStatusPreviousStatus.includes(status))) &&
        (data.HoldCodeEndDate.trim().includes("BANKRUPT")) &&
        (this.select());

    }

    if (element.selectCriteria === "all") {
      //Selects all unpaid obligations
      statuses = ["WARRNT", "CHLGLOG", "NFDP", "SELENF", "CLOG", "SELDEA"];

      (balance > 0) &&
        (statuses.some(status => data.NoticeStatusPreviousStatus.includes(status))) &&
        this.select();
    }

  });

  return dataTable
}

const toDate = (dateStr = "2000-01-01") => {
  const [day, month, year] = dateStr.split("-").reverse()
  return new Date(year, month - 1, day)
}



const mergeById = (a1: { data: any; matchColumn: any; }, a2: { data: any; matchColumn: any; }) =>
  a1.data.map((itm: { [x: string]: any; }) => ({
    ...a2.data.find((item: { [x: string]: any; }) => (item[a2.matchColumn] === itm[a1.matchColumn]) && item),
    ...itm
  }));

function setAttributes(el: { setAttribute: (arg0: string, arg1: any) => void; }, attrs: { [x: string]: any; }) {
  for (const key in attrs) {
    el.setAttribute(key, attrs[key]);
  }
}

async function runFetchInContentScript(url: any, fetchOptions: any) {
  const iframe = document.getElementById("CS");
  if (iframe) {
    await loadAgain(iframe, url, fetchOptions);
  } else if (!iframe) {
    await loadFirst(url, fetchOptions);
  }
}

function loadFirst(url: any, fetchOptions: any) {
  const iframe = document.createElement('iframe');
  iframe.id = "CS"
  document.body.append(iframe);
  iframe.style.display = "none"
  iframe.src = `https://${properties.source}.view.civicacloud.com.au/Core/Forms/HomePage.aspx`;
  return new Promise(function (resolve, reject) {
    iframe.onload = function () {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { url, fetchOptions }, function (response) {
          resolve(response);
        });
      });
    }
  });
}

function loadAgain(iframe: HTMLElement, url: any, fetchOptions: any) {
  console.log(url);
  return new Promise(function (resolve, reject) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { url, fetchOptions }, function (response) {
        resolve(response);
      });
    });
  });
}