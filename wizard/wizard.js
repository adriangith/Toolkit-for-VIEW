import { Spinner } from '../js/External/spin.js';
import * as wizardLogic from '../js/wizardLogic.js';

var opts = {
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

const properties = {}
const shade = document.getElementById('shade');

properties.allObligations;


const toBase64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});

function updateDescription(target) {
  document.getElementById("editDescription").value = target.value;
}

async function getFormData(parsedDocument) {
  const formElement = parsedDocument.querySelector("form");
  let formData = new FormData(formElement || document.createElement('form'));
  var formDataObject = {};
  formData.forEach((value, key) => { formDataObject[key] = value });
  return formDataObject;
}

async function parsePage(vDocument) {
  let htmlText = await vDocument.text();
  const parser = new DOMParser();
  const parsedDocument = parser.parseFromString(htmlText, "text/html");
  return parsedDocument;
}


function disambig(parent, property) {
  return (typeof parent[property] === "function") && (parent[property]()) || parent[property] || 0
}

async function createPageElements(data, incrementor, vDocument) {
  //Update banner text
  document.getElementById("bannertext").innerHTML = `<span class="info">${properties.debtorid || ""}</span><span class="info">${properties.taskId || ""}</span>`

  let stage = data[incrementor]
  const content = document.getElementById("content");
  content.innerHTML = "";
  let elementArray = stage.elements.map(async element => {
    let field = document.createElement(element.tag);
    element.text && (field.innerHTML = element.text);

    if (element.label) {
      let label = document.createElement("span");
      label.style = "grid-column-start: 1; grid-column-end: 1; justify-self: end; text-align:right";
      label.innerHTML = element.label;
      content.append(label);
      content.append(field);
    }

    if (element.attributes && element.attributes.id && element.attributes.id === "tablecontainer") {
      content.append(field);
    }

    if (element.dataSource) {
      properties.allObligations = await buildTable(element, field, vDocument);
    }

    element.parent && (element.tag !== "table") && document.getElementById(element.parent).append(field);
    element.prefill && (element.prefill(vDocument, field));
    element.attributes && Object.assign(field, element.attributes);
    element.attributes && element.attributes.maxlength && (field.maxLength = element.attributes.maxlength);
    element.attributes && element.attributes.selected && field.setAttribute('selected', '');
    if (document.getElementById("descriptionChooser")) {
      document.getElementById("descriptionChooser").addEventListener("click", event => updateDescription(event.target));
    }
  })
  Promise.all(elementArray).then(function () { shade.style.display = "none"; })
}

async function buildPage(data, incrementor) {
  let stage = data[incrementor] // Current page in the wizard
  document.getElementById(stage.name).click();
  let vDocument = await VIEWsubmit(data, incrementor, undefined, stage);
  createPageElements(data, incrementor, vDocument);
  createProgressButtons(data, incrementor, vDocument);
}

async function createProgressButtons(data, incrementor, parsedDocument) {
  let stage = data[incrementor];
  const buttonBar = document.getElementById('buttonBar');
  buttonBar.innerHTML = ""; //Clear footer (submit buttons)
  stage.progressButtons.map((buttonData, formData) => {
    const button = document.createElement("img")
    button.src = chrome.runtime.getURL("Images/" + buttonData.src);
    button.id = buttonData.id;
    button.style = "Cursor:Hand; float: right; padding-right: 6px";
    buttonBar.append(button);
    button.addEventListener("mouseup", () => VIEWsubmit(data, incrementor, parsedDocument, buttonData))
  });
}

async function VIEWsubmit(data, incrementor, parsedDocument, dataParams) {
  //Show spinner.
  shade.style.display = "block";

  let formData = {};
  let previousFormData = [];

  //Get form data from the prevous fetch, if not first submit of wizard.
  if (parsedDocument !== undefined) { formData = await getFormData(parsedDocument) };

  //As an alternative to the submit flow, an action provides custom logic.
  dataParams.action && dataParams.action(parsedDocument);

  //Splits submit array by group
  const groups = groupBy(dataParams.submit, "group");

  let groupedRepeats = dataParams.groupRepeats || { Ungrouped: () => [{ empty: null }] };

  for (let [groupName, group] of Object.entries(groups)) {
    const dynamicParams = typeof groupedRepeats[groupName] === "function" && groupedRepeats[groupName]() || groupedRepeats[groupName] || [{}];
    for (let set of dynamicParams) {
      console.log("-------------------------")
      for (let submitInstructions of group) {
        console.log(submitInstructions);
        if (submitInstructions.optional && submitInstructions.optional() === false) continue;
        let urlParams = typeof submitInstructions.urlParams === "function" && submitInstructions.urlParams(parsedDocument, set) || submitInstructions.urlParams;
        urlParams = await urlParams;
        //Get form data, if any, from wizard page.
        let wizardFormData = await getFormData(document);
        previousFormData.push(formData);
        const index = submitInstructions.formDataTarget || previousFormData.length - 1;
        formData = previousFormData[index];
        if (submitInstructions.clearWizardFormData) { wizardFormData = {} };
        if (submitInstructions.clearVIEWFormData) { formData = {} };
        if (urlParams) { formData = { ...formData, ...urlParams, ...wizardFormData } }
        var form_data = new FormData();
        for (var key in formData) { form_data.append(key, formData[key]); }
        let vDocument = await fetch(submitInstructions.url, { method: "POST", body: form_data });
        parsedDocument = await parsePage(vDocument);
        submitInstructions.after && submitInstructions.after(parsedDocument);
        formData = await getFormData(parsedDocument);
        if (submitInstructions.next === true) {
          incrementor++
          buildPage(data, incrementor);
        }
      }
    }
  }
  dataParams.afterAction && dataParams.afterAction(parsedDocument, properties);
  return parsedDocument
}

async function startWizard(data) {

  let spinner = new Spinner(opts).spin(shade);
  const navDots = document.getElementById('navDots')

  data.map((stage, i) => {
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
        callback: function (idx) {
        }
      });
    });
  });

  let incrementor = 0;
  buildPage(data, incrementor);
}

/* Starts the wizard function */
var onCreate = async function (message) {
  // Ensure it is run only once, as we will try to message twice
  chrome.runtime.onMessage.removeListener(onCreate);
  properties.source = message.url;
  properties.debtorid = message.data.debtorid;
  properties.taskId = message.data.taskid;
  properties.catalystTabID = message.data.catalystTabID;
  let stages = message.data.pages.map(page => wizardLogic[page](properties, getDebtorObligations))
  startWizard(stages);
}

/* Called when the window is created and loaded */
chrome.runtime.onMessage.addListener(onCreate);

async function getDebtorObligations(source, parsedDocument) {
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
  let formData = await getFormData(parsedDocument)

  //Get page with all obligations if more than 50
  let rowCount;
  try {
    rowCount = parsedDocument.querySelector("#DebtorNoticesCtrl_DebtorNoticesTable_PageChooserCell > span").textContent.trim().split(" ");
  } catch (err) {
    alert("Unable to access obligations in VIEW");
  }
  if (Number(rowCount[rowCount.length - 1]) > 50) {
    formData["DebtorNoticesCtrl$DebtorNoticesTable$ddRecordsPerPage"] = 0;
    formData["DebtorCourtOrdersCtrl$DebtorCourtFinesTable$ddRecordsPerPage"] = 0;
    formData["DebtorWarrantsCtrl$DebtorWarrantsTable$ddRecordsPerPage"] = 0;
    var form_data = new FormData();
    for (var key in formData) { form_data.append(key, formData[key]); }
    vDocument = await fetch(`https://${source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorObligationsSummary.aspx`, {
      method: "POST",
      body: form_data
    });
    parsedDocument = await parsePage(vDocument)
  }

  properties.courtFineData = parseTable(parsedDocument.getElementById("DebtorCourtOrdersCtrl_DebtorCourtFinesTable_tblData"))

  let debtorData = parseTable(parsedDocument.getElementById("DebtorNoticesCtrl_DebtorNoticesTable_tblData"))
  if (warrantData) {
    debtorData = mergeById({
      data: warrantData,
      matchColumn: "Obligation No."
    }, {
      data: debtorData,
      matchColumn: "Notice Number"
    }).filter(item => Object.keys(item).length > 9)
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

async function buildTable(element, field, parsedDocument) {
  let tableData = await element.dataSource(parsedDocument)
  tableData = tableData.map(function (row) {
    const newRow = {};
    newRow.checkbox = "";
    Object.keys(row).forEach(function (key) {
      newRow[key.replace(/\.|\-|\?|[(]|\//g, "").replace(/\)/g, "").replace(/ /g, "")] = row[key]
    });
    return newRow;
  });

  $.fn.dataTable.moment('DD/MM/YYYY');

  document.getElementById(element.parent).append(field);

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
    dataTableConfig.createdRow = function(row) {
      var td = $(row).find(".truncate");
      td.attr("title", td.html());
    }
  }

  let dataTable = $(field).DataTable(dataTableConfig);
  properties.allObligations = dataTable;

  if (element.selectCriteria === "WarrantProvable") {
    dataTable.columns(7).search("WARRNT").draw();
  }

  dataTable.rows().every(function (rowIdx, tableLoop, rowLoop) {
    let data = this.data();
    let types = ["1A", "1B", "1C", "2A"];
    let statuses = ["WARRNT", "NFDP"];
    let bd = moment(properties.dateOfBankruptcy, "YYYY-MM-DD")
    let td = moment(data.OffenceDate, "DD/MM/YYYY")
    let balance = Number(data.BalanceOutstanding.replace(/[^0-9.-]+/g, ""));

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
      statuses = ["WARRNT", "CHLGLOG", "NFDP", "SELENF", "CLOG"];

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

function groupBy(arr, property) {
  return arr.reduce(function (memo, x) {
    if (x[property] === undefined) { x[property] = "Ungrouped" }
    if (!memo[x[property]]) { memo[x[property]] = []; }
    memo[x[property]].push(x);
    return memo;
  }, {});
}

const mergeById = (a1, a2) =>
  a1.data.map(itm => ({
    ...a2.data.find((item) => (item[a2.matchColumn] === itm[a1.matchColumn]) && item),
    ...itm
  }));

