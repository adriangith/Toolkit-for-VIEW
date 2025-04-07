let config = [
    //Pages to scrape and instructions. 
     {
        "url": "https://djr.view.civicacloud.com.au/Traffic/Notices/Forms/NoticesManagement/noticeKeeper.aspx",
        "description": 'Get PRN address',
        "name": 'noticeKeeper',
        "targetTags": [
        	{field: "Obligation", tag: '#NoticeInfo_lblNoticeEd', method: 'text'},
			{field: "Infringement", tag: '#NoticeInfo_lblInfringementNo', method: 'text'},
            {field: "Agency", tag: '#NoticeInfo_lblAgencyCode', method: 'text'},
            {field: "Offence_Description", tag: '#NoticeInfo_lblContCode', method: 'title'},
        	{field: "Balance_Outstanding", tag: '#NoticeInfo_lblBalanceOst', method: 'text'},
            {field: "Status", tag: '#NoticeInfo_lblCurrentStage', method: 'text'},
            {field: "Date_of_Offence", tag: '#NoticeInfo_lblIssueDt', method: 'text'},
        	{field: "Date of Issue", tag: '#NoticeInfo_lblInfringementIssueDateBoxInfo', method: 'text'},
			{field: "Input Source", tag: '#NoticeInfo_lblProgressionPathText', method: 'text'},
        	{field: "PRN Issue Date", tag: '#NoticeInfo_lblPrnIssueDateBoxInfo', method: 'text'},
        	{field: "NFD Issue Date", tag: '#NoticeInfo_lblNfdIssueDateBoxInfo', method: 'text'},
        	{field: "VRM Number", tag: '#NoticeInfo_lblVrmNo', method: 'text'},
			{field: "Driver License State", tag: '#lblDriverLicenceState', method: 'text'},
			{field: "Driver License No.", tag: '#lblDriverLicenceNo', method: 'text'},
        	{field: "Agency", tag: '#NoticeInfo_lblAgencyCode', method: 'text'},
        	{field: "PRN Address", method: 'callback', 
        		"callback": function(htmlText) {
        			let body = htmlText.find('#lblSreetDescriptor').text() !== undefined ? htmlText.find('#lblSreetDescriptor').text() + ", " +  htmlText.find('#lblTown').text() +" " +  htmlText.find('#lblAdminArea').text() + " " +   htmlText.find('#lblPostCode').text() : "";
        			return body;
				}
			},
			{field: "Offence Location", tag: '#NoticeInfo_lblLocdesc', method: 'text'},
            {field: "Offence Time", tag: '#NoticeInfo_lblIssueTm', method: 'text'},
            {field: "Hold", method: 'callback', 
        		"callback": function(htmlText) {
                    let body = "";
                    if (htmlText.find('li:contains(Hold reason)')[0] !== undefined) {
                        let X = htmlText.find('li:contains(Hold reason)')[0].textContent;
                        let Y = "Hold reason :";
                        body = X.slice(X.indexOf(Y) + Y.length);
                    } 
                    return body;
				}
			}
        ],
        "otherData": [
        	{"MOU": true}
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
        	{field: "Challenge Date", tag: '#lblChallengeDateVal', method: 'text'},
			{field: "Challenge", method: 'callback', 
        		"callback": function(htmlText) {
					let body = htmlText.find('#lblChallengeCodeVal').text().match(/Enforcement - (.*)/) !== null ? htmlText.find('#lblChallengeCodeVal').text().match(/Enforcement - (.*)/)[1] : ""; 
					return body;
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
        	{field: "Company_Name", tag: '#DebtorDetailsCtrl_companyNameTxt', method: 'text'},
        	{field: "Address_1", tag: '#DebtorAddressCtrl_streetTxt', method: 'text'},
        	{field: "Town", tag: '#DebtorAddressCtrl_cityTxt', method: 'text'},
        	{field: "Post_Code", tag: '#DebtorAddressCtrl_postcodeTxt', method: 'text'},
        	{field: "State", tag: '#DebtorAddressCtrl_stateTxt', method: 'text'},
        	{field: "First_Name", tag: '#DebtorDetailsCtrl_firstnameTxt', method: 'text'},
        	{field: "Last_Name", tag: '#DebtorDetailsCtrl_surnameTxt', method: 'text'},
        	{field: "Debtor_ID", tag: '*[name="DebtorDetailsCtrl\$DebtorIdSearch"]', method: 'value'},
            {field: "Is_Company", tag: '#DebtorDetailsCtrl_companyNameTxt', method: 'text'},
            {field: "totalAmountOutstanding", tag: '#DebtorDetailsCtrl_totalAmountOutstandingTxt', method: 'text'},
            {field: "openObligations", tag: '#DebtorDetailsCtrl_totalAmountOutstandingTxt', method: 'text'}
        ],
        "otherData": [],
        "active": false,
    },
	{
        "url": "https://djr.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorFurtherDetails.aspx",
        "description": 'Get best address',
        "name": 'debtorFurtherDetails',
        "targetTags": [
        	{field: "Date_of_Birth", tag: '#DebtorIndividualCtrl_dateOfBirthTxt', method: 'text'},
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
            {field: "Reduced_Charge", tag: '#lblReducedCharge', method: 'text'},
            {field: "Penalty_Reminder_Fee", tag: '#lblPenaltyReminderFee', method: 'text'},
            {field: "Registration_Fee", tag: '#lblRegistrationFee', method: 'text'},
            {field: "Enforcement_Fee", tag: '#lblEnforcementFee', method: 'text'},
            {field: "Warrant_Issue_Fee", tag: '#lblWarrantIssueFee', method: 'text'},
            {field: "Amount_Waived", tag: '#lblWaiveAmt', method: 'text'},
            {field: "Amount_Paid", tag: '#lblPayments', method: 'text'},
            {field: "Court_Costs", tag: '#lbl2BCRTCs', method: 'text'},
            {field: "Court_Fine", tag: '#lbl2BCRTs', method: 'text'}, 
        ],
        "otherData": [],
        "controlID": "btnSummary",
        "active": true,
    }
]



///Object Generator Functions///////////////////////////////////////////////////////////////////////
function PageObject(configObject) {
    //Constructor for a page object. Each page becomes a seperate object.
    this.url = configObject.url;
    this.targetTags = configObject.targetTags;
    this.description = configObject.description;
    this.name = configObject.name;
    this.otherData = configObject.otherData;
    this.active = configObject.active;
    this.extract = configObject.extract;
    this.setActive = function() {
        this.active = !this.active
    }
    ;
    return this
}