import fetchRetryTimeout from '../js/fetchRetryTimeout.js';

async function VIEWsubmit(data, incrementor, parsedDocument, dataParams, properties = {}) {  
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
      const dynamicParams = typeof groupedRepeats[groupName] === "function" && groupedRepeats[groupName](properties) || groupedRepeats[groupName] || [{}];
      for (let set of dynamicParams) {
        for (let submitInstructions of group) {
          if (properties.portDisconnected) throw "Window Closed";
          console.log("-------------------------");
          console.log("Fetching:", submitInstructions.url);
          if (submitInstructions.optional && submitInstructions.optional(parsedDocument, properties) === false) continue;
          let urlParams = typeof submitInstructions.urlParams === "function" && submitInstructions.urlParams(parsedDocument, set, properties) || submitInstructions.urlParams;
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
          let fetchOptions = { method: submitInstructions.method || "POST", headers: { "x-civica-application": "CE", "sec-fetch-site": "same-origin" } };
          if (submitInstructions.body !== false) { fetchOptions.body = form_data }
          let vDocument
          if (submitInstructions.sameorigin) {
            vDocument = await runFetchInContentScript(submitInstructions.url, fetchOptions);
          } else {
            vDocument = await fetchRetryTimeout(submitInstructions.url, fetchOptions);
            let attempts = submitInstructions.attempts || 3;
            parsedDocument = await parsePage(vDocument, submitInstructions.url, fetchOptions, attempts);
            formData = await getFormData(parsedDocument);
          }
          submitInstructions.after && submitInstructions.after(parsedDocument);
          if (submitInstructions.next === true) {
            return true
          }
        }
      }
    }
    dataParams.afterAction && dataParams.afterAction(parsedDocument, properties);
    if (dataParams.next === true) {
      return true
    }

    if (dataParams.next === false) {
      return false
    }

    return parsedDocument
  }

  function groupBy(arr, property) {
    return arr.reduce(function (memo, x) {
      if (x[property] === undefined) { x[property] = "Ungrouped" }
      if (!memo[x[property]]) { memo[x[property]] = []; }
      memo[x[property]].push(x);
      return memo;
    }, {});
  }

  async function getFormData(parsedDocument) {
    const formElement = parsedDocument.querySelector("form");
    let formData = new FormData(formElement || document.createElement('form'));
    var formDataObject = {};
    formData.forEach((value, key) => { formDataObject[key] = value });
    return formDataObject;
  }

  async function parsePage(vDocument, url, fetchOptions) {
    let getbody = function (vDocument) {
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

  export default VIEWsubmit;