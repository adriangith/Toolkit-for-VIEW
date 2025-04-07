let source = "djr"
let running = false;

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.URLHost) {
    sendResponse(message.URLHost);
    source = message.URLHost
  } else if (message.getURLHost) {
    sendResponse(source);
  }
  return true;
})

chrome.runtime.onMessage.addListener(
  async function (message, sender, sendResponse) {
    if (message[5] !== undefined) {
      source = message[5]
    }
    if (sender.url.toUpperCase().includes(`https://${source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorObligations`.toUpperCase()) ||
      sender.url.toUpperCase().includes(`https://${source}.view.civicacloud.com.au/Traffic/Notices/Forms/Noticesmanagement/NoticesBulkGenericUpdate.aspx`.toUpperCase())
    ) {
      /*-----------------------------------*/
      if (message[1] === "Export obligations") {
        getData(message[0]).then(data => {
          table(data.a, data.First_Name + " " + data.Last_Name);
        }).catch(err => {
          if (err !== 'Scraper already running') {
            running = false; 
          } 
          throw err;
        })

      }
      /*------ Call email functions -----*/
      console.log(message[1])
      if (message[1] !== "Export obligations" && message[1] !== "Bulk Hold Update" && message[1] !== "Bulk Notes Update" && message[1] !== "Bulk Writeoff Update" && message[4] === true) {
        getData(message[0]).then(data => {
          console.log('To Do: Update email function')
          emailMaker(data, message);
        })
      }
      /*-----------------------------------*/
    }
  }
)

var agencies = {}
//Get list of Agencies
fetch('https://vicgov.sharepoint.com/:u:/s/msteams_3af44a/ETiKQS5uTzxHnTmAV6Zpl9oBvhNZexZFmJrJxLNZLD6L4A?download=1')
  .then(response => {
    return response.json()
  })
  .then(data => {
    agencies = data.addresses;
  })
  .catch(err => {
    console.log(err);
  })

async function getDebtorData() {
  htmlText = await getPage(config[3])
  debtorDetails = parsePage(config[3], htmlText)
  return debtorDetails
}

async function scrape(obligations) {
  array = []
  let obligationsCount = obligations.length
  let obligationsCountFixed = obligations.length
  let data;
  for (obligation in obligations) {
    data = await switchObligations(obligations[obligation]).then(async function () {
      let obj = {}
      const promises = config.filter(function (page) {
        if (page.active === true) {
          return true;
        }
        return false;
      }).map(async (page) => {
        let data;
        htmlText = await getPage(page)
        if (page.controlID !== undefined) {
          let formData = await getFormData(htmlText);
          formData.set(page.controlID + '.x', 0);
          formData.set(page.controlID + '.y', 0);
          htmlText = await getPage(page, formData);
        }

        if (page.type !== 'table') { data = await parsePage(page, htmlText); }
        else { data = await getTable(htmlText, undefined, page); }
        return data;
      })
      data = Promise.all(promises).then(dataArray => {
        let data = Object.assign({}, ...dataArray)
        array.push(data);
        return array;
      })
      return await data
    });
    chrome.storage.local.set({ 'obligationsCount': obligationsCount, "obligationsCountFixed": obligationsCountFixed });
    obligationsCount--
  }
  return await data
}

async function switchObligations(obligation) {
  if (source === "") {
    source = "djr"
  }
  //Changes the active obligation
  const res = fetch("https://" + source + ".view.civicacloud.com.au/Traffic/Notices/forms/NoticesManagement/SearchNotice.aspx?&NoticeNo=" + obligation, {
    method: 'GET',
    redirect: 'manual'
  });
  return res
}

async function getPage(page, formData = new URLSearchParams()) {

  console.log(formData);

  let res = await fetch(page.url, {
    method: 'POST',
    body: formData
  });
  let htmlText = await res.text();
  htmlText = $($.parseHTML(htmlText))
  return htmlText;
}

async function parsePage(page, htmlText) {

  //Get the page that we want.
  let data = {};
  if (page.name === 'debtorAddress') { getAppData(data) }
  for (item in page.targetTags) {
    item = page.targetTags[item];
    if (item.method === 'text') {
      data[item.field] = htmlText.find(item.tag).text() !== undefined ? htmlText.find(item.tag).text() : ""
    } else if (item.method === 'callback') {
      data[item.field] = item.callback(htmlText);
    } else if (item.method === 'value') {
      data[item.field] = htmlText.find(item.tag).val() !== undefined ? htmlText.find(item.tag).val() : ""
    } else if (item.method === 'title') {
      data[item.field] = htmlText.find(item.tag).attr('title') !== undefined ? htmlText.find(item.tag).attr('title') : ""
    }
  }
  return data;
}


function getAppData(data) {
  chrome.storage.local.get(['value'], function (items) {
    applicationData = items.value;
    for (application in applicationData) {
      data.legalCentre = false;
      if (applicationData[application][0] === data.Debtor_ID) {
        if (applicationData[application][1] === true) {
          data.tParty = true;
          data.applicantName = applicationData[application][2];
          data.appOrganisation = applicationData[application][3];
          data.appStreet = applicationData[application][4];
          data.appTown = applicationData[application][5];
          data.appState = applicationData[application][6];
          data.appPost = applicationData[application][7];
          data.legalCentre = applicationData[application][17];
          if (applicationData[application][8] === true) {
            data.recipient = '3rd Party'
          } else if (applicationData[application][9] === true) {
            data.recipient = 'Debtor'
          } else if (applicationData[application][10] === true) {
            data.recipient = 'Alt 3rd Party'
            data.altApplicantName = applicationData[application][11];
            data.altAppOrganisation = applicationData[application][12];
            data.altAppStreet = applicationData[application][13];
            data.altAppTown = applicationData[application][14];
            data.altAppState = applicationData[application][15];
            data.altAppPost = applicationData[application][16];
            data.legalCentre = applicationData[application][18];
          }
          break;
        } else { data.tParty = false; }
      }

    }

  })
}



async function getTable(htmlText, table = document.createElement("table"), page) {
  let block = await combineTable(htmlText, table)
  let data;
  let formData = block[0]
  let pageCount = block[1]
  if (pageCount === 1) {
    data = getTableData(table);
  } else if (pageCount > 1) {
    data = await getOtherTables(htmlText, table, page, '100', '100', formData).then(async function (block) {
      if (block[1] === 2) { return tableData = getTableData(table) } else {
        for (var g = block[1] - 1; g >= 2; g--) {
          data = await getOtherTables(htmlText, table, page, g, g, block[0]).then(async function (block) { if (g === 2) { return tableData = getTableData(table) } });
        }
        return data;
      }
    })
  }
  return data;
}

function getTableData(table) {
  let data;
  let blata;
  let filter = "642";
  let filter2 = "Warrant Issue Fee added in VIMS";
  tr = table.children[0].childNodes;
  for (j = 0; j < tr.length; j++) {
    td = tr[j].childNodes;
    cell = td[5];
    if (cell) {
      txtValue = cell.textContent || cell.innerText;
      if (txtValue.indexOf(filter) > -1) {
        data = { "642": cell.parentElement.children[0].textContent.match(/([^\s]+)/)[0] }

      } else if (txtValue.indexOf(filter2) > -1) {
        blata = { "Warrant Issue Date": cell.parentElement.children[0].textContent.match(/([^\s]+)/)[0] }
      }
      else { }
    }
  }
  if (data !== undefined) { data = Object.assign(data, blata) }
  return data;
}

async function getOtherTables(htmlText, table, page, txtPageNo, htxtPage, formData) {
  formData.set('txtPageNo', txtPageNo);
  formData.set('htxtPage', htxtPage);
  formData.set('__EVENTTARGET', 'lnkPages');
  htmlText = await getPage(page, formData);
  let block = await combineTable(htmlText, table)
  formData = block[0]
  let pageCount = block[1]
  return [formData, pageCount, htmlText];
}

async function combineTable(htmlText, table) {
  let pageCount = htmlText.find('#lblPageCount')[0].lastChild.previousElementSibling.innerText
  pageCount = parseInt(pageCount)
  let formData = await getFormData(htmlText);
  htmlText.find('#dgNoticeAudit tbody tr').each(function () {
    $(this).clone().appendTo(table);
  }
  )
  return [formData, pageCount];
}


async function getFormData(htmlText) {
  let theForm = htmlText.filter('form')[0]
  const outData = new URLSearchParams();
  for (const pair of new FormData(theForm)) {
    outData.append(pair[0], pair[1]);
  }
  return outData;
}

function transformations(data, type) {
  if (data.Agency !== undefined && type !== 'Export obligations') {
    for (agency in agencies)
      if (data.Agency === agencies[agency].altname || data.Agency === agencies[agency].altname2) {
        data.Agency = agencies[agency].enforcename;
        data.enforcename = agencies[agency].enforcename;
        data.Address2 = agencies[agency].Address2;
        data.Address3 = agencies[agency].Address3;
        data.MOU = agencies[agency].MOU;
        data.EmailAddress = agencies[agency].EmailAddress;
        data.Email = agencies[agency].Email;
        data.enforcementAgencyID = agencies[agency].enforcementAgencyID;
        data.enforcementAgencyCode = agencies[agency].enforcementAgencyCode;
      }
  }

  if (data.Company_Name !== undefined && data.Company_Name !== "") { data.Is_Company = true; data.Company_Name = toTitleCase(data.Company_Name) }
  console.log(typeof data.Balance_Outstanding);
  if (data.Balance_Outstanding !== undefined) { data.Balance_Outstanding = data.Balance_Outstanding.replace('$ ', '$') };


  if (data.First_Name !== undefined) {
    data.First_Name = toTitleCase(data.First_Name);
    data.Last_Name = toTitleCase(data.Last_Name);
    data.Last_Name = toTitleCaseHypen(data.Last_Name);
    data.First_Name = toTitleCaseHypen(data.First_Name);
    data.Address_1 = toTitleCaseHypen(data.Address_1);
    data.First_Name = data.First_Name.split(" ")[0]
  } else if (data.Company_Name !== undefined) {
    data.Company_Name = toTitleCase(data.Company_Name);
  }

  if (data.Address_1 !== undefined) {
    data.Address_1 = toTitleCase(data.Address_1)
    data.Address_1 = data.Address_1
      .replace(new RegExp(' Gr$| Gr $'), ' Grove')
      .replace(new RegExp(' St$| St $'), ' Street')
      .replace(new RegExp(' Dr$| Dr $'), ' Drive')
      .replace(new RegExp(' Ct$| Ct $ | Ct  $'), ' Court')
      .replace(new RegExp(' Rd$| Rd $'), ' Road')
      .replace(new RegExp(' Ave$| Ave $| Av$| Av $'), ' Avenue')
      .replace(new RegExp(' Cr$| Cr $| Cres$| Cres $'), ' Crescent')
      .replace(new RegExp(' Pl$| Pl $'), ' Place')
      .replace(new RegExp(' Tce$| Tce $'), ' Terrace')
      .replace(new RegExp(' Bvd$| Bvd $'), ' Boulevard')
      .replace(new RegExp(' Cl$| Cl $'), ' Close')
      .replace(new RegExp(' Cir$| Cir $'), ' Circle')
      .replace(new RegExp(' Pde$| Pde $'), ' Parade')
      .replace(new RegExp(' Cct$| Cct $'), ' Circuit')
      .replace(new RegExp(' Wy$| Wy $'), ' Way')
      .replace(new RegExp(' Esp$| Esp $'), ' Esplanade')
      .replace(new RegExp(' Sq$| Sq $'), ' Square')
      .replace(new RegExp(' Hwy$| Hwy $'), ' Highway')
      .replace('Po ', ' PO ');




  }

  if (data.Status !== undefined) {
    StatusCodes.map(statusObject => {
      if (data.Status.includes(statusObject.Description)) {
        data.Status = statusObject.Code;
      }
    })
  }

  return data;
}

function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
}

var toTitleCaseHypen = function (str) {
  return str.toLowerCase().replace(/(?:^|\s|\/|\-)\w/g, function (match) {
    return match.toUpperCase();
  });
}


chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.function == "sameSiteCookieMaker") {
      sameSiteCookieMaker()
      sendResponse({ message: "received" });
    }
  });

function sameSiteCookieMaker() {
  chrome.cookies.get({ "url": "https://" + source + ".view.civicacloud.com.au", "name": "ASP.NET_SessionId" }, function (cookie) {
    state = cookie.value
    chrome.cookies.remove({ "url": "https://" + source + ".view.civicacloud.com.au", "name": "ASP.NET_SessionId" }, function (cookie2) {
      chrome.cookies.set(
        {
          "url": "https://" + source + ".view.civicacloud.com.au",
          "domain": source + ".view.civicacloud.com.au",
          "httpOnly": true,
          "name": "ASP.NET_SessionId",
          "path": "/",
          "sameSite": "no_restriction",
          "secure": true,
          "storeId": "0",
          "value": state
        }
      )
    }
    )
  }
  )
}

async function getData(obligations) {
  if (running === true) {
    throw 'Scraper already running';
  }
  running = true;
  let data;
  let debtorData = getDebtorData();
  let grabbed = await scrape(obligations);
  data = Promise.all([debtorData, grabbed]).then(function (blah) { data = blah[0]; data.a = blah[1]; return data }).then(function (data) {
    data = transformations(data, obligations[1]);
    data.a.map(obl => transformations(obl, obligations[1]));
    return data;
  })
  running = false;
  return data;
}

let StatusCodes = [
  {
    "Code": "ACREV",
    "Description": "Reverse Court Costs"
  },
  {
    "Code": "APP",
    "Description": "Court Request Lodged"
  },
  {
    "Code": "APPACC",
    "Description": "Court Request Accepted"
  },
  {
    "Code": "APPNTC",
    "Description": "Court request not contested"
  },
  {
    "Code": "APPREJ",
    "Description": "Court Request Rejected."
  },
  {
    "Code": "APPWDN",
    "Description": "Court Request Withdrawn"
  },
  {
    "Code": "CANCL",
    "Description": "Notice cancelled"
  },
  {
    "Code": "CC",
    "Description": "Charge Certificate"
  },
  {
    "Code": "CCP",
    "Description": "Charge Certificate Posted"
  },
  {
    "Code": "CCR",
    "Description": "Charge Certificate Received"
  },
  {
    "Code": "DPEXP",
    "Description": "Discount Period Expired"
  },
  {
    "Code": "DR",
    "Description": "Registered with Fines Victoria"
  },
  {
    "Code": "DRAUTH",
    "Description": "DR Authorised"
  },
  {
    "Code": "DREXC",
    "Description": "DR Exception"
  },
  {
    "Code": "DRREQ",
    "Description": "DR Registration Request"
  },
  {
    "Code": "DW",
    "Description": "Enforcement Warrant approved"
  },
  {
    "Code": "DWAUTH",
    "Description": "Distress Warrant authorised"
  },
  {
    "Code": "DWEXC",
    "Description": "Enforcement Warrant rejected"
  },
  {
    "Code": "DWREQ",
    "Description": "Enforcement Warrant requested"
  },
  {
    "Code": "EN",
    "Description": "Enforcement Notice"
  },
  {
    "Code": "ENP",
    "Description": "Enforcement Notice posted"
  },
  {
    "Code": "ENR",
    "Description": "Enforcement Notice Requested"
  },
  {
    "Code": "EWE",
    "Description": "Extended Warrant applied"
  },
  {
    "Code": "LOG",
    "Description": "Infringement fine entered"
  },
  {
    "Code": "NR",
    "Description": "Enforcement Order"
  },
  {
    "Code": "NRP",
    "Description": "Enforcement Order issued"
  },
  {
    "Code": "NTO",
    "Description": "Penalty Reminder Notice printed"
  },
  {
    "Code": "NTOP",
    "Description": "Penalty Reminder Notice issued"
  },
  {
    "Code": "NTOR",
    "Description": "Notice to Owner Requested"
  },
  {
    "Code": "OI",
    "Description": "Offender Identified"
  },
  {
    "Code": "PAID",
    "Description": "Fully Paid"
  },
  {
    "Code": "PCN",
    "Description": "Infringement Notice printed"
  },
  {
    "Code": "PCNP",
    "Description": "Infringement Notice issued"
  },
  {
    "Code": "PCNR",
    "Description": "Penalty Charge Notice Requested"
  },
  {
    "Code": "PREDR",
    "Description": "Awaiting DR Authorisation"
  },
  {
    "Code": "PREDW",
    "Description": "Awaiting DW Authorisation"
  },
  {
    "Code": "PRENTO",
    "Description": "Pre NTO letter printed"
  },
  {
    "Code": "PRENTOR",
    "Description": "Pre NTO letter requested"
  },
  {
    "Code": "PRESO",
    "Description": "Awaiting SO authorisation"
  },
  {
    "Code": "RECORD",
    "Description": "Infringement fine recorded"
  },
  {
    "Code": "REMR",
    "Description": "Reminder requested"
  },
  {
    "Code": "REPACC",
    "Description": "Representation Accepted"
  },
  {
    "Code": "REPREJ",
    "Description": "Representation Rejected"
  },
  {
    "Code": "REPS",
    "Description": "Representation"
  },
  {
    "Code": "RESUB",
    "Description": "Resubmission of VQ4"
  },
  {
    "Code": "SELCC",
    "Description": "Selected for Charge Certificate"
  },
  {
    "Code": "SELDR",
    "Description": "Selected for Fines Victoria"
  },
  {
    "Code": "SELDW",
    "Description": "Selected for Enforcement Warrant"
  },
  {
    "Code": "SELEN",
    "Description": "Selected for Enforcement Notice"
  },
  {
    "Code": "SELNR",
    "Description": "Selected for Enforcement Order"
  },
  {
    "Code": "SELNTO",
    "Description": "Selected for Penalty Reminder Notice"
  },
  {
    "Code": "SELPCN",
    "Description": "Selected for Infringement Notice"
  },
  {
    "Code": "SELPRE",
    "Description": "Selected for pre NTO"
  },
  {
    "Code": "SELREM",
    "Description": "Selected for Reminder Letter"
  },
  {
    "Code": "SELSO",
    "Description": "Selected for Sheriff Office"
  },
  {
    "Code": "SELVQ4",
    "Description": "Selected for VQ4 enquiry"
  },
  {
    "Code": "SELWE",
    "Description": "Selected for Warrant Execution"
  },
  {
    "Code": "SLVQ4A",
    "Description": "Selected for second VQ4"
  },
  {
    "Code": "SLVQ4B",
    "Description": "Selected for third VQ4"
  },
  {
    "Code": "SO",
    "Description": "With Sheriff Office"
  },
  {
    "Code": "SOAUTH",
    "Description": "Authorised for SO"
  },
  {
    "Code": "SOPOST",
    "Description": "Sheriff Officer Posted"
  },
  {
    "Code": "SOR",
    "Description": "Sheriff Officer Requested"
  },
  {
    "Code": "STDECS",
    "Description": "Statutory Declaration"
  },
  {
    "Code": "UWE",
    "Description": "Unserved Warrant of Execution"
  },
  {
    "Code": "VQ4",
    "Description": "VQ4 enquiry made"
  },
  {
    "Code": "VQ4A",
    "Description": "VQ4 enquiry made - second"
  },
  {
    "Code": "VQ4B",
    "Description": "VQ4 enquiry made - third"
  },
  {
    "Code": "WAIVED",
    "Description": "Notice Waived"
  },
  {
    "Code": "WE",
    "Description": "Warrant of Execution granted"
  },
  {
    "Code": "WER",
    "Description": "Warrant of Execution requested"
  },
  {
    "Code": "WOFF",
    "Description": "Written Off"
  },
  {
    "Code": "WWE",
    "Description": "Withdrawn Warrant of Execution"
  },
  {
    "Code": "XWE",
    "Description": "Expired warrant"
  },
  {
    "Code": "WriteOff",
    "Description": "Written off notices"
  },
  {
    "Code": "CANCEL",
    "Description": "Canceled notices"
  },
  {
    "Code": "WaivedOff",
    "Description": "Waived Off notices"
  },
  {
    "Code": "CLOSE",
    "Description": "Closed notices"
  },
  {
    "Code": "HOLD",
    "Description": "Hold notices"
  },
  {
    "Code": "DENIAL",
    "Description": "Denial status for Representation"
  },
  {
    "Code": "CHGAR",
    "Description": "Charge requested By the Client"
  },
  {
    "Code": "HAGERD",
    "Description": "Offence Critical"
  },
  {
    "Code": "SELARESUB",
    "Description": "Selected for automatic VQ4 resubmission"
  },
  {
    "Code": "ARESUB",
    "Description": "Automatic VQ4 resubmission sent"
  },
  {
    "Code": "SELMRESUB",
    "Description": "Selected for Manual resub"
  },
  {
    "Code": "MRESUB",
    "Description": "Sent for manual resub"
  },
  {
    "Code": "PCNPRNFAIL",
    "Description": "Printing failure for PCN"
  },
  {
    "Code": "NTOPRNFAIL",
    "Description": "Printing failure for NTO"
  },
  {
    "Code": "ENPRNFAIL",
    "Description": "Printing failure for EN"
  },
  {
    "Code": "CCPRNFAIL",
    "Description": "Printing failure for CC"
  },
  {
    "Code": "NRPRNFAIL",
    "Description": "Printing failure for NR"
  },
  {
    "Code": "WEPRNFAIL",
    "Description": "Printing failure for WE"
  },
  {
    "Code": "SOPRNFAIL",
    "Description": "Printing failure for SO"
  },
  {
    "Code": "SELNTO2",
    "Description": "SELNTO2"
  },
  {
    "Code": "NTO2",
    "Description": "NTO2"
  },
  {
    "Code": "NTOP2",
    "Description": "NTOP2"
  },
  {
    "Code": "NTO2PNFAIL",
    "Description": "NTO2PNFAIL"
  },
  {
    "Code": "DI",
    "Description": "Driver Identified"
  },
  {
    "Code": "SELNTD",
    "Description": "Selected For Notice To Driver"
  },
  {
    "Code": "NTD",
    "Description": "Notice To Driver"
  },
  {
    "Code": "NTDP",
    "Description": "Notice To Driver Posted"
  },
  {
    "Code": "NTDPRNFAIL",
    "Description": "Notice To Driver Print Failed"
  },
  {
    "Code": "SELREMD",
    "Description": "Selected For Reminder To Driver"
  },
  {
    "Code": "REMD",
    "Description": "Reminder To Driver"
  },
  {
    "Code": "SELFIND",
    "Description": "Selected For Final Reminder To Driver"
  },
  {
    "Code": "FIND",
    "Description": "Final Reminder To Driver"
  },
  {
    "Code": "SELNTK",
    "Description": "Selected For Notice To Offender"
  },
  {
    "Code": "NTK",
    "Description": "Notice To Offender"
  },
  {
    "Code": "NTKP",
    "Description": "Notice To Offender Printed"
  },
  {
    "Code": "SELREMK",
    "Description": "Selected For Reminder To Offender"
  },
  {
    "Code": "REMK",
    "Description": "Reminder To Offender"
  },
  {
    "Code": "SELFINK",
    "Description": "Selected For Final Reminder To Offender"
  },
  {
    "Code": "FINK",
    "Description": "Final Reminder To Offender"
  },
  {
    "Code": "PRESUM",
    "Description": "Pre Summons"
  },
  {
    "Code": "SUMAUTH",
    "Description": "Summons Authorised"
  },
  {
    "Code": "SELSUM",
    "Description": "Selected For Summons"
  },
  {
    "Code": "SUM",
    "Description": "Summons Issued"
  },
  {
    "Code": "NTKPRNFAIL",
    "Description": "Notice To Offender Print Failed"
  },
  {
    "Code": "SOOC",
    "Description": "Settled Out-Of-Court"
  },
  {
    "Code": "SELTRIAL",
    "Description": "Elected For Trial"
  },
  {
    "Code": "CWDN",
    "Description": "Case Withdrawn"
  },
  {
    "Code": "SPROS",
    "Description": "Successful Prosecution"
  },
  {
    "Code": "NAPP",
    "Description": "Notice Approved"
  },
  {
    "Code": "NDEC",
    "Description": "Notice Declined"
  },
  {
    "Code": "NRE",
    "Description": "Notice Reissued"
  },
  {
    "Code": "NISS",
    "Description": "Notice Issued"
  },
  {
    "Code": "SELNIP",
    "Description": "Selected For Notice Of Intention To Prosecute"
  },
  {
    "Code": "NIP",
    "Description": "Notice Of Intention To Prosecute"
  },
  {
    "Code": "NIPP",
    "Description": "Notice Of Intention To Prosecute Posted"
  },
  {
    "Code": "SELPROS",
    "Description": "Selected For Prosecution"
  },
  {
    "Code": "CORREQ",
    "Description": "Correspondence Received"
  },
  {
    "Code": "CORACC",
    "Description": "Correspondence Case Accepted"
  },
  {
    "Code": "CORREJ",
    "Description": "Correspondence Case Rejected"
  },
  {
    "Code": "PROSAUTH",
    "Description": "Prosecution Authorised"
  },
  {
    "Code": "ENQ",
    "Description": "Enquiries Stage"
  },
  {
    "Code": "NIPPRNFAIL",
    "Description": "Notice of intention to prosecute print failed"
  },
  {
    "Code": "PREPROS",
    "Description": "Pre-Prosecution"
  },
  {
    "Code": "PROS",
    "Description": "Prosecution"
  },
  {
    "Code": "SELNISS",
    "Description": "Selected for issue"
  },
  {
    "Code": "RESREC",
    "Description": "Response received"
  },
  {
    "Code": "RESACC",
    "Description": "Response accepted"
  },
  {
    "Code": "RESREJ",
    "Description": "Response rejected"
  },
  {
    "Code": "REMPRNFAIL",
    "Description": "Reminder notice print failed"
  },
  {
    "Code": "NPRNFAIL",
    "Description": "Notice printing failed"
  },
  {
    "Code": "LOI",
    "Description": "Land owner identified"
  },
  {
    "Code": "ISS",
    "Description": "Notice issued"
  },
  {
    "Code": "SELISS",
    "Description": "Selected for issue"
  },
  {
    "Code": "ISSPRNFAIL",
    "Description": "Notice printing failed"
  },
  {
    "Code": "NI",
    "Description": "Notice issued"
  },
  {
    "Code": "SELN",
    "Description": "Selected for notice"
  },
  {
    "Code": "SELWL",
    "Description": "Selected for warning letter"
  },
  {
    "Code": "WLPRNFAIL",
    "Description": "Warning letter print failed"
  },
  {
    "Code": "WL",
    "Description": "Warning letter"
  },
  {
    "Code": "WLP",
    "Description": "Warning letter posted"
  },
  {
    "Code": "SELCO",
    "Description": "Selected for court order"
  },
  {
    "Code": "COS",
    "Description": "Court order served"
  },
  {
    "Code": "NP",
    "Description": "Notice printed"
  },
  {
    "Code": "CORREC",
    "Description": "Correspondence case received"
  },
  {
    "Code": "COAD",
    "Description": "Court Order Application Declined"
  },
  {
    "Code": "VOID",
    "Description": "Void notice"
  },
  {
    "Code": "WARNING",
    "Description": "Warning notice"
  },
  {
    "Code": "HREQ",
    "Description": "Hearing Requested"
  },
  {
    "Code": "SDACC",
    "Description": "Statutory Declaration Accepted"
  },
  {
    "Code": "SDREJ",
    "Description": "Statutory Declaration Rejected"
  },
  {
    "Code": "RSNDCC",
    "Description": "Charge certificate resent"
  },
  {
    "Code": "CLOST",
    "Description": "Prosecution Case Lost"
  },
  {
    "Code": "NCOMP",
    "Description": "Non-Compliance"
  },
  {
    "Code": "INV",
    "Description": "Investigation"
  },
  {
    "Code": "NRT",
    "Description": "Notice of Registration Out of Time"
  },
  {
    "Code": "WET",
    "Description": "Warrant of Execution Out of Time"
  },
  {
    "Code": "APPNTCDEN",
    "Description": "Court request not contested, denial of ownership"
  },
  {
    "Code": "APPREF",
    "Description": "Court referral actioned"
  },
  {
    "Code": "WITPAID",
    "Description": "Witness paid declaration received"
  },
  {
    "Code": "WERECYC",
    "Description": "Warrant of Execution Recycled"
  },
  {
    "Code": "CORRRET",
    "Description": "Correspondence Returned"
  },
  {
    "Code": "ADDCHKREQ",
    "Description": "Address check requested"
  },
  {
    "Code": "AWPREDECHK",
    "Description": "Awaiting Pre Debt Checks"
  },
  {
    "Code": "ADDCHKAUTH",
    "Description": "Address check authorised"
  },
  {
    "Code": "CHLGLOG",
    "Description": "Challenge Logged"
  },
  {
    "Code": "CHLGACC",
    "Description": "Challenge Accepted"
  },
  {
    "Code": "CHLGREJ",
    "Description": "Challenge Rejected"
  },
  {
    "Code": "CHLGCLS",
    "Description": "Challenge Closed"
  },
  {
    "Code": "CHLGREV",
    "Description": "Challenge Reversed"
  },
  {
    "Code": "CHLGDEN",
    "Description": "Denial status for Challenge"
  },
  {
    "Code": "APPDEN",
    "Description": "Court request accepted, denial of ownership"
  },
  {
    "Code": "PDL",
    "Description": "Pre debt letter"
  },
  {
    "Code": "SELPDL",
    "Description": "Selected for pre debt letter"
  },
  {
    "Code": "PDLP",
    "Description": "Pre debt letter posted"
  },
  {
    "Code": "PDLPRNFAIL",
    "Description": "Pre debt letter print failed"
  },
  {
    "Code": "SELENF",
    "Description": "Selected for Enforcement"
  },
  {
    "Code": "PRN",
    "Description": "Penalty Reminder Notice"
  },
  {
    "Code": "SELDER",
    "Description": "Selected for deregistration"
  },
  {
    "Code": "DER",
    "Description": "Deregistered"
  },
  {
    "Code": "DERREJ",
    "Description": "Deregistration rejected"
  },
  {
    "Code": "NFD",
    "Description": "Registered and Notice of Final Demand Printed"
  },
  {
    "Code": "NFDP",
    "Description": "Registered and Notice of Final Demand Posted"
  },
  {
    "Code": "NFDPRNFAIL",
    "Description": "Registered and Notice of Final Demand Print Failed"
  },
  {
    "Code": "SANCAPP",
    "Description": "Sanction Applied"
  },
  {
    "Code": "SANCFAIL",
    "Description": "Sanction Failed"
  },
  {
    "Code": "SANCREQ",
    "Description": "Sanction Requested"
  },
  {
    "Code": "SELDEA",
    "Description": "Selected for Debtor Enforcement Assessment"
  },
  {
    "Code": "SELNFD",
    "Description": "Selected for Registered and Notice of Final Demand"
  },
  {
    "Code": "PCNPRNREC",
    "Description": "Printing recalled for PCN"
  },
  {
    "Code": "NTOPRNREC",
    "Description": "Printing recalled for NTO"
  },
  {
    "Code": "ENPRNREC",
    "Description": "Printing recalled for EN"
  },
  {
    "Code": "CCPRNREC",
    "Description": "Printing recalled for CC"
  },
  {
    "Code": "NRPRNREC",
    "Description": "Printing recalled for NR"
  },
  {
    "Code": "WEPRNREC",
    "Description": "Printing recalled for WE"
  },
  {
    "Code": "SOPRNREC",
    "Description": "Printing recalled for SO"
  },
  {
    "Code": "NTDPRNREC",
    "Description": "Notice To Driver Print Recalled"
  },
  {
    "Code": "NTKPRNREC",
    "Description": "Notice To Offender Print Recalled"
  },
  {
    "Code": "NIPPRNREC",
    "Description": "Notice of intention to prosecute print Recalled"
  },
  {
    "Code": "REMPRNREC",
    "Description": "Reminder notice print Recalled"
  },
  {
    "Code": "NPRNREC",
    "Description": "Notice printing Recalled"
  },
  {
    "Code": "ISSPRNREC",
    "Description": "Notice printing Recalled"
  },
  {
    "Code": "WLPRNREC",
    "Description": "Warning letter print Recalled"
  },
  {
    "Code": "PDLPRNREC",
    "Description": "Pre debt letter print Recalled"
  },
  {
    "Code": "NFDPRNREC",
    "Description": "Registered and Notice of Final Demand Print Recalled"
  },
  {
    "Code": "SELINF",
    "Description": "Selected for Infringement Notice"
  },
  {
    "Code": "INF",
    "Description": "Infringement Notice"
  },
  {
    "Code": "INFP",
    "Description": "Infringement Notice Posted"
  },
  {
    "Code": "INFPRNFAIL",
    "Description": "Infringement Notice Fail"
  },
  {
    "Code": "INFPRNREC",
    "Description": "Infringement Notice Print Recall"
  },
  {
    "Code": "WARRNT",
    "Description": "Enforcement Warrant"
  },
  {
    "Code": "NEDEA",
    "Description": "Not Eligible for Debtor Enforcement Assessment"
  },
  {
    "Code": "SELPRN",
    "Description": "Selected for Penalty Reminder Notice"
  },
  {
    "Code": "PRNP",
    "Description": "Penalty Reminder Notice Posted"
  },
  {
    "Code": "PRNPRNFAIL",
    "Description": "Penalty Reminder Notice Print Fail"
  },
  {
    "Code": "PRNPRNREC",
    "Description": "Penalty Reminder Notice Print Recall"
  },
  {
    "Code": "CLOG",
    "Description": "Court Fine Logged"
  },
  {
    "Code": "EAPAREQ",
    "Description": "Payment Arrangement Request Logged"
  },
  {
    "Code": "ENFRACC",
    "Description": "Enforcement Review Accepted"
  },
  {
    "Code": "PWT",
    "Description": "Paid Within Tolerance"
  },
  {
    "Code": "REISSUED",
    "Description": "Infringement Notice Reissued"
  },
  {
    "Code": "REALLOC",
    "Description": "Reallocate payment"
  },
  {
    "Code": "REFREQ",
    "Description": "Refund Requested"
  },
  {
    "Code": "OVERPAID",
    "Description": "Over Paid"
  },
  {
    "Code": "CLOSERA",
    "Description": "Closed Referred to Agency"
  },
  {
    "Code": "SANCSRR",
    "Description": "Sanction Removal Requested"
  }
]