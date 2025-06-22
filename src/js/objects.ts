import { ScraperPageConfig } from "./types";

/**
 * Utility function that takes a HTML element and a selector, checks if the found element is a valid HTML element and returns the inner text of the element if it is valid, or throws an error if it is not.
 * If the selector includes contains(texttofind) it will use [...document.querySelectorAll("*")].filter(e => e.childNodes && [...e.childNodes].find(n => n.nodeValue?.match(texttofind))) on the HTML element that was found by querySelector.
 * @param {HTMLElement} htmlElement - The HTML element to search within.
 * @param {string} selector - The CSS selector to find the element.
 * @returns {string} - The inner text of the found HTML element, trimmed of whitespace.
 */
export function getTextFromSelector(htmlElement: HTMLElement, selector: string): string {
    if (selector.includes("contains(")) {
        const element = htmlElement.querySelector(selector.split("contains(")[0]);
        const textToFind = selector.match(/contains\(([^)]+)\)/)?.[1];
        if (textToFind && element instanceof HTMLElement) {
            const foundElements = [...element.querySelectorAll("*")].filter(e => e.childNodes && [...e.childNodes].find(n => n.nodeValue?.match(textToFind)));
            if (foundElements.length > 0 && foundElements[0] instanceof HTMLElement) {
                return foundElements[0].innerText.trim();
            } else {
                throw new Error(`No elements found containing text: ${textToFind}`);
            }
        }
    }
    const element = htmlElement.querySelector(selector);
    if (element instanceof HTMLElement) {
        return element.innerText.trim();
    } else {
        throw new Error(`Element not found or is not a valid HTML element for selector: ${selector}`);
    }
}

/**
 * Utility function that takes a string and a regex pattern with a capture group and returns the result of the first capture group if it exists. If the regex does not find anything or the capture group does not exist, it throws an error
 */
export function getRegexCaptureGroup(htmlText: string, regexPattern: RegExp): string {
    const match = htmlText.match(regexPattern);
    if (match && match[1]) {
        return match[1].trim();
    } else {
        throw new Error(`No match found for regex pattern: ${regexPattern}`);
    }
}

export const config: ScraperPageConfig[] = [
    //Pages to scrape and instructions. 
    {
        "url": "https://djr.view.civicacloud.com.au/Traffic/Notices/Forms/NoticesManagement/noticeKeeper.aspx",
        "description": 'Get PRN address',
        "name": 'noticeKeeper',
        "targetTags": [
            { field: "Obligation", tag: '#NoticeInfo_lblNoticeEd', method: 'text' },
            { field: "Infringement", tag: '#NoticeInfo_lblInfringementNo', method: 'text' },
            { field: "Agency", tag: '#NoticeInfo_lblAgencyCode', method: 'text' },
            { field: "Offence_Description", tag: '#NoticeInfo_lblContCode', method: 'title' },
            { field: "Balance_Outstanding", tag: '#NoticeInfo_lblBalanceOst', method: 'text' },
            { field: "Status", tag: '#NoticeInfo_lblCurrentStage', method: 'text' },
            { field: "Date_of_Offence", tag: '#NoticeInfo_lblIssueDt', method: 'text' },
            { field: "Date of Issue", tag: '#NoticeInfo_lblInfringementIssueDateBoxInfo', method: 'text' },
            { field: "Input Source", tag: '#NoticeInfo_lblProgressionPathText', method: 'text' },
            { field: "PRN Issue Date", tag: '#NoticeInfo_lblPrnIssueDateBoxInfo', method: 'text' },
            { field: "NFD Issue Date", tag: '#NoticeInfo_lblNfdIssueDateBoxInfo', method: 'text' },
            { field: "VRM Number", tag: '#NoticeInfo_lblVrmNo', method: 'text' },
            { field: "Driver License State", tag: '#lblDriverLicenceState', method: 'text' },
            { field: "Driver License No.", tag: '#lblDriverLicenceNo', method: 'text' },
            { field: "Agency", tag: '#NoticeInfo_lblAgencyCode', method: 'text' },
            {
                field: "PRN Address", method: 'callback',
                "callback": function (htmlText) {
                    const lblSreetDescriptor = getTextFromSelector(htmlText, '#lblPrnAddress')
                    const lblTown = getTextFromSelector(htmlText, '#lblPrnTown');
                    const lblAdminArea = getTextFromSelector(htmlText, '#lblPrnAdminArea');
                    const lblPostCode = getTextFromSelector(htmlText, '#lblPrnPostCode');
                    return lblSreetDescriptor !== undefined ? lblSreetDescriptor + ", " + lblTown + " " + lblAdminArea + " " + lblPostCode : "";
                }
            },
            { field: "Offence Location", tag: '#NoticeInfo_lblLocdesc', method: 'text' },
            { field: "Offence Time", tag: '#NoticeInfo_lblIssueTm', method: 'text' },
            {
                field: "Hold", method: 'callback',
                "callback": function (htmlText, getTextFromSelector) {
                    const holdReason = getTextFromSelector(htmlText, 'li:contains(Hold reason)');
                    const Y = "Hold reason :";
                    return holdReason.slice(holdReason.indexOf(Y) + Y.length);
                }
            }
        ],
        "otherData": [
            { "MOU": true }
        ],
        "active": true,
    },

    {
        "url": "https://djr.view.civicacloud.com.au/Traffic/Notices/Forms/NoticesManagement/NoticePaymentHistory.aspx",
        "description": 'Get payment history',
        "name": 'paymentHistory',
        "targetTags": [

        ],
        "otherData": [],
        "active": false,
    },

    {
        "url": "https://djr.view.civicacloud.com.au/Traffic/Notices/Forms/NoticesManagement/NoticeChallengeHistory.aspx",
        "description": 'Get challenge history',
        "name": 'Challenges',
        "targetTags": [
            { field: "Challenge Date", tag: '#lblChallengeDateVal', method: 'text' },
            {
                field: "Challenge", method: 'callback',
                "callback": function (htmlText, getTextFromSelector) {
                    const lblChallengeCodeVal = getTextFromSelector(htmlText, '#lblChallengeCodeVal');
                    const challengeCode = getRegexCaptureGroup(lblChallengeCodeVal, /Enforcement - (.*)/);
                    return challengeCode;
                }
            }
        ],
        "otherData": [],
        "active": true,
    },

    {
        "url": "https://djr.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorDetails.aspx",
        "description": 'Get best address',
        "name": 'debtorAddress',
        "targetTags": [
            { field: "Company_Name", tag: '#DebtorDetailsCtrl_companyNameTxt', method: 'text' },
            { field: "Address_1", tag: '#DebtorAddressCtrl_streetTxt', method: 'text' },
            { field: "Town", tag: '#DebtorAddressCtrl_cityTxt', method: 'text' },
            { field: "Post_Code", tag: '#DebtorAddressCtrl_postcodeTxt', method: 'text' },
            { field: "State", tag: '#DebtorAddressCtrl_stateTxt', method: 'text' },
            { field: "First_Name", tag: '#DebtorDetailsCtrl_firstnameTxt', method: 'text' },
            { field: "Last_Name", tag: '#DebtorDetailsCtrl_surnameTxt', method: 'text' },
            { field: "Debtor_ID", tag: '*[name="DebtorDetailsCtrl$DebtorIdSearch"]', method: 'value' },
            { field: "Is_Company", tag: '#DebtorDetailsCtrl_companyNameTxt', method: 'text' },
            { field: "totalAmountOutstanding", tag: '#DebtorDetailsCtrl_totalAmountOutstandingTxt', method: 'text' },
            { field: "openObligations", tag: '#DebtorDetailsCtrl_totalAmountOutstandingTxt', method: 'text' }
        ],
        "otherData": [],
        "active": false,
    },
    {
        "url": "https://djr.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorFurtherDetails.aspx",
        "description": 'Get best address',
        "name": 'debtorFurtherDetails',
        "targetTags": [
            { field: "Date_of_Birth", tag: '#DebtorIndividualCtrl_dateOfBirthTxt', method: 'text' },
        ],
        "otherData": [],
        "active": true,
    },
    {
        "url": "https://djr.view.civicacloud.com.au/Traffic/Notices/Forms/NoticesManagement/NoticeAudit.aspx",
        "description": 'Parse notice audit',
        "type": 'table',
        "name": 'noticeAudit',
        "targetTags": [],
        "otherData": [],
        "active": false,
    },
    {
        "url": "https://djr.view.civicacloud.com.au/Traffic/Notices/Forms/NoticesManagement/NoticeAudit.aspx",
        "description": 'Get summary, including fees',
        "name": 'noticeSummary',
        "targetTags": [
            { field: "Reduced_Charge", tag: '#lblReducedCharge', method: 'text' },
            { field: "Penalty_Reminder_Fee", tag: '#lblPenaltyReminderFee', method: 'text' },
            { field: "Registration_Fee", tag: '#lblRegistrationFee', method: 'text' },
            { field: "Enforcement_Fee", tag: '#lblEnforcementFee', method: 'text' },
            { field: "Warrant_Issue_Fee", tag: '#lblWarrantIssueFee', method: 'text' },
            { field: "Amount_Waived", tag: '#lblWaiveAmt', method: 'text' },
            { field: "Amount_Paid", tag: '#lblPayments', method: 'text' },
            { field: "Court_Costs", tag: '#lbl2BCRTCs', method: 'text' },
            { field: "Court_Fine", tag: '#lbl2BCRTs', method: 'text' },
        ],
        "otherData": [],
        "controlID": "btnSummary",
        "active": true,
    }
]



///Object Generator Functions///////////////////////////////////////////////////////////////////////
export function PageObject(this: ScraperPageConfig, configObject: ScraperPageConfig): ScraperPageConfig {
    //Constructor for a page object. Each page becomes a seperate object.
    this.url = configObject.url;
    this.targetTags = configObject.targetTags;
    this.description = configObject.description;
    this.name = configObject.name;
    this.otherData = configObject.otherData;
    this.active = configObject.active;
    this.extract = configObject.extract;
    this.setActive = function () {
        this.active = !this.active
    }
        ;
    return this
}