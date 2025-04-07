import VIEWsubmit from "./VIEWsubmit.js";
import { makeLetter } from './genLetter-module.js';
import fetchRetryTimeout from './fetchRetryTimeout.js';

chrome.runtime.onMessage.addListener(
    async function (message, sender, sendResponse) {
        if (sender.url.toUpperCase().includes(`https://${source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorObligations`.toUpperCase()) &&
            !message[1].includes('Bulk') && !message[1].includes('Export') &&
            message[4] === false) {
            const properties = {};
            properties.obligationRows = message[6];
            properties.source = message[5];
            properties.agency = message[7];
            properties.letters = message[8];
            properties.extended = message[9];
            properties.SharePoint = message[10];
            launch(properties);
        }
    }
);

async function launch(properties) {
    try {
        await VIEWsubmit({}, 0, undefined, letterGen(properties), properties);
    } catch (err) {
        if (err !== 'Scraper already running') {
            running = false;
        }
        throw err;
    }
}

function letterGen(properties) {
    if (running === true) {
        throw 'Scraper already running';
    }
    running = true;
    return {
        groupRepeats: {
            "obligationsGroup": () => {
                properties.agencies = [];
                let paramArray = [];
                if (properties.agency || properties.extended) {
                    properties.obligationRows.forEach(data => {
                        const params = {};
                        if (data["Input Type"].includes('1A')) {
                            properties.agencies.push({ key: data["Notice Number"], value: "TRAFFIC CAMERA OFFICE" });
                        } else if (data["Input Type"].includes('1C')) {
                            properties.agencies.push({ key: data["Notice Number"], value: "VICTORIA POLICE TOLL ENFORCEMENT OFFICE" });
                        } else {
                            params["txtNoticeNo"] = data["Notice Number"];
                            paramArray.push(params);
                        }
                    });
                }
                properties.obligationsCountFixed = paramArray.length;
                properties.obligationsCount = paramArray.length;
                return paramArray;
            },
            "getChallenge": () => {
                const paramArray = []
                if (!properties.obligationRows[0]['Notice Status/Previous Status'].includes('CHLGLOG')) {
                    paramArray.push({ "txtNoticeNo": properties.obligationRows[0]["Notice Number"] })
                }
                return paramArray
            }
        },
        submit: [{
            url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorAddresses.aspx`,
            urlParams: (parsedDocument, set, properties) => {
                chrome.storage.local.set({ 'obligationsCount': 10, "obligationsCountFixed": 10 });
                properties.agenciesList = fetchRetryTimeout('https://vicgov.sharepoint.com/:u:/s/msteams_3af44a/ETiKQS5uTzxHnTmAV6Zpl9oBvhNZexZFmJrJxLNZLD6L4A?download=1')
                properties.reviewList = fetchRetryTimeout(`https://${properties.source}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorDecisionReview.aspx`)
                properties.templates = properties.letters.map(letter => {
                    const letterTemplateURL = `https://trimapi.justice.vic.gov.au/record/${letterURL[letter]}/File/document2`
                    const SharePointletterTemplateURL = `https://vicgov-my.sharepoint.com/:w:/g/personal/adrian_zafir_justice_vic_gov_au/${letterURL[letter]}?download=1`
                    return {
                        "kind": letter === 'Agency Enforcement Cancelled' || 
                            letter === 'Agency Fee Removal' ||                             
                            letter === 'FVS Eligible Agency' || 
                            letter === 'Agency FR Granted' || 
                            letter === 'Agency Enforcement Cancelled Updated' ||
                            letter === "Notice of Deregistration"? 'Agency' : 'Debtor',
                        "letter": letter,
                        "template": properties.SharePoint === true ? loadLetter(SharePointletterTemplateURL) : loadLetter(letterTemplateURL)
                    };
                })
            },
            after: (parsedDocument) => {
                properties.DebtorId = parsedDocument.querySelector("#DebtorDetailsCtrl_DebtorIdSearch").value.trim()
                properties.lastName = parsedDocument.querySelector("#DebtorDetailsCtrl_surnameTxt").textContent.trim()
                properties.firstName = parsedDocument.querySelector("#DebtorDetailsCtrl_firstnameTxt").textContent.trim()
                properties.companyName = parsedDocument.querySelector("#DebtorDetailsCtrl_companyNameTxt").textContent.trim()
                properties.Is_Company = true;
                if (properties.companyName === "") properties.Is_Company = false;
                if (properties.companyName === undefined) properties.Is_Company = false;
                let addressTableData = parseTable(parsedDocument.querySelector("#DebtorAddressesCtrl_gridDebtorAddresses_tblData"));
                let addressParts;

                addressTableData = addressTableData.filter(function (row) {
                    return row["Best Address"] === "Y"
                });

                const addressObject = convertArrayToObject(addressTableData, "Type");

                for (let priority of addressPriority) {
                    if (addressObject[priority] !== undefined) {
                        addressParts = addressObject[priority].Address.split(",")
                        addressParts.push(addressObject[priority].Postcode)
                        break;
                    }
                }

                if (addressParts.length > 4) {
                    addressParts[1] = `${addressParts[0]}${addressParts[1]}`;
                    addressParts.shift();
                }
                properties.Address = {
                    "Address_1": addressParts[0].trim(),
                    "Town": addressParts[1].trim(),
                    "State": addressParts[2].trim(),
                    "Post_Code": addressParts[3] ? addressParts[3].trim() : undefined
                }
            }
        }, {
            group: "obligationsGroup",
            urlParams: function (parsedDocument, dynamicParams) {
                this.url = `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/forms/NoticesManagement/SearchNotice.aspx?&NoticeNo=${dynamicParams.txtNoticeNo}`;
                return {}
            },
            after: (parsedDocument) => {
                const progress = ((properties.obligationsCount / properties.obligationsCountFixed) * 10)
                properties.obligationsCount--
                chrome.storage.local.set({ 'obligationsCount': progress, "obligationsCountFixed": 10 });
                properties.agencies.push({ key: parsedDocument.getElementById("NoticeInfo_txtNoticeNo").value, value: parsedDocument.getElementById("NoticeInfo_lblAgencyCode").textContent });
            },
            clearVIEWFormData: true
        }, {
            group: "getChallenge",
            urlParams: function (parsedDocument, dynamicParams) {
                this.url = `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/forms/NoticesManagement/SearchNotice.aspx?&NoticeNo=${dynamicParams.txtNoticeNo}`;
                return {}
            },
            clearVIEWFormData: true
        }, {
            group: "getChallenge",
            url: `https://${properties.source}.view.civicacloud.com.au/Traffic/Notices/Forms/NoticesManagement/NoticeChallengeHistory.aspx`,
            after: (parsedDocument) => {
                properties.challengeType = parsedDocument.querySelector("#lblChallengeCodeVal").textContent.match(/Enforcement - (.*)/) ?
                    parsedDocument.querySelector("#lblChallengeCodeVal").textContent.match(/Enforcement - (.*)/)[1] :
                    'No Challenge Logged'
            },
            clearVIEWFormData: true
        }
        ],
        afterAction: async (parsedDocument, properties) => {

            let reduced = properties.agencies.reduce((obj, item) => (obj[item.key] = item.value, obj), {});

            if (properties.templates[1]) {
                [properties.agenciesList, properties.reviewList, properties.templates[0].template, properties.templates[1].template] = await Promise.all([
                    properties.agenciesList.then(response => { return response.json() }),
                    properties.reviewList.then(response => { return response.text() }),
                    properties.templates[0].template,
                    properties.templates[1].template
                ]).catch((error) => {
                    console.log(error)
                    running = false;
                });
            } else {
                [properties.agenciesList, properties.reviewList, properties.templates[0].template] = await Promise.all([
                    properties.agenciesList.then(response => { return response.json() }),
                    properties.reviewList.then(response => { return response.text() }),
                    properties.templates[0].template
                ]).catch((error) => {
                    console.log(error)
                    running = false;
                });
            }

            properties.obligationRows = properties.obligationRows.map(row => {
                const infData = {
                    Obligation: row['Notice Number'],
                    Balance_Outstanding: row['Balance Outstanding'],
                    Infringement: row['Infringement No.'],
                    Offence: row['Offence'],
                    OffenceDate: row['Offence Date'],
                    IssueDate: row['Issued'],
                    altname: reduced[row['Notice Number']],
                    NoticeStatus: row['Notice Status/Previous Status'],
                    ProgressionDate: row['Due Date']
                };

                const dateParts = infData.ProgressionDate.split("/");
                infData.NFDlapsed = 
                    infData.NoticeStatus === 'SELDEA' || infData.NoticeStatus === 'WARRNT' ||
                    (new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]).getTime() < new Date().getTime() && infData.NoticeStatus === 'NFDP')
                return infData;
            });

            const parser = new DOMParser()
            const reviewDoc = parser.parseFromString(properties.reviewList, 'text/html');
            let reviewTableData = parseTable(reviewDoc.querySelector("#DebtorDecisionCtrl_DebtorNoticesTable_tblData"));

            reviewTableData.forEach(reviewdata => {
                let ob = properties.obligationRows.find(data => (reviewdata['Notice Number'] == data['Obligation']))
                if (ob !== undefined) ob.Challenge = challengeList[reviewdata['Challenge Code']]
            })

            const letterData = {
                "First_Name": toTitleCaseHypen(toTitleCase(properties.firstName)).trim().split(" ")[0],
                "Last_Name": toTitleCaseHypen(toTitleCase(properties.lastName)).trim(),
                "Company_Name": properties.Is_Company ? toTitleCase(properties.companyName).trim() : undefined,
                "Is_Company": properties.Is_Company,
                "Address_1": toTitleCase(properties.Address.Address_1).trim(),
                "Town": properties.Address.Town,
                "Town2": toTitleCase(properties.Address.Town),
                "State": properties.Address.State,
                "Post_Code": properties.Address.Post_Code,
                "Debtor_ID": properties.DebtorId,
                "Challenge": properties.obligationRows[0].Challenge || properties.challengeType,
                "UserID": await getData('userName')
            }

            letterData.OnlyNFDLapsed = !properties.obligationRows.some(row => row.NFDlapsed === false);

            await getAppData(letterData);

            var replacements = [
                [/ Gr$/i, " Grove"],
                [/ St$/i, " Street"],
                [/ Dr$/i, " Drive"],
                [/ Ct$/i, " Court"],
                [/ Rd$/i, " Road"],
                [/ Ave?$/i, " Avenue"],
                [/ Cre?s?$/i, " Crescent"],
                [/ Pl$/i, " Place"],
                [/ Tce$/i, " Terrace"],
                [/ Bvd$/i, " Boulevard"],
                [/ Cl$/i, " Close"],
                [/ Cir$/i, " Circle"],
                [/ Pde$/i, " Parade"],
                [/ Cct$/i, " Circuit"],
                [/ Wy$/i, " Way"],
                [/ Esp$/i, " Esplanade"],
                [/ Sq$/i, " Square"],
                [/ Hwy$/i, " Highway"],
                [/^Po /i, "PO "]
            ], r;

            while ((r = replacements.shift()) && (letterData.Address_1 = String.prototype.replace.apply(letterData.Address_1, r)))

            properties.letterData = []

            if (properties.agency) {
                properties.letterData = groupBy(properties.obligationRows, 'altname');
                properties.letterData = mergeById(properties.letterData, properties.agenciesList.addresses, "altname", "altname");
                properties.letterData = properties.letterData.map(item => ({ ...item, ...letterData, kind: "Agency" }));
            }
            if(properties.letters[0] !== "Notice of Deregistration") {
                properties.letterData.push({ ...letterData, a: properties.obligationRows, kind: "Debtor" })
            }

            chrome.storage.local.set({ 'obligationsCount': 0, "obligationsCountFixed": 10 });

            properties.letterData.forEach(data => {
                const letterType = letterTypes(data.a, data.enforcename, data.Is_Company ? data.Company_Name : data.First_Name.charAt(0) + " " + data.Last_Name, data.UserID);
                const templateMeta = properties.templates.find(template => template.kind === data.kind)
                data.selectedObValue = '$' + formatMoney(data.a.reduce((t,o)=>t+Number(o.Balance_Outstanding.replace(/[^0-9\.-]+/g,"")),0))
                if (letterType[templateMeta.letter].Props) {
                    letterType[templateMeta.letter].Props.forEach(prop => {
                        data[prop] = true;
                        if (prop === "todayplus14") {
                            data[prop] = getDates().todayplus14;
                        }
                        if (prop === "todayplus28") {
                            data[prop] = getDates().todayplus28;
                        }
                        if (prop === "todayplus21") {
                            data[prop] = getDates().todayplus21;
                        }
                    })
                }
                running = false;
                makeLetter(data, templateMeta.template, letterType[templateMeta.letter].filename)
                if (data.MOU === true && 
                    !properties.letters.some(type => type === 'Agency Fee Removal' || type === "Notice of Deregistration" ) )
                    {
                    emailMaker(data, [data.AgencyEmail, 'MOU', properties.templates.find(template => template.kind === 'Agency').letter]);
                }
            })
        }
    }
}

function getAppData(data) {
    return new Promise(function (resolve, reject) {
        chrome.storage.local.get(['value'], function (items) {
            const applicationData = items.value;
            for (let application in applicationData) {
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
            return resolve(items.value);
        })
    })
}

function loadLetter(url) {
    return new Promise((resolve, reject) => {
        JSZipUtils.getBinaryContent(url, function (err, data) {
            if (err) {
                running = false;
                throw err; // or handle err
            }
            data = resolve(data);
            return data;
        });
    });
}

const addressPriority = ["Postal Address", "Residential Address", "Unknown Address"];

const challengeList = {
    "E_EXCIRCUM": "Exceptional circumstances",
    "E_PERUNAWR": "Person unaware",
    "E_SPCIRCUM": "Special circumstances",
    "E_CONTRLAW": "Contrary to the law",
    "E_MISTAKID": "Mistake of identity"
}

const letterURL = {
    'Agency Enforcement Cancelled': "21860542",
    'Agency Fee Removal': "12918361",
    'Enforcement Confirmed': "21908189",
    'Enforcement Cancelled': "21864380",
    "ER Confirm/ FW Grant": "21922728",
    'Report Needed': "12918375",
    'Wrong person applying. No grounds': "12918368",
    'Paid in full. Ineligible': "12918367",
    'Outside Person Unaware. Ineligible': "12918370",
    'Offence n/e Person Unaware. No grounds': "12918370",
    'Unable to Contact Applicant': "12918377",
    'Claim of payment adv contact agency': "14513448",
    'Notice of Deregistration': "14688539",
    'Further Information Required': "15102090",
    'FVS Eligible Debtor':"15104893",
    'FVS Eligible Agency':"15104895",
    'FVS Ineligible':"15111337",
    'FVS Further Information Required':"15111404",
    'PSL':"15119430",
    'Suspension of driver licence':"15531068",
    "Suspension of vehicle registration - Ind": "17470564",
    "Suspension of vehicle registration - Corp": "17470563",
    'Court Fine Fee Waive Granted': "EXKiK2Ln98ZFq1RNxyVlAuIB9XFcwmEu0u-wn-u9xLRaeg",
    "Special Circumstances No grounds": "18754905",
    "POI - direction to produce":"21266650",
    "PA Refused - Active 7DN":"21379969",
    "No Grounds":"21781572",
    "PA Refused": "21780824",
    "EOT Refused": "21781515",
    "PA Refused-Sanction": "21538164",
    "PA App Incomplete": "21543595",
    "Company PA Ineligible SZWIP": "21543668",
    "EOT Refused - Infringements stage": "21547909",
    "PA Refused Expired 7DN": "21554295",
    "Fee Removal PIF": "21569882",
    "CF Fee Removal Granted": "21588427",
    "CF Fee Removal Refused": "21623835",
    'Fee Removal Refused': "21625790",
    'FR Refused - Active 7DN': "21630687",
    'FW Refused - Sanction': "21642104",
    "FR Granted": "21602358",
    "Agency FR Granted": "21609844",
    "FR Granted - Active 7DN": "21575815",
    "FR Granted - Sanction": "21582960",
    "Ineligible for ER - offence type": "21720126",
    "Court not an option": "21746214",
    "ER Ineligible Deregistered Company": "21758558",
    "Ineligible Paid in full": "21761625",
    "Appeal not available": "21761877",
    "Nomination Not Grounds": "21767490",
    "ER Ineligible Court Fine": "21771157",
    "Spec Circ Options": "21774656",
    "ER Additional Info": "21738969",
    "Ineligible for ER enforcement action": "21745145",
    "Ineligible PU - Outside Time": "21787906",
    "Ineligible for ER previous review": "21790863",
    "ER Ineligible PU": "21794412",
    "Claim of payment to agency": "21797592",
    "Request for photo evidence": "21811532",
    "Ineligible Incorrect company applying": "21815023",
    "Spec Circ No Grounds": "21825433",
    "Spec Circ Report Required": "21827269",
    "Unauthorised 3rd party applying": "21834939",
    "Ineligible Incorrect person applying": "21846719",
    "Spec Circ App Required": "21976745",
    "Spec Circ Report Insufficient": "21979090",
    "SC 3P Lawyer - Report Insufficient": "21977719",
    "ER Application Incomplete": "21982730",
    "SC 3P Lawyer - Report Required": "21991100",
    "ER Confirm/FW Grant - Active 7DN": "21993681",
    "ER Confirm/FW Grant - 7DN Expired option": "21993728"

}

function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
  }

function formatDate(date = new Date()) {
    return [
      date.getFullYear(),
      padTo2Digits(date.getMonth() + 1),
      padTo2Digits(date.getDate()),
    ].join('');
  }

function letterTypes(obligationRows, enforcename, name, UserID) {
    const o = obligationRows;
    const OBL = o.length === 1 ? " OBL " + o[0]["Obligation"] : " x " + o.length;
    const ReviewType = o[0].Challenge === "Special circumstances" ? "ER Special" : o[0].Challenge !== undefined ? "ER General" : undefined;

    return {
        'Agency Enforcement Cancelled': { "filename": enforcename + " - Cancelled" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 11/22/2022
        'Agency Fee Removal': { "filename": enforcename + " - Fee Removal - Granted" + OBL + " " + name + " - " + UserID + " - " + formatDate() },  //Updated 11/22/2022
        'Enforcement Confirmed': { "filename": ReviewType + " - Confirmed" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 11/27/2024
        'Enforcement Cancelled': { "filename": ReviewType + " - Cancelled" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 11/22/2022
        'ER Confirm/ FW Grant': { "filename": ReviewType + " - Confirmed With Fee Removal - Granted" + OBL + " " + name + " - " + UserID + " - " + formatDate(), Props: ["ECCV"] }, //Updated 20/11/2024
        'Report Needed': { "filename": "Report Needed" + OBL + " " + name + " - " + UserID + " - " + formatDate(), Props: ["todayplus14"] },//Updated 11/22/2022
        'Further Information Required': { "filename": "Further Information Required" + OBL + " " + name + " - " + UserID + " - " + formatDate(), Props: ["todayplus14"] },//Updated 11/22/2022
        'Wrong person applying. No grounds': { "filename": "No Grounds" + OBL + " " + name + " - " + UserID + " - " + formatDate() },//Updated 11/22/2022
        'Paid in full. Ineligible': { "filename": "Paid In Full" + OBL + " " + name + " - " + UserID + " - " + formatDate() },//Updated 11/22/2022
        'Outside Person Unaware. Ineligible': { "filename": "Outside Person Unware" + OBL + " " + name + " - " + UserID + " - " + formatDate(), Props: ["Person_unaware_1"] },//Updated 11/22/2022
        'Offence n/e Person Unaware. No grounds': { "filename": "No Grounds Person Unware" + OBL + " " + name + " - " + UserID + " - " + formatDate(), Props: ["Person_unaware_2"] },//Updated 11/22/2022
        'Unable to Contact Applicant': { "filename": "Unable To Contact Applicant" + OBL + " " + name + " - " + UserID + " - " + formatDate() },//Updated 11/22/2022
        'Special Circumstances No grounds': { "filename": "No Grounds" + OBL + " " + name + " - " + UserID + " - " + formatDate() },//Updated 11/22/2022
        'Claim of payment adv contact agency': { "filename": "Cont Agency" + OBL + " " + name + " - " + UserID + " - " + formatDate() },//Updated 11/22/2022
        'Notice of Deregistration': { "filename": "Notice Of Deregistration" + OBL + " " + name + " - " + UserID + " - " + formatDate() },//Updated 11/22/2022
        'FVS Eligible Debtor': { "filename": name + " - " + "FVS Eligible" + OBL, Props: ["todayplus28"] },
        'FVS Eligible Agency': { "filename": name + " - " + enforcename + " - FVS Eligible" + OBL },
        'FVS Ineligible': { "filename": name + " - " + enforcename + " - FVS Ineligible" + OBL },
        'FVS Further Information Required': { "filename": name + " - " + enforcename + " - FVS Further Information Required" + OBL, Props: ["todayplus21"] },
        'Suspension of driver licence': { "filename": name + " - Suspension of driver licence" + OBL},
        "Suspension of vehicle registration - Ind": { "filename": name + " - Suspension of vehicle registration" + OBL},
        "Suspension of vehicle registration - Corp": { "filename": name + " - Suspension of vehicle registration" + OBL},    
        'PSL': { "filename": name + " - PSL" + OBL },
        'Court Fine Fee Waive Granted': { "filename": "Court Fine - Fee Removal - Granted" + OBL + " " + name + " - " + UserID + " - " + formatDate() },//Updated 11/22/2022,
        'POI - direction to produce': { "filename": name + " - POI - direction to produce" + OBL, Props: ["todayplus28"] },//Added 20/05/2024
        'PA Refused - Active 7DN': { "filename": name + " - PA Refused - Active 7DN" + OBL, Props: ["todayplus28"] },//Added 14/06/2024
        'No Grounds': { "filename": "No Grounds" + OBL + " " + name + " - " + UserID + " - " + formatDate(), Props: ["No_Grounds"] },//Updated 19/06/2024
        'PA Refused': { "filename": "PA Refused" + OBL + " " + name + " - " + UserID + " - " + formatDate() },//Added 09/10/2024
        'EOT Refused': { "filename": "EOT Refused" + OBL + " " + name + " - " + UserID + " - " + formatDate() },//Added 09/10/2024
        'PA Refused-Sanction': { "filename": "PA Refused-Sanction" + OBL + " " + name + " - " + UserID + " - " + formatDate() },//Added 25/07/2024
        'PA App Incomplete': { "filename": "PA App Incomplete" + OBL + " " + name + " - " + UserID + " - " + formatDate() },//Added 26/07/2024
        'Company PA Ineligible SZWIP': { "filename": "Company PA Ineligible SZWIP" + OBL + " " + name + " - " + UserID + " - " + formatDate() },//Added 26/07/2024
        'EOT Refused - Infringements stage': { "filename": "EOT Refused - Infringements stage" + OBL + " " + name + " - " + UserID + " - " + formatDate() },//Added 29/07/2024
        'PA Refused Expired 7DN': { "filename": "PA Refused Expired 7DN" + OBL + " " + name + " - " + UserID + " - " + formatDate() },//Added 30/07/2024
        'Fee Removal PIF': { "filename": "Fee Removal PIF" + OBL + " " + name + " - " + UserID + " - " + formatDate() },//Added 30/07/2024
        'CF Fee Removal Granted': { "filename": "CF Fee Removal Granted" + OBL + " " + name + " - " + UserID + " - " + formatDate() },//Added 08/08/2024
        'CF Fee Removal Refused': { "filename": "CF Fee Removal Refused" + OBL + " " + name + " - " + UserID + " - " + formatDate() },//Added 20/08/2024
        'Fee Removal Refused': { "filename": "Fee Removal Refused" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 11/22/2022
        'FR Refused - Active 7DN': { "filename": "FR Refused - Active 7DN" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 21/22/2024
        'FW Refused - Sanction': { "filename": "FW Refused - Sanction" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 23/22/2024
        'FR Granted': { "filename": "FR Granted" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 03/09/2024
        'Agency FR Granted': { "filename": enforcename + " - Agency FR Granted" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 03/09/2024
        'FR Granted - Active 7DN': { "filename": enforcename + " - FR Granted - Active 7DN" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 11/09/2024
        'FR Granted - Sanction': { "filename": "FR Granted - Sanction" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 12/11/2024
        'Ineligible for ER - offence type': { "filename": "Ineligible for ER - offence type" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 24/09/2024
        'Court not an option': { "filename": "Court not an option" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 01/10/2024
        'ER Ineligible Deregistered Company': { "filename": "ER Ineligible Deregistered Company" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 01/10/2024
        'Ineligible Paid in full': { "filename": "Ineligible Paid in full" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 03/10/2024
        'Appeal not available': { "filename": "Appeal not available" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 03/10/2024
        'Nomination Not Grounds': { "filename": "Nomination Not Grounds" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 09/10/2024
        'ER Ineligible Court Fine': { "filename": "ER Ineligible Court Fine" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 09/10/2024
        'Spec Circ Options': { "filename": "Spec Circ Options" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 09/10/2024
        'ER Additional Info': { "filename": "ER Additional Info" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 09/10/2024
        'Ineligible for ER enforcement action': { "filename": "Ineligible for ER enforcement action" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 09/10/2024
        'Ineligible PU - Outside Time': { "filename": "Ineligible PU - Outside Time" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 09/10/2024
        'Ineligible for ER previous review': { "filename": "Ineligible for ER previous review" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 09/10/2024
        'ER Ineligible PU': { "filename": "ER Ineligible PU" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 11/10/2024
        'Claim of payment to agency': { "filename": "Claim of payment to agency" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 12/10/2024
        'Request for photo evidence': { "filename": "Request for photo evidence" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 15/10/2024
        'Ineligible Incorrect company applying': { "filename": "Ineligible Incorrect company applying" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 16/10/2024
        'Spec Circ No Grounds': { "filename": "Spec Circ No Grounds" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 18/10/2024
        'Spec Circ Report Required': { "filename": "Spec Circ Report Required" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 21/10/2024
        'Unauthorised 3rd party applying': { "filename": "Unauthorised 3rd party applying" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 23/10/2024
        'Ineligible Incorrect person applying': { "filename": "Ineligible Incorrect person applying" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 25/10/2024
        'Spec Circ App Required': { "filename": "Spec Circ App Required" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 06/12/2024
        'Spec Circ Report Insufficient': { "filename": "Spec Circ Report Insufficient" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 06/12/2024
        'SC 3P Lawyer - Report Insufficient': { "filename": "SC 3P Lawyer - Report Insufficient" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 06/12/2024
        'ER Application Incomplete': { "filename": "ER Application Incomplete" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 09/12/2024
        'SC 3P Lawyer - Report Required': { "filename": "SC 3P Lawyer - Report Required" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 10/12/2024
        'ER Confirm/FW Grant - Active 7DN': { "filename": "ER Confirm/FW Grant - Active 7DN" + OBL + " " + name + " - " + UserID + " - " + formatDate() }, //Updated 11/12/2024
        'ER Confirm/FW Grant - 7DN Expired option': { "filename": "ER Confirm/FW Grant - 7DN Expired option" + OBL + " " + name + " - " + UserID + " - " + formatDate() } //Updated 11/12/2024

      }
}

const mergeById = (a1, a2, property, property2) =>
    a1.map(itm => ({
        ...a2.find((item) => (item[property2] === itm[property]) && item),
        ...itm
    }));

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

function getData(sKey) {
    return new Promise(function(resolve, reject) {
      chrome.storage.local.get(sKey, function(items) {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          reject(chrome.runtime.lastError.message);
        } else {
          resolve(items[sKey]);
        }
      });
    });
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
    return function mapRowToObject({ cells }) {
        return [...cells].reduce(function (result, cell, i) {
            const input = cell.querySelector("input,select");
            var value;

            if (input) {
                value = input.type === "checkbox" ? input.checked : input.value;
            } else {
                value = cell.innerText;
            }

            return Object.assign(result, { [headings[i]]: value });
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
    var headings = [...table.tHead.rows[0].cells].map(
        heading => heading.innerText.replace(" ▲ 1", "").replace(" ▼ 1", "").replace(" ▼ 2", "").replace(" ▲ 2", "")
    );
    return [...table.tBodies[0].rows].map(mapRow(headings));
}

const convertArrayToObject = (array, key) => {
    const initialValue = {};
    return array.reduce((obj, item) => {
        return {
            ...obj,
            [item[key]]: item,
        };
    }, initialValue);
};

function groupBy(arr, property) {
    return arr.reduce(function (memo, x) {
        console.log()
        if (!memo.some(item => item[property] === x[property])) { memo.push({ [property]: x[property], a: [] }) }
        memo.map(itm => itm[property] === x[property] && itm.a.push(x))
        return memo;
    }, []);
}

function formatMoney(amount, decimalCount = 2, decimal = ".", thousands = ",") {
    try {
      decimalCount = Math.abs(decimalCount);
      decimalCount = isNaN(decimalCount) ? 2 : decimalCount;
  
      const negativeSign = amount < 0 ? "-" : "";
  
      let i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
      let j = (i.length > 3) ? i.length % 3 : 0;
  
      return negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands) + (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : "");
    } catch (e) {
      console.log(e)
    }
  };