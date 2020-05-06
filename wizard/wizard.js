import { Spinner } from '../js/External/spin.js';

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
properties.debtorId = 51011216;
properties.debtorName = "James Alexander";
properties.lastURL = "Test";

let expressions = require('angular-expressions');

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
  let formData = new FormData(formElement);
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

function fetchResource(input, init, opt) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ input, init, opt }, messageResponse => {
      const [response, error] = messageResponse;
      if (response === null) {
        reject(error);
      } else {
        // Use undefined on a 204 - No Content
        const body = response.body ? new Blob([response.body]) : undefined;
        console.log(response.url);
        properties.lastURL = response.url;
        resolve(new Response(body, {
          status: response.status,
          statusText: response.statusText,
        }));
      }
    });
  });
}

function disambig(parent, property) {
  return (typeof parent[property] === "function") && (parent[property]()) || parent[property] || 0
}

async function createPageElements(data, incrementor, vDocument) {
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
      properties.allObligations = await buildTable(element, field);
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

  let formData = {}

  //Get form data, if any from wizard page.
  let wizardFormData = await getFormData(document);

  //Get form data from the prevous fetch, if not first submit.
  if (parsedDocument !== undefined) formData = await getFormData(parsedDocument);

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
        if (urlParams) { formData = { ...formData, ...urlParams, ...wizardFormData } }
        if (submitInstructions.clearParams) { formData = {} }
        submitInstructions.format || (submitInstructions.format = "URLSearchParams");
        let vDocument = await fetchResource(submitInstructions.url, { method: "POST", body: formData }, submitInstructions.format);
        parsedDocument = await parsePage(vDocument)
        formData = await getFormData(parsedDocument);
        if (submitInstructions.next === true) {
          incrementor++
          buildPage(data, incrementor);
        }
      }
    }
  }
  dataParams.afterAction && dataParams.afterAction(parsedDocument);
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
  let t = new Date();
  let source = `djr-stg`;

  let bankruptcyDate = {
    name: "Bankruptcy Date",
    submit: [
      {
        repeat: 0,
        url: `https://${source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorFurtherDetails.aspx`
      },
      {
        repeat: 0,
        url: `https://${source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorFurtherDetails.aspx`,
        urlParams: {
          'DebtorDetailsCtrl$hDivId': 1,
          'DebtorDetailsCtrl$DebtorIdSearch': message.data.debtorid,
          "DebtorIndividualCtrl$editButton.x": 0,
          "DebtorIndividualCtrl$editButton.y": 0
        }
      }
    ],
    elements: [
      { tag: "input", label: "Date of bankruptcy:", prefill: (parsedDocument, field) => field.value = parsedDocument.getElementById("DebtorIndividualCtrl_dateOfBankruptcyTextbox").value.split("/").reverse().join("-"), attributes: { id: "dateChooser", type: "date", style: "grid-column-start: 2; grid-column-end: 5; width: 80%; align-self: start;" } }
    ],
    progressButtons: [
      {
        src: "SubmitAndNextStep.png",
        id: "SubmitAndNextStep",
        name: "Submit & Next Step",
        submit: [{
          url: `https://${source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorFurtherDetails.aspx`,
          next: true,
          urlParams: (vDocument) => {
            const params = {};
            properties.dateOfBankruptcy = document.getElementById("dateChooser").value;
            params["DebtorIndividualCtrl$dateOfBankruptcyTextbox"] = properties.dateOfBankruptcy.split("-").reverse().join("/");
            params["DebtorDetailsCtrl$DebtorIdSearch"] = message.data.debtorid;
            params["DebtorIndividualCtrl$updateButton.x"] = 0;
            params["DebtorIndividualCtrl$updateButton.y"] = 0;
            return params;
          }
        }]
      }
    ]
  }

  let removeHolds = {
    name: "Remove Holds",
    submit: [
      {
        optional: () => { return !properties.dateOfBankruptcy },
        url: `https://${source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorFurtherDetails.aspx`,
        urlParams: {}
      },
      {
        url: `https://${source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkGenericUpdate.aspx?Mode=HR&Menu=3`,
        urlParams: (parsedDocument) => {
          (parsedDocument && parsedDocument.getElementById('DebtorIndividualCtrl_dateOfBankruptcyTxt')) && (properties.dateOfBankruptcy = parsedDocument.getElementById('DebtorIndividualCtrl_dateOfBankruptcyTxt').textContent.trim().split("/").reverse().join("-"));
        }
      }
    ],
    elements: [
      { tag: "div", attributes: { id: "tablecontainer", style: "grid-column-start: 1; grid-column-end: 5; margin:auto; width: 80%; align-self: start; font-size: 8pt; margin-bottom: 20px" } },
      { tag: "table", selectCriteria: "BRTHOLD", parent: "tablecontainer", dataSource: () => getDebtorObligations(source), attributes: { id: "obligationtable", class: "table", style: "grid-column-start: 2; grid-column-end: 5; width: 100%; align-self: start; font-size: 8pt;" } },
    ],
    progressButtons: [{
      src: "SubmitAndNextStep.png",
      id: "SubmitAndNextStep",
      name: "Submit & Next Step",
      groupRepeats: {
        "Group 1": () => {
          let paramArray = [];
          properties.allObligations.rows({ selected: true }).every(function (rowIdx, tableLoop, rowLoop) {
            let params = {};
            let data = this.data();
            let all = properties.allObligations.rows({ selected: true }).data().toArray()
            let previousObligations = all.map(row => row.NoticeNumber).slice(0, rowLoop).join(",");
            params["txtNoticeNo"] = data.NoticeNumber;
            if (rowLoop >= 1) {
              params["txtNoticeCheck"] = previousObligations
            }
            paramArray.push(params);
          });
          return paramArray;
        }, "Group 2": () => {
          let previousObligations = properties.allObligations.rows({ selected: true }).data().toArray().map(row => row.NoticeNumber).join(",");;
          if (!properties.holdsRemoved)
            properties.holdsRemoved = previousObligations;
          else
            properties.holdsRemoved = properties.holdsRemoved + "," + previousObligations;
          return [{ "txtNoticeCheck": previousObligations }]
        }
      },
      submit: [{
        group: "Group 1",
        url: `https://${source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkGenericUpdate.aspx?Mode=HR&Menu=3`,
        urlParams: (parsedDocument, dynamicParams = {}) => {
          const params = {}
          for (let [key, value] of Object.entries(dynamicParams)) { params[key] = value }
          params["btnNoticeAdd.x"] = 0;
          params["btnNoticeAdd.y"] = 0;
          return params
        }
      }, {
        group: "Group 2",
        url: `https://${source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkGenericUpdate.aspx?Mode=HR&Menu=3`,
        next: true,
        urlParams: (parsedDocument, dynamicParams = {}) => {
          const params = {}
          for (let [key, value] of Object.entries(dynamicParams)) { params[key] = value }
          params["btnBulkUpdate.x"] = 0;
          params["btnBulkUpdate.y"] = 0;
          return params
        }
      }]
    }]
  }

  let uploadDocuments = {
    name: "Upload Documents",
    submit: [
      {
        url: `https://${source}.view.civicacloud.com.au/Taskflow/Forms/Management/DocumentImport.aspx`
      }
    ],
    elements: [
      { tag: "input", label: "Import Document:", attributes: { id: "fileChooser", type: "file", style: "grid-column-start: 2; grid-column-end: 5; width: 80%" } },
      { tag: "select", label: "Description:", attributes: { id: "descriptionChooser", style: "grid-column-start: 2; grid-column-end: 5; align-self: start; width: 80%" } },
      { tag: "option", parent: "descriptionChooser", attributes: { disabled: "true", selected: "true" }, text: "Type a description or select description from list" },
      { tag: "option", parent: "descriptionChooser", text: "Notification of Bankruptcy (Bankruptcy Act 1966)" },
      { tag: "option", parent: "descriptionChooser", text: "Notification of Bankruptcy - Debtors Petition" },
      { tag: "option", parent: "descriptionChooser", text: "Letter from Trustee" },
      { tag: "option", parent: "descriptionChooser", text: "Certificate of Appointment of Trustee" },
      { tag: "option", parent: "descriptionChooser", text: "Report to Creditors" },
      { tag: "option", parent: "descriptionChooser", text: "Further Report to Creditors" },
      { tag: "option", parent: "descriptionChooser", text: "Proposal, Terminate Part IX Debt Agreement Wthdrwl" },
      { tag: "textarea", label: "Edit Description: <br />(optional, max 50 characters)", attributes: { id: "editDescription", maxlength: 50, name: 'ctl00$mainContentPlaceHolder$documentDescriptionText', style: "grid-column-start: 2; grid-column-end: 5; width: 80%" } },
    ],
    progressButtons: [
      {
        src: "SubmitAndNextStep.png",
        id: "SubmitAndNextStep",
        name: "Submit & Next Step",
        submit: [{
          url: `https://${source}.view.civicacloud.com.au/Taskflow/Forms/Management/DocumentImport.aspx`,
          format: "FormData",
          urlParams: async () => {
            let file = await toBase64(document.getElementById("fileChooser").files.item(0))
            const params = {
              ctl00$mainContentPlaceHolder$lstApplicationModule: "Debtors",
              ctl00$mainContentPlaceHolder$taskTypeText: "ESSSTATUS",
              ctl00$mainContentPlaceHolder$taskTypeIdHidden: 439,
              ctl00$mainContentPlaceHolder$linkReferenceText: message.data.debtorid,
              ctl00$mainContentPlaceHolder$sourceText: "BSPFIN:Business Service Provider - Financial",
              ctl00$mainContentPlaceHolder$startDateTextBox: t.toJSON().slice(0, 10).split('-').reverse().join('/'),
              ctl00$mainContentPlaceHolder$reasonText: 'ENFRVREQ:"Request for Enforcement Review to be decided"',
              ctl00$mainContentPlaceHolder$startTimeTextBox: t.getHours() + ":" + t.getMinutes(),
              ctl00$mainContentPlaceHolder$originText: "DEBTOR:Debtor",
              "ctl00$mainContentPlaceHolder$updateButton.x": 0,
              "ctl00$mainContentPlaceHolder$updateButton.y": 0,
              "ctl01$mainContentPlaceHolder$documentImportFileUpload": {
                name: document.getElementById("fileChooser").files.item(0).name,
                file: file
              }
            }
            if (properties.taskId) {
              params.ctl00$mainContentPlaceHolder$createTaskCheck = "";
              params.ctl00$mainContentPlaceHolder$taskIdText = properties.taskId;
            }

            return params
          }
        }, {
          url: `https://${source}.view.civicacloud.com.au/Taskflow/Forms/Management/DocumentImport.aspx`,
          next: true,
          urlParams: (parsedDocument) => {
            if (parsedDocument.getElementById('ctl00_mainContentPlaceHolder_messageLable') && properties.taskId === undefined) {
              properties.taskId = parsedDocument.getElementById('ctl00_mainContentPlaceHolder_messageLable').textContent.split(" ")[7]
            }
            return {};
          }
        }
        ]
      },
      {
        src: "SubmitAndNextDocument.png",
        id: "SubmitAndNextDocument",
        name: "Submit & Next Document",
        afterAction: (parsedDocument) => { document.getElementById('content').reset(); shade.style.display = "none" },
        submit: [{
          url: `https://${source}.view.civicacloud.com.au/Taskflow/Forms/Management/DocumentImport.aspx`,
          format: "FormData",
          urlParams: async function () {
            let file = await toBase64(document.getElementById("fileChooser").files.item(0))
            const params = {
              "ctl00$mainContentPlaceHolder$updateButton.x": 0,
              "ctl00$mainContentPlaceHolder$updateButton.y": 0,
              "ctl01$mainContentPlaceHolder$documentImportFileUpload": {
                name: document.getElementById("fileChooser").files.item(0).name,
                file: file
              },
              ctl00$mainContentPlaceHolder$lstApplicationModule: "Debtors",
              ctl00$mainContentPlaceHolder$taskTypeText: "FVBANKRUPT",
              ctl00$mainContentPlaceHolder$taskTypeIdHidden: 465,
              ctl00$mainContentPlaceHolder$linkReferenceText: message.data.debtorid,
              ctl00$mainContentPlaceHolder$sourceText: "BSPFIN:Business Service Provider - Financial",
              ctl00$mainContentPlaceHolder$startDateTextBox: t.toJSON().slice(0, 10).split('-').reverse().join('/'),
              ctl00$mainContentPlaceHolder$reasonText: 'ENFRVREQ:"Request for Enforcement Review to be decided"',
              ctl00$mainContentPlaceHolder$startTimeTextBox: t.getHours() + ":" + t.getMinutes(),
              ctl00$mainContentPlaceHolder$originText: "DEBTOR:Debtor"

            }
            if (properties.taskId) {
              ctl00$mainContentPlaceHolder$createTaskCheck = "";
              ctl00$mainContentPlaceHolder$taskIdText = properties.taskId;
            }

            return params
          }
        }, {
          url: `https://${source}.view.civicacloud.com.au/Taskflow/Forms/Management/DocumentImport.aspx`,
          urlParams: (parsedDocument, b, url) => {

            if (parsedDocument.getElementById('ctl00_mainContentPlaceHolder_messageLable') && properties.taskId === undefined) {
              properties.taskId = parsedDocument.getElementById('ctl00_mainContentPlaceHolder_messageLable').textContent.split(" ")[7]
            }
            return {};
          }
        }]
      }
    ]
  }

  let proceduralHolds = {
    name: "Procedural Holds",
    submit: [{
      optional: () => { return !properties.dateOfBankruptcy },
      url: `https://${source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorFurtherDetails.aspx`,
    },
    {
      url: `https://${source}.view.civicacloud.com.au/Traffic/Debtors/Forms/Warrant/DebtorExecuteAction.aspx`,
      urlParams: (parsedDocument) => {
        (parsedDocument && parsedDocument.getElementById('DebtorIndividualCtrl_dateOfBankruptcyTxt')) && (properties.dateOfBankruptcy = parsedDocument.getElementById('DebtorIndividualCtrl_dateOfBankruptcyTxt').textContent.trim().split("/").reverse().join("-"));
      }
    }, {
      url: `https://${source}.view.civicacloud.com.au/Traffic/Debtors/Forms/Warrant/DebtorExecuteAction.aspx`,
      urlParams: { "DebtorExecuteActionCtrl$ddlAction": 10 }
    }
    ],
    elements: [
      { tag: "div", attributes: { id: "tablecontainer", style: "margin: auto; grid-column-start: 1; grid-column-end: 5; width: 80%; align-self: start; font-size: 8pt; margin-bottom: 20px" } },
      { tag: "table", "selectCriteria": "WarrantProvable", parent: "tablecontainer", dataSource: () => getDebtorObligations(source), attributes: { id: "obligationtable", class: "table", style: "grid-column-start: 2; grid-column-end: 5; width: 100%; align-self: start; font-size: 8pt;" } },
      { tag: "input", label: "Officer Id:", text: "111052", attributes: { id: "officerIdField", type: "text", name: "debtorProceduralActionCtrl$hdnOfficerId", class: "field", style: "grid-column-start: 2; grid-column-end: 5; width: 80%; align-self: start; font-size: 8pt;" } },
      { tag: "input", label: "Officer Name:", text: "FVDXC:Declan", attributes: { id: "officerNameField", type: "text", name: "debtorProceduralActionCtrl$txtOfficerNameForProcedural", class: "field", style: "grid-column-start: 2; grid-column-end: 5; width: 80%; align-self: start; font-size: 8pt;" } },
    ],
    progressButtons: [{
      src: "SubmitAndNextStep.png",
      id: "SubmitAndNextStep",
      name: "Submit & Next Step",
      submit: [{
        url: `https://${source}.view.civicacloud.com.au/Traffic/Debtors/Forms/Warrant/DebtorExecuteAction.aspx`,
        urlParams: (vDocument, dynamicParams) => {
          const params = {}
          let warrantObligations = []
          properties.allObligations.rows({ selected: true }).every(function (rowIdx, tableLoop, rowLoop) {
            const data = this.data();
            warrantObligations.push(data.NoticeNumber);
          })
          properties.proceduralHoldsPlaced = warrantObligations.join(",");
          let tableRows = vDocument.querySelector('#WarrantGrid > tbody').children;

          Array.from(tableRows).forEach((tr, i) => {
            let currentRow = pad(i + 1, 2);
            if (tr.children[2] !== undefined && warrantObligations.includes(tr.children[2].textContent)) {
              (params[`DebtorExecuteActionCtrl$WarrantGrid$ctl${currentRow}$chkWarrantNumber`] = "on")
            }
            params["DebtorExecuteActionCtrl$btnCreateFDORecord.x"] = 0,
              params["DebtorExecuteActionCtrl$btnCreateFDORecord.y"] = 0
          })
          return params
        }
      }, {
        next: true,
        url: `https://${source}.view.civicacloud.com.au/Traffic/Debtors/Forms/Warrant/DebtorExecuteAction.aspx`,
        urlParams: {
          "debtorProceduralActionCtrl$hdnWarrantStatusChangeRequired": true,
          "debtorProceduralActionCtrl$hdnWarrantStatusID": 97,
          "debtorProceduralActionCtrl$hdnIsDecreseFieldCountCheck": "No",
          "debtorProceduralActionCtrl$debtorProceduralActionCtrl$hdnProceduralActionCatalogueID": 263,
          "debtorProceduralActionCtrl$btnUpdateProceduralAction.x": 0,
          "debtorProceduralActionCtrl$btnUpdateProceduralAction.y": 0,
          "debtorProceduralActionCtrl$txtProceduralAction": "NOTDBNKRPT:Notification of Debtor Bankruptcy",
          "debtorProceduralActionCtrl$hdnProceduralActionCode": "NOTDBNKRPT",
        }
      }],
    }]
  }

  let placeHolds = {
    name: "Place Holds",
    submit: [
      {
        optional: () => { return !properties.dateOfBankruptcy },
        url: `https://${source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorFurtherDetails.aspx`,
        urlParams: {}
      },
      {
        url: `https://${source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkGenericUpdate.aspx?Mode=H&Menu=3`,
        urlParams: (parsedDocument) => {
          (parsedDocument && parsedDocument.getElementById('DebtorIndividualCtrl_dateOfBankruptcyTxt')) && (properties.dateOfBankruptcy = parsedDocument.getElementById('DebtorIndividualCtrl_dateOfBankruptcyTxt').textContent.trim().split("/").reverse().join("-"));
        }
      }
    ],
    elements: [
      { tag: "div", attributes: { id: "tablecontainer", style: "margin: auto; grid-column-start: 1; grid-column-end: 5; width: 80%; align-self: start; font-size: 8pt; margin-bottom: 20px" } },
      { tag: "table", selectCriteria: "Provable", parent: "tablecontainer", dataSource: () => getDebtorObligations(source), attributes: { id: "obligationtable", class: "table", style: "grid-column-start: 2; grid-column-end: 5; width: 100%; align-self: start; font-size: 8pt;" } },
      { tag: "input", label: "Hold Reason:", attributes: { value: "PROVABLE:Provable – Subject to bankruptcy", id: "txtHoldReason", name: "txtHoldReason", type: "text", class: "textField", style: "grid-column-start: 2; grid-column-end: 5; width: 80%; align-self: start; font-size: 8pt;" } },
      { tag: "input", label: "End Date:", attributes: { id: "txtIneffectiveDate", name: "txtIneffectiveDate", type: "text", class: "textField", style: "grid-column-start: 2; grid-column-end: 5; align-self: start; font-size: 8pt; width: 80%" } },
    ],
    progressButtons: [{
      src: "SubmitAndNextStep.png",
      id: "SubmitAndNextStep",
      name: "Submit & Next Step",
      groupRepeats: {
        "Group 1": () => {
          let paramArray = [];
          properties.allObligations.rows({ selected: true }).every(function (rowIdx, tableLoop, rowLoop) {
            let params = {};
            let data = this.data();
            let all = properties.allObligations.rows({ selected: true }).data().toArray()
            let previousObligations = all.map(row => row.NoticeNumber).slice(0, rowLoop).join(",");
            params["txtNoticeNo"] = data.NoticeNumber;
            if (rowLoop >= 1) {
              params["txtNoticeCheck"] = previousObligations
            }
            paramArray.push(params);
          });
          return paramArray;
        }, "Group 2": () => {
          let previousObligations = properties.allObligations.rows({ selected: true }).data().toArray().map(row => row.NoticeNumber).join(",");;
          if (!properties.holdsPlaced)
            properties.holdsPlaced = previousObligations;
          else
            properties.holdsPlaced = properties.holdsPlaced + "," + previousObligations;
          return [{ "txtNoticeCheck": previousObligations }]
        }
      },
      submit: [{
        group: "Group 1",
        url: `https://${source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkGenericUpdate.aspx?Mode=H&Menu=3`,
        urlParams: (parsedDocument, dynamicParams = {}) => {
          const params = {}
          for (let [key, value] of Object.entries(dynamicParams)) { params[key] = value }
          params["btnNoticeAdd.x"] = 0;
          params["btnNoticeAdd.y"] = 0;
          return params
        }
      }, {
        group: "Group 2",
        url: `https://${source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkGenericUpdate.aspx?Mode=H&Menu=3`,
        next: true,
        urlParams: (parsedDocument, dynamicParams = {}) => {
          const params = {}
          for (let [key, value] of Object.entries(dynamicParams)) { params[key] = value }
          params["btnBulkUpdate.x"] = 0;
          params["btnBulkUpdate.y"] = 0;
          return params
        }
      }]
    }]
  }

  let noticeNotes = {
    name: "Notice Notes",
    submit: [
      {
        url: `https://${source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkGenericUpdate.aspx?Mode=N&Menu=3`,
      }
    ],
    elements: [
      { tag: "div", label: "Obligations:", attributes: { id: "tablecontainer", style: "grid-column-start: 2; grid-column-end: 5; width: 80%; align-self: start; font-size: 8pt; margin-bottom: 20px" } },
      { tag: "table", selectCriteria: "onHold", parent: "tablecontainer", dataSource: () => getDebtorObligations(source), attributes: { id: "obligationtable", class: "table", style: "grid-column-start: 2; grid-column-end: 5; width: 100%; align-self: start; font-size: 8pt;" } },
      { tag: "textarea", label: "Note:", attributes: { id: "noticeNoteField", name: "txtNotes", class: "textField", style: "grid-column-start: 2; grid-column-end: 5; width: 80%; height:50px; align-self: start; font-size: 8pt;" } },
    ],
    progressButtons: [{
      src: "SubmitAndNextStep.png",
      id: "SubmitAndNextStep",
      name: "Submit & Next Step",
      submit: [{
        url: `https://${source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkGenericUpdate.aspx?Mode=N&Menu=3`,
        repeat: () => {
          let paramArray = [];
          properties.allObligations.rows({ selected: true }).every(function (rowIdx, tableLoop, rowLoop) {
            let params = {};
            let data = this.data();
            let all = properties.allObligations.rows({ selected: true }).data().toArray()
            let previousObligations = all.map(row => row.NoticeNumber).slice(0, rowLoop).join(",");
            params["txtNoticeNo"] = data.NoticeNumber;
            if (rowLoop >= 1) {
              params["txtNoticeCheck"] = previousObligations
            }
            paramArray.push(params);
          });
          return paramArray;
        },
        urlParams: (vDocument, dynamicParams) => {
          const params = {}
          for (let [key, value] of Object.entries(dynamicParams)) { params[key] = value }
          params["btnNoticeAdd.x"] = 0;
          params["btnNoticeAdd.y"] = 0;
          return params
        }
      }, {
        url: `https://${source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkGenericUpdate.aspx?Mode=N&Menu=3`,
        repeat: () => {
          let previousObligations = properties.allObligations.rows({ selected: true }).data().toArray().map(row => row.NoticeNumber).join(",");;
          return [{ "txtNoticeCheck": previousObligations }]
        },
        next: true,
        url: `https://${source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkGenericUpdate.aspx?Mode=N&Menu=3`,
        urlParams: (vDocument, dynamicParams) => {
          const params = {}
          for (let [key, value] of Object.entries(dynamicParams)) { params[key] = value }
          params["btnBulkUpdate.x"] = 0;
          params["btnBulkUpdate.y"] = 0;
          return params
        }
      }]
    }]
  }

  let debtorNote = {
    name: "Debtor Note",
    submit: [{
      url: `https://${source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorNotes.aspx`,
    },
    {
      url: `https://${source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorNotes.aspx`,
      urlParams: {
        "PESNotesCtrlMain$btnAddNote.x": 0,
        "PESNotesCtrlMain$btnAddNote.y": 0
      }
    }],
    elements: [
      {
        tag: "textarea",
        label: "Note:",
        prefill: (parsedDocument, field) => {
          field.value = `Bankruptcy investigated and processed.

Copy of bankruptcy letter and schedule uploaded to task ${properties.taskId}.\n
${properties.holdsRemoved ? `
Holds removed on obligations:
${properties.holdsRemoved.replace(/,/g, '\n')}
` : ''}${properties.holdsPlaced ? `
Provable obligations subject to bankruptcy placed on hold:
${properties.holdsPlaced.replace(/,/g, '\n')}
` : ''}${properties.proceduralHoldsPlaced ? `
Procedural holds placed on provable warrant obligations:
${properties.proceduralHoldsPlaced.replace(/,/g, '\n')}

` : ''}`
        },
        attributes: { name: "PESNotesCtrlMain$txtNotes", id: "noteDescription", style: "grid-column-start: 2; grid-column-end: 5; width: 80%; align-self: start; font-size: 8pt; height: 200px" }
      },
    ],
    progressButtons: [{
      src: "SubmitAndNextStep.png",
      id: "SubmitAndNextStep",
      name: "Submit & Next Step",
      submit: [{
        url: `https://${source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorNotes.aspx`,
        next: true,
        urlParams: {
          "PESNotesCtrlMain$btnUpdate.x": 0,
          "PESNotesCtrlMain$btnUpdate.y": 0
        }
      }]
    }]
  }


  let application = {
    name: "Application",
    submit: [
      {
        urlParams: function (parsedDocument) {
          this.url = `https://${source}.view.civicacloud.com.au/Taskflow/Forms/Management/TaskMaintenance.aspx?TaskId=${properties.taskId}&ProcessMode=User`;
        }
      }, {
        urlParams: function () {
          this.url = `https://${source}.view.civicacloud.com.au/Taskflow/Forms/Management/TaskMaintenance.aspx?TaskId=${properties.taskId}&ProcessMode=User`;
          return {
            "ctl00$mainContentPlaceHolder$editButton.x": 0,
            "ctl00$mainContentPlaceHolder$editButton.y": 0
          }
        }
      }],
    elements: [
      { tag: "select", label: "Status:", attributes: { id: "statusChooser", style: "grid-column-start: 2; grid-column-end: 5; align-self: start; width: 80%" } },
      { tag: "option", parent: "statusChooser", attributes: { disabled: "true", selected: "true" }, text: "Select an application status" },
      { tag: "option", parent: "statusChooser", text: "Processed – bankruptcy" },
      { tag: "option", parent: "statusChooser", text: "Reviewed – no provable" },
      { tag: "option", parent: "statusChooser", text: "Further information required" },
      { tag: "option", parent: "statusChooser", text: "Processed – accepted agreement" },
      { tag: "option", parent: "statusChooser", text: "Investigation required" },
      { tag: "option", parent: "statusChooser", text: "Discharged prior 2018" },
      { tag: "option", parent: "statusChooser", text: "Agreement terminated – holds lifted" },
      { tag: "option", parent: "statusChooser", text: "Processed – write-off" },
      { tag: "input", label: "AFSA Reference:", attributes: { id: "afsaReference", type: "text", style: "grid-column-start: 2; grid-column-end: 5; width: 80%; height: 20px" } }
    ],
    progressButtons: [
      {
        src: "SubmitAndNextStep.png",
        id: "SubmitAndNextStep",
        name: "Submit & Next Step",
        submit: [{
          url: `https://${source}.view.civicacloud.com.au/Taskflow/Forms/Management/TaskMaintenance.aspx?TaskId=${properties.taskId}&ProcessMode=User`,
          next: true,
          urlParams: (parsedDocument) => {
            const params = {
              "ctl00$mainContentPlaceHolder$updateButton.x": 0,
              "ctl00$mainContentPlaceHolder$updateButton.y": 0,
              "ctl00$mainContentPlaceHolder$descriptionText": `Status: ${document.getElementById("statusChooser").value}, AFSA Reference: ${document.getElementById("afsaReference").value}`
            }
            return params;
          }
        }]
      }
    ]
  }

  let letter = {
    name: "Letter",
    submit: [
      {
        repeat: 0,
        url: `https://${source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorAddresses.aspx`
      }, {
        url: `https://${source}.view.civicacloud.com.au/Traffic/Notices/Forms/NoticesManagement/NoticesSearch.aspx`,
        urlParams: (parsedDocument, dynamicParams = {}) => {
          properties.addressTable = parsedDocument.querySelector("#DebtorAddressesCtrl_gridDebtorAddresses_tblData > tbody");
          return {}
        }
      }
    ],
    elements: [
      { tag: "div", attributes: { id: "tablecontainer", style: "margin: auto; grid-column-start: 1; grid-column-end: 5; width: 80%; align-self: start; font-size: 8pt; margin-bottom: 20px" } },
      { tag: "table", parent: "tablecontainer", "selectCriteria": "all", dataSource: () => getDebtorObligations(source), attributes: { id: "obligationtable", class: "table", style: "grid-column-start: 2; grid-column-end: 5; width: 100%; align-self: start; font-size: 8pt;" } },
      {
        tag: "select", label: "Address:", prefill: (parsedDocument, field) => {
          const addressTableRows = Array.from(properties.addressTable.children);
          addressTableRows.forEach((tr, i) => {
            field.insertAdjacentHTML('beforeend', `<option>${tr.children[2].textContent}, ${tr.children[3].textContent}, (${tr.children[1].textContent})</option>`)
          })
        }, attributes: { id: "addressChooser", style: "grid-column-start: 2; grid-column-end: 5; width: 80%; align-self: start; font-size: 8pt;" }
      },
      { tag: "input", label: "Bankruptcy Notification Date:", attributes: { id: "noteDate", type: "date", style: "grid-column-start: 2; grid-column-end: 5; width: 80%; align-self: start; font-size: 8pt;" } }
    ],
    progressButtons: [
      {
        src: "downloadLetterAndFinish.png",
        class: "purpleButton",
        id: "SubmitAndNextStep",
        name: "Submit & Next Step",
        groupRepeats: {
          "Group 2": () => {
            const paramArray = [];
            properties.allObligations.rows({ selected: true }).every(function (rowIdx, tableLoop, rowLoop) {
              const data = this.data();
              const params = {};
              params["txtNoticeNo"] = data.NoticeNumber;
              paramArray.push(params);
            });
            return paramArray;
          }
        },
        submit: [
          {
            group: "Group 1",
            url: `https://${source}.view.civicacloud.com.au/Traffic/Notices/Forms/NoticesManagement/NoticesSearch.aspx`,
            urlParams: () => {
              properties.agencies = []
              return {}
            },
            clearParams: true
          }, {
            group: "Group 2",
            url: `https://${source}.view.civicacloud.com.au/Traffic/Notices/Forms/NoticesManagement/NoticesSearch.aspx`,
            clearParams: false,
            urlParams: (parsedDocument, dynamicParams = {}) => {
              properties.agencies.push({ key: parsedDocument.getElementById("NoticeInfo_txtNoticeNo").value, value: parsedDocument.getElementById("NoticeInfo_lblAgencyCode").textContent });
              const params = {
                "btnSearch.x": 0,
                "btnSearch.y": 0
              }
              for (let [key, value] of Object.entries(dynamicParams)) { params[key] = value }
              return params
            }
          }, {
            group: "Group 2",
            url: `https://${source}.view.civicacloud.com.au/Traffic/Notices/Forms/NoticesManagement/NoticesSearch.aspx`,
            clearParams: true,
            urlParams: (parsedDocument, repeatDynamicParams, groupDynamicParams = {}) => {
              return {}
            }
          }, {
            group: "Group 3",
            url: `https://${source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorAddresses.aspx`,
            clearParams: true,
            urlParams: (parsedDocument, repeatDynamicParams, groupDynamicParams = {}) => {
              return {}
            }
          }
        ],
        afterAction: (parsedDocument) => {
          let address = document.getElementById('addressChooser').value
          let debtorId = parsedDocument.getElementById('DebtorDetailsCtrl_DebtorIdSearch').value
          let firstName = parsedDocument.getElementById('DebtorDetailsCtrl_firstnameTxt').textContent
          let lastName = parsedDocument.getElementById('DebtorDetailsCtrl_surnameTxt').textContent
          downloadLetter(address, firstName, lastName, debtorId);
          const container = document.getElementById('container');
          container.innerHTML = "";
          const message = document.createElement('div');
          message.id = "messagebox"
          message.textContent = "It is now safe to close this window"
          container.append(message);
          shade.style.display = "none"
        }
      }
    ]
  }

  startWizard([uploadDocuments, bankruptcyDate, removeHolds, placeHolds, proceduralHolds, debtorNote, application, letter])
}

/* Called when the window is created and loaded */
chrome.runtime.onMessage.addListener(onCreate);

async function getDebtorObligations(source) {
  //Get stateless page
  let vDocument = await fetchResource(`https://${source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorObligationsSummary.aspx`);
  let parsedDocument = await parsePage(vDocument)
  let formData = await getFormData(parsedDocument)

  //Get page with all obligations if more than 50
  let rowCount = parsedDocument.querySelector("#DebtorNoticesCtrl_DebtorNoticesTable_PageChooserCell > span").textContent.trim().split(" ");
  if (Number(rowCount[rowCount.length - 1]) > 50) {
    formData["DebtorNoticesCtrl$DebtorNoticesTable$ddRecordsPerPage"] = 0;
    vDocument = await fetchResource(`https://${source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorObligationsSummary.aspx`, {
      method: "POST",
      body: formData
    }, "URLSearchParams");
    parsedDocument = await parsePage(vDocument)
  }

  return (parseTable(parsedDocument.getElementById("DebtorNoticesCtrl_DebtorNoticesTable_tblData")))
}

async function buildTable(element, field) {
  let tableData = await element.dataSource()

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

  let dataTable = $(field).DataTable({
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
      { "data": "VRM", "title": "VRM" },
      { "data": "DueDate", "title": "Due Date" },
      { "data": "SanctionNumbers", "title": "Sanction Numbers" }
    ],
    "columnDefs": [
      {
        "visible": false,
        "targets": [2, 5, 8, 10, 11, 12, 13, 14]
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
  });
  properties.allObligations = dataTable;

  if (element.selectCriteria === "WarrantProvable") {
    dataTable.columns(7).search("WARRNT").draw();
  }

  dataTable.rows().every(function (rowIdx, tableLoop, rowLoop) {
    let data = this.data();
    let types = ["1A", "1B", "1C", "2A"];
    let statuses = ["WARRNT", "CHLGLOG", "NFDP"];
    let bd = moment(properties.dateOfBankruptcy, "YYYY-MM-DD")
    let td = moment(data.OffenceDate, "DD/MM/YYYY")
    let balance = Number(data.BalanceOutstanding.replace(/[^0-9.-]+/g, ""));

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
        (this.select());
    }

    if (element.selectCriteria === "BRTHOLD") {
      // Selects provable PA holds and notification of bankruptcy holds
      (balance > 0) && (td < bd) &&
        (types.some(type => data.InputType === type)) &&
        (statuses.some(status => data.NoticeStatusPreviousStatus.includes(status))) &&
        (data.HoldCodeEndDate.trim().includes("PAYARNGMNT")) &&
        (this.select());

      (bd.isBefore(td)) &&
        (data.HoldCodeEndDate.trim().includes("BANKRUPT")) &&
        (this.select());

    }

    if (element.selectCriteria === "all") {
      //Selects all unpaid obligations
      statuses = ["WARRNT", "CHLGLOG", "NFDP", "SELENF"];

      (balance > 0) &&
        (statuses.some(status => data.NoticeStatusPreviousStatus.includes(status))) &&
        this.select();
    }

  });

  return dataTable
}

function downloadLetter(address, firstName, lastName, debtorId) {
  let addressArray = address.split(",");

  let l = {
    "provable": [],
    "courtFines": [],
    "nonProvable": [],
    "zeroBalance": [],
    "dateOfBankruptcy": toDate(properties.dateOfBankruptcy).toLocaleString('en-au', { day: 'numeric', month: 'long', year: 'numeric' }),
    "bankruptcynotificationdate": toDate(document.getElementById('noteDate').value).toLocaleString('en-au', { day: 'numeric', month: 'long', year: 'numeric' }),
    "First_Name": titleCase(firstName),
    "Last_Name": titleCase(lastName),
    "Address_1": titleCase(addressArray[0].trim()),
    "Town": addressArray[1].trim(),
    "State": addressArray[2].trim(),
    "Post_Code": addressArray[3].trim(),
    "Debtor_ID": debtorId
  }
  console.log(properties.agencies);
  let reduced = properties.agencies.reduce((obj, item) => (obj[item.key] = item.value, obj), {});

  console.log(reduced);

  properties.allObligations.rows({ selected: true }).every(function (rowIdx, tableLoop, rowLoop) {
    let data = this.data();

    const types = ["1A", "1B", "1C", "2A"];
    const statuses = ["WARRNT", "CHLGLOG", "NFDP"];

    data.agency = reduced[data.NoticeNumber];
    let bd = moment(properties.dateOfBankruptcy, "YYYY-MM-DD")
    let td = moment(data.OffenceDate, "DD/MM/YYYY")

    let balance = Number(data.BalanceOutstanding.replace(/[^0-9.-]+/g, ""));

    (balance <= 0) &&
      (l.zeroBalance.push(data)) ||
      (bd.isAfter(td)) &&
      (types.some(type => data.InputType === type)) &&
      (statuses.some(status => data.NoticeStatusPreviousStatus.includes(status))) &&
      (l.provable.push(data)) ||
      (data.Offence === "0000") &&
      (l.courtFines.push(data)) ||
      (statuses.some(status => data.NoticeStatusPreviousStatus.includes(status))) &&
      (l.nonProvable.push(data));

  })
  backgroundLetterMaker(l, firstName, lastName)
}

function loadFile(url, callback) {
  JSZipUtils.getBinaryContent(url, callback);
}

function angularParser(tag) {
  if (tag === '.') {
    return {
      get: function (s) { return s; }
    }
  }
  const expr = expressions.compile(tag.replace(/(’|“|”)/g, "'"));
  return {
    get: function (s) {
      return expr(s);
    }
  }
}

async function backgroundLetterMaker(letterData, firstName, lastName) {
  const letterTemplate = await loadLetter("https://trimwebdrawer.justice.vic.gov.au/record/13930494/File/document")
  /* Create a letter for each of the objects in letterData */
  const letter = makeLetter(letterData, letterTemplate)
}

function makeLetter(content, letterTemplate) {
  var zip = new JSZip(letterTemplate);
  var doc = new window.Docxtemplater().loadZip(zip)
  doc.setOptions({
    parser: angularParser
  })

  doc.setData(content);
  try {
    // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
    doc.render()
  }
  catch (error) {
    var e = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      properties: error.properties,
    }
    console.log(JSON.stringify({ error: e }));
    // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
    throw error;
  }
  var out = doc.getZip().generate({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  }) //Output the document using Data-URI    
  saveAs(out, `${firstName} ${lastName} - Bankruptcy Confirmation.docx`)
  //window.close()
}

function loadLetter(url) {
  return new Promise((resolve, reject) => {
    JSZipUtils.getBinaryContent(url, function (err, data) {
      if (err) {
        throw err; // or handle err
      }
      data = resolve(data);
      return data;
    });
  });
}

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function titleCase(string) {
  var sentence = string.toLowerCase().split(" ");
  for (var i = 0; i < sentence.length; i++) {
    sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1);
  }
  return sentence.join(" ");
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