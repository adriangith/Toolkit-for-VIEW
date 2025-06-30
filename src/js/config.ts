import { DerivationLogicRegistry, MasterFieldDefinition, MasterPageDefinition, ExtractedFieldName, DerivedFieldName } from "./types";
import { formatDate, toTitleCase } from "./utils";
import { initialiseWorkbookProcesser } from "./xlsxConverter";

export let workbook: Awaited<ReturnType<typeof initialiseWorkbookProcesser>>;

export const StatusCodes = [
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
];

export const allDataFields = [
    { name: "debtor_id", level: "Debtor" },
    { name: "NoticeStatus", level: "Obligation" },
    { name: "Category", level: "Debtor" },
    { name: "ReviewType", level: "Obligation", isDerived: true, sourceFields: ["CurrentChallengeLogged"] },
    { name: "dt", level: "Debtor", isDerived: true },
    { name: "CurrentChallengeLogged", level: "Obligation" },
    { name: "altname", level: "Obligation" },
    { name: "NoticeType", level: "Obligation" },
    { name: "warrant_fee_waived", level: "Obligation" },
    { name: "enforcename", level: "Obligation", isDerived: true, sourceFields: ["NoticeType", "altname"] },
    { name: "Agency", level: "Obligation", isDerived: true, sourceFields: ["enforcename"] },
    { name: "Debtor_ID", level: "Debtor", isDerived: true, sourceFields: ["debtor_id"], notes: "Derived from debtor_id" },
    { name: "UserID", level: "Debtor" },
    { name: "first_name", level: "Debtor" },
    { name: "First_Name", level: "Debtor", isDerived: true, sourceFields: ["first_name"] },
    { name: "last_name", level: "Debtor" },
    { name: "Last_Name", level: "Debtor", isDerived: true, sourceFields: ["last_name"] },
    { name: "fullName", level: "Debtor", isDerived: true, sourceFields: ["first_name", "last_name"], notes: "Derived from first_name and last_name" },
    { name: "last_name", level: "Debtor" },
    { name: "name", level: "Debtor", isDerived: true, derivationKey: 'fullName', sourceFields: ["first_name", "last_name", "company_name"], notes: "Derived from first_name and last_name" },
    { name: "Obligation", level: "Obligation", isDerived: true, sourceFields: ["NoticeNumber"] },
    { name: "Notice Number", level: "Obligation", isDerived: true, sourceFields: ["NoticeNumber"] },
    { name: "total_amount_outstanding", level: "Debtor" },
    { name: "Address2", level: "Obligation", isDerived: true, sourceFields: ["altname"] },
    { name: "enforcementAgencyID", level: "Obligation", isDerived: true, sourceFields: ["altname"] },
    { name: "Address3", level: "Obligation", isDerived: true, sourceFields: ["altname"] },
    { name: "MOU", level: "Obligation", isDerived: true, sourceFields: ["altname"] },
    { name: "MOU", level: "Obligation", isDerived: true, sourceFields: ["altname"] },
    { name: "Email", level: "Obligation", isDerived: true, sourceFields: ["altname"] },
    { name: "EmailAddress", level: "Obligation", isDerived: true, sourceFields: ["altname"] },
    { name: "enforcementAgencyCode", level: "Obligation", isDerived: true, sourceFields: ["altname"] },
    { name: "agency_code", level: "Obligation", isDerived: true, sourceFields: ["enforcementAgencyCode"] },
    { name: "company_name", level: "Debtor" },
    { name: "Company_Name", level: "Debtor", isDerived: true, sourceFields: ["company_name"] },
    { name: "best_residential_address", level: "Debtor" },
    { name: "best_postal_address", level: "Debtor" },
    { name: "best_postal_postcode", level: "Debtor" },
    { name: "best_residential_postcode", level: "Debtor" },
    { name: "street", level: "Debtor" },
    { name: "locality", level: "Debtor" },
    { name: "Address_1", level: "Debtor", isDerived: true, sourceFields: ["best_postal_address", "best_residential_address", "locality", "street", "addressType"] },
    { name: "address_2", level: "Debtor" },
    { name: "suburb", level: "Debtor" },
    { name: "Town", level: "Debtor", isDerived: true, sourceFields: ["suburb", "best_postal_address", "best_residential_address", "addressType"] },
    { name: "Town2", level: "Debtor", isDerived: true, sourceFields: ["Town"] },
    { name: "postcode", level: "Debtor" },
    { name: "Post_Code", level: "Debtor", isDerived: true, sourceFields: ["best_residential_address", "best_postal_address", "addressType"] },
    { name: "state", level: "Debtor" },
    { name: "State", level: "Debtor", isDerived: true, sourceFields: ["state", "best_residential_address", "best_postal_address", "addressType"] },
    { name: "country", level: "Debtor" },
    { name: "addressType", level: "Debtor" },
    { name: "todayplus14", level: "Debtor", isDerived: true },
    { name: "todayplus21", level: "Debtor", isDerived: true },
    { name: "todayplus28", level: "Debtor", isDerived: true },
    { name: "is_company", level: "Debtor", isDerived: true, sourceFields: ["company_name", "Category"] },
    { name: "Is_Company", level: "Debtor", isDerived: true, sourceFields: ["is_company"] },
    { name: "open_obligations", level: "Debtor" },
    { name: "date_of_birth", level: "Debtor" },
    { name: "NoticeNumber", level: "Obligation" },
    { name: "HoldCodeEndDate", level: "Obligation" },
    { name: "infringement_number", level: "Obligation" },
    { name: "Infringement", level: "Obligation", isDerived: true, sourceFields: ["infringement_number"] },
    { name: "offence_description", level: "Obligation" },
    { name: "Offence_Description", level: "Obligation", isDerived: true, sourceFields: ["offence_description"] },
    { name: "offence_location", level: "Obligation" },
    { name: "offence_time", level: "Obligation" },
    { name: "BalanceOutstanding", level: "Obligation" },
    { name: "Balance_Outstanding", level: "Obligation", isDerived: true, sourceFields: ["BalanceOutstanding"] },
    { name: "Balance Outstanding", level: "Obligation", isDerived: true, sourceFields: ["BalanceOutstanding"] },
    { name: "status", level: "Obligation", isDerived: true, sourceFields: ["obligation_status"] },
    { name: "Status", level: "Obligation", isDerived: true, sourceFields: ["obligation_status"] },
    { name: "Notice Status", level: "Obligation", isDerived: true, sourceFields: ["obligation_status"] },
    { name: "OffenceDate", level: "Obligation" },
    { name: "date_of_offence", level: "Obligation", isDerived: true, sourceFields: ["OffenceDate"] },
    { name: "Date_of_Offence", level: "Obligation", isDerived: true, sourceFields: ["OffenceDate"] },
    { name: "Issued", level: "Obligation" },
    { name: "date_of_issue", level: "Obligation", isDerived: true, sourceFields: ["Issued"] },
    { name: "Date of Issue", level: "Obligation", isDerived: true, sourceFields: ["Issued"] },
    { name: "IssueDate", level: "Obligation", isDerived: true, sourceFields: ["Issued"] },
    { name: "input_source", level: "Obligation", isDerived: true, sourceFields: ["NoticeType"] },
    { name: "Input Source", level: "Obligation", isDerived: true, sourceFields: ["NoticeType"] },
    { name: "PRN_issue_date", level: "Obligation" },
    { name: "PRN Issue Date", level: "Obligation", isDerived: true, sourceFields: ["PRN_issue_date"] },
    { name: "NFD_issue_date", level: "Obligation" },
    { name: "NFD Issue Date", level: "Obligation", isDerived: true, sourceFields: ["NFD_issue_date"] },
    { name: "VRM", level: "Obligation" },
    { name: "VRM Number", level: "Obligation", isDerived: true, sourceFields: ["VRM"] },
    { name: "VRM State", level: "Obligation" },
    { name: "driver_licence_state", level: "Obligation" },
    { name: "Driver License State", level: "Obligation", isDerived: true, sourceFields: ["driver_licence_state"] },
    { name: "driver_licence_no", level: "Obligation" },
    { name: "Driver License No.", level: "Obligation", isDerived: true, sourceFields: ["driver_licence_no"] },
    { name: "driver_licence_expiry", level: "Obligation" },
    { name: "prn_street_name", level: "Obligation" },
    { name: "prn_suburb", level: "Obligation" },
    { name: "prn_postcode", level: "Obligation" },
    { name: "prn_country", level: "Obligation" },
    { name: "PRN Address", level: "Obligation", isDerived: true, sourceFields: ["prn_street_name", "prn_suburb", "prn_postcode", "prn_country"] },
    { name: "outstanding_amount", level: "Obligation" },
    { name: "obligation_status", level: "Obligation", isDerived: true, sourceFields: ["NoticeStatus"] },
    { name: "DueDate", level: "Obligation" },
    { name: "challenge_date", level: "Obligation" },
    { name: "challenge_code", level: "Obligation" },
    { name: "Challenge", level: "Obligation", isDerived: true, sourceFields: ["challenge_code"] },
    { name: "reduced_charge", level: "Obligation" },
    { name: "penalty_reminder_fee", level: "Obligation" },
    { name: "registration_fee", level: "Obligation" },
    { name: "enforcement_fee", level: "Obligation" },
    { name: "warrant_issue_fee", level: "Obligation" },
    { name: "amount_waived", level: "Obligation" },
    { name: "returns", level: "Obligation" },
    { name: "amount_paid", level: "Obligation" },
    { name: "court_costs", level: "Obligation" },
    { name: "court_fine", level: "Obligation" },
    { name: "PRN Issue Date", level: "Obligation" },
    { name: "ContraventionCode", level: "Obligation" },
    { name: "CaseRef", level: "Obligation" },
    { name: "InActivePaymentArrangement", level: "Obligation", isDerived: true, sourceFields: ["HoldCodeEndDate"] },
    { name: "Offence", level: "Obligation", isDerived: true, sourceFields: ["offence_description"] },
    { name: "NFDlapsed", level: "Obligation", isDerived: true, sourceFields: ["DueDate", "obligation_status"] },
    { name: "OnlyNFDLapsed", level: "Obligation" },
    { name: "pre-payments", level: "Obligation" },
    { name: "refunds", level: "Obligation" },
    { name: "reversed_fees", level: "Obligation" },
    { name: "cancellations", level: "Obligation" },
    { name: "writeoff", level: "Obligation" },
    { name: "hearing_costs", level: "Obligation" },
    { name: "transfer_in", level: "Obligation" },
    { name: "transfer_out", level: "Obligation" },
    { name: "court_courts_type_3", level: "Obligation" }
] as const satisfies MasterFieldDefinition[];

export const pageDefinitions = [
    {
        url: "https://${environment}.view.civicacloud.com.au/Taskflow/Forms/Management/TaskList.aspx?ProcessMode=User",
        id: 'TaskList',
        dependencies: [],
        level: 'Debtor',
        fields: [
            {
                name: "UserID",
                selector: {
                    type: "css",
                    value: "#ctl00_mainContentPlaceHolder_taskListOwnerLabel"
                }
            }
        ]
    },
    {
        id: "DebtorDetails",
        fields: [
            { name: "debtor_id", selector: { type: "css", value: "#DebtorDetailsCtrl_DebtorIdSearch" } },
            { name: "first_name", selector: { type: "css", value: "#DebtorDetailsCtrl_firstnameTxt" } },
            { name: "last_name", selector: { type: "css", value: "#DebtorDetailsCtrl_surnameTxt" } },
            { name: "total_amount_outstanding", selector: { type: "css", value: "#DebtorDetailsCtrl_totalAmountOutstandingTxt" } },
            { name: "company_name", selector: { type: "css", value: "#DebtorDetailsCtrl_companyNameTxt" } },
            { name: "street", selector: { type: "css", value: "#DebtorAddressCtrl_streetTxt" } },
            { name: "locality", selector: { type: "css", value: "#DebtorAddressCtrl_localityTxt" } },
            { name: "suburb", selector: { type: "css", value: "#DebtorAddressCtrl_cityTxt" } },
            { name: "state", selector: { type: "css", value: "#DebtorAddressCtrl_stateTxt" } },
            { name: "postcode", selector: { type: "css", value: "#DebtorAddressCtrl_postcodeTxt" } },
            { name: "country", selector: { type: "css", value: "#DebtorAddressCtrl_countryTxt" } },
            { name: "addressType", selector: { type: "css", value: "#DebtorAddressCtrl_typeTxt" } },
            { name: "Category", selector: { type: "css", value: "#DebtorDetailsCtrl_categoryTxt" } }
        ],
        dependencies: [],
        level: "Debtor",
        url: "https://${environment}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorDetails.aspx"
    },
    {
        id: "DebtorAddresses",
        fields: [
            { name: "best_residential_address", selector: { type: "xpath", value: "//table//tr[td[count(//th[normalize-space(.)='Best Address']/preceding-sibling::th) + 1][normalize-space(.)='Y'] and td[count(//th[normalize-space(.)='Type']/preceding-sibling::th) + 1][normalize-space(.)='Residential Address']]/td[count(//th[normalize-space(.)='Address']/preceding-sibling::th) + 1]" } },
            { name: "best_postal_address", selector: { type: "xpath", value: "//table//tr[td[count(//th[normalize-space(.)='Best Address']/preceding-sibling::th) + 1][normalize-space(.)='Y'] and td[count(//th[normalize-space(.)='Type']/preceding-sibling::th) + 1][normalize-space(.)='Postal Address']]/td[count(//th[normalize-space(.)='Address']/preceding-sibling::th) + 1]" } },
            { name: "best_postal_postcode", selector: { type: "xpath", value: "//table//tr[td[count(//th[normalize-space(.)='Best Address']/preceding-sibling::th) + 1][normalize-space(.)='Y'] and td[count(//th[normalize-space(.)='Type']/preceding-sibling::th) + 1][normalize-space(.)='Postal Address']]/td[count(//th[normalize-space(.)='Postcode']/preceding-sibling::th) + 1]" } },
            { name: "best_residential_postcode", selector: { type: "xpath", value: "//table//tr[td[count(//th[normalize-space(.)='Best Address']/preceding-sibling::th) + 1][normalize-space(.)='Y'] and td[count(//th[normalize-space(.)='Type']/preceding-sibling::th) + 1][normalize-space(.)='Residential Address']]/td[count(//th[normalize-space(.)='Postcode']/preceding-sibling::th) + 1]" } }
        ],
        dependencies: [],
        level: "Debtor",
        url: "https://${environment}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorAddresses.aspx"
    },
    {
        id: "DebtorFurtherDetails",
        fields: [
            { name: "debtor_id", selector: { type: "css", value: "#DebtorDetailsCtrl_DebtorIdSearch" } },
            { name: "first_name", selector: { type: "css", value: "#DebtorDetailsCtrl_firstnameTxt" } },
            { name: "last_name", selector: { type: "css", value: "#DebtorDetailsCtrl_surnameTxt" } },
            { name: "date_of_birth", selector: { type: "css", value: "#DebtorIndividualCtrl_dateOfBirthTxt" } },
            { name: "company_name", selector: { type: "css", value: "#DebtorDetailsCtrl_companyNameTxt" } },
            { name: "total_amount_outstanding", selector: { type: "css", value: "#DebtorDetailsCtrl_totalAmountOutstandingTxt" } },
        ],
        dependencies: [],
        level: "Debtor",
        url: "https://${environment}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorFurtherDetails.aspx"
    },
    {
        id: "DebtorObligationsSummary",
        fields: [
            {
                name: 'NoticeNumber', // This is a placeholder, the real magic is in rowMapping
                isList: true,
                selector: {
                    type: 'row-mapped',
                    // Selector for each row in the main 50-row table
                    rowSelector: '#DebtorNoticesCtrl_DebtorNoticesTable_tblData tbody tr',
                    fields: {
                        'NoticeNumber': { selector: 'td[id$="NoticeNumber"]' },
                        'NoticeStatus': { selector: 'td[id$="NoticeStatus"]' },
                        'BalanceOutstanding': { selector: 'td[id$="BalanceOutstanding"]' },
                        'NoticeType': { selector: 'td[id$="NoticeType"]' },
                        'HoldCodeEndDate': { selector: 'td[id$="HoldCodeEndDate"]' },
                        'ContraventionCode': { selector: 'td[id$="ContraventionCode"]' },
                        'OffenceDate': { selector: 'td[id$="OffenceDate"]' },
                        'DueDate': { selector: 'td[id$="DueDate"]' }
                    },
                    lookup: {
                        // The field we are looking up
                        valueFieldName: 'CaseRef',
                        // Selector for each row in the *separate* CaseRef table
                        rowSelector: '#DebtorCourtOrdersCtrl_DebtorCourtFinesTable_tblData tbody tr',
                        // Selector for the Notice Number *in the CaseRef table*
                        keySelector: 'td[id$="NoticeNumber"]',
                        // Selector for the CaseRef value *in the CaseRef table*
                        valueSelector: 'td[id$="CaseRef"]',
                    }
                }
            }
        ],
        dependencies: [],
        level: "Debtor",
        url: "https://${environment}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorObligationsSummary.aspx"
    },
    {
        id: "DebtorDecisionReview",
        fields: [
            { name: "NoticeNumber", selector: { type: "css", value: "#DebtorDecisionCtrl_DebtorNoticesTable_tblData td[id$='NoticeNumber']" }, isList: true },
            { name: "challenge_code", selector: { type: "css", value: "#DebtorDecisionCtrl_DebtorNoticesTable_tblData td[id$='ChallengeCode']" }, isList: true }
        ],
        dependencies: [],
        level: "Debtor",
        url: "https://${environment}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorDecisionReview.aspx"
    },
    {
        id: "NoticeDetails",
        fields: [
            { name: "NoticeNumber", selector: { type: "css", value: "#NoticeInfo_txtNoticeNo" } },
            { name: "infringement_number", selector: { type: "css", value: "#NoticeInfo_lblInfringementNo" } },
            { name: "DueDate", selector: { type: "css", value: "#NoticeInfo_lblNextPaymentDueDateBoxInfo" } },
            { name: "altname", selector: { type: "css", value: "#NoticeInfo_lblAgencyCode" } },
            { name: "PRN_issue_date", selector: { type: "css", value: "#NoticeInfo_lblPrnIssueDateBoxInfo" } },
            { name: "NFD_issue_date", selector: { type: "css", value: "#NoticeInfo_lblNfdIssueDateBoxInfo" } },
            { name: "Issued", selector: { type: "css", value: "#NoticeInfo_lblInfringementIssueDateBoxInfo" } },
            { name: "OffenceDate", selector: { type: "css", value: "#NoticeInfo_lblIssueDt" } },
            { name: "offence_time", selector: { type: "css", value: "#NoticeInfo_lblIssueTm" } },
            { name: "offence_description", selector: { type: "css", value: "#NoticeInfo_lblContCode", node: 'title' } },
            { name: "offence_location", selector: { type: "css", value: "#NoticeInfo_lblLocdesc" } },
            { name: "VRM", selector: { type: "css", value: "#NoticeInfo_lblVrmNo" } },
            { name: "BalanceOutstanding", selector: { type: "css", value: "#DebtorDetailsCtrl_totalAmountOutstandingTxt" } },
            { name: "Challenge", selector: { type: "xpath", value: "substring-after(//li[starts-with(., 'Challenge reason: Enforcement - ')], 'Challenge reason: Enforcement - ')" } },
        ],
        dependencies: [],
        level: "Obligation",
        url: "https://${environment}.view.civicacloud.com.au/Traffic/Notices/forms/NoticesManagement/SearchNotice.aspx?&NoticeNo=${NoticeNumber}"
    },
    {
        id: "NoticeVehicleDetails",
        level: "Obligation",
        fields: [
            {
                name: "VRM State",
                selector: { type: "css", value: "#lblVRMState" }
            }
        ],
        dependencies: [],
        url: "https://${environment}.view.civicacloud.com.au/Traffic/Notices/Forms/NoticesManagement/NoticeVehicleDetails.aspx"
    },
    {
        id: "NoticeKeeper",
        url: "https://${environment}.view.civicacloud.com.au/Traffic/Notices/Forms/NoticesManagement/NoticeKeeper.aspx",
        dependencies: [],
        level: "Obligation",
        fields: [
            { name: "driver_licence_state", selector: { type: "css", value: "#lblDriverLicenceState" } },
            { name: "driver_licence_no", selector: { type: "css", value: "#lblDriverLicenceNo" } },
            { name: "driver_licence_expiry", selector: { type: "css", value: "#lblLicenceExpiryDate" } },
            { name: "prn_street_name", selector: { type: "css", value: "#lblSreetDescriptor" } },
            { name: "prn_suburb", selector: { type: "css", value: "#lblTown" } },
            { name: "prn_postcode", selector: { type: "css", value: "#lblPostCode" } },
            { name: "prn_country", selector: { type: "css", value: "#lblCountry" } },
        ]
    },
    {
        id: "NoticeAudit",
        dependencies: [],
        level: "Obligation",
        url: "https://${environment}.view.civicacloud.com.au/Traffic/Notices/Forms/NoticesManagement/NoticeAudit.aspx",
        fields: [
            { name: "warrant_fee_waived", selector: { type: "xpath", value: "//tr[./td[contains(text(),'RWARRNT')]]/td[position()=count(//td[a/text()='Amount($)']/preceding-sibling::td)+1]" } },
        ]
    },
    {
        id: "NoticeAudit2",
        dependencies: [{
            id: "NoticeAudit",
            literalParams: [
                { name: 'htxtPage', value: '2' }
            ]
        }],
        level: "Obligation",
        url: "https://${environment}.view.civicacloud.com.au/Traffic/Notices/Forms/NoticesManagement/NoticeAudit.aspx",
        fields: [
            { name: "warrant_fee_waived", selector: { type: "xpath", value: "//tr[./td[contains(text(),'RWARRNT')]]/td[position()=count(//td[a/text()='Amount($)']/preceding-sibling::td)+1]" } },
        ],
        method: "POST"
    },
    {
        id: "FinancialSummary",
        fields: [
            { name: "reduced_charge", selector: { type: "css", value: "#lblReducedCharge" } },
            { name: "penalty_reminder_fee", selector: { type: "css", value: "#lblPenaltyReminderFee" } },
            { name: "registration_fee", selector: { type: "css", value: "#lblRegistrationFee" } },
            { name: "enforcement_fee", selector: { type: "css", value: "#lblEnforcementFee" } },
            { name: "amount_waived", selector: { type: "css", value: "#lblWaiveAmt" } },
            { name: "amount_paid", selector: { type: "css", value: "#lblPayments" } },
            { name: "court_costs", selector: { type: "css", value: "#lbl2BCRTCs" } },
            { name: "court_fine", selector: { type: "css", value: "#lbl2BCRTs" } },
            { name: "warrant_issue_fee", selector: { type: "css", value: "#lblWarrantIssueFee" } },
            { name: "pre-payments", selector: { type: "css", value: "#lblPrePayments" } },
            { name: "returns", selector: { type: "css", value: "#lblReturnChqs" } },
            { name: "refunds", selector: { type: "css", value: "#lblRefunds" } },
            { name: "reversed_fees", selector: { type: "css", value: "#lblReversedFees" } },
            { name: "cancellations", selector: { type: "css", value: "#lblCancellations" } },
            { name: "writeoff", selector: { type: "css", value: "#lblWritteoffs" } },
            { name: "hearing_costs", selector: { type: "css", value: "#lblAppealCosts" } },
            { name: "transfer_in", selector: { type: "css", value: "#lblTransferIns" } },
            { name: "transfer_out", selector: { type: "css", value: "#lblTransferOuts" } },
            { name: "court_courts_type_3", selector: { type: "css", value: "#lblCourtCosts" } }
        ],
        dependencies: [{
            id: "NoticeAudit",
            literalParams: [
                { name: 'btnSummary.x', value: '0' },
                { name: 'btnSummary.y', value: '0' }
            ]
        }],
        level: "Obligation",
        url: "https://${environment}.view.civicacloud.com.au/Traffic/Notices/Forms/NoticesManagement/NoticeAudit.aspx",
        method: "POST"
    },
    {
        id: "DebtorCourtFines",
        level: "Obligation",
        url: "https://${environment}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorCourtFines.aspx?CaseRef=${CaseRef}&NoticeNo=${NoticeNumber}&DebtorId=${debtor_id}",
        dependencies: [],
        fields: []
    },
    {
        id: "DebtorCourtFines2",
        level: "Obligation",
        url: "https://${environment}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorCourtFines.aspx?CaseRef=${CaseRef}&NoticeNo=${NoticeNumber}&DebtorId=${debtor_id}",
        dependencies: [{
            id: "DebtorCourtFines",
            literalParams: [
                { name: "__EVENTTARGET", value: "CourtResultCtrl$DebtorCourtResultsTable" },
                { name: "__EVENTARGUMENT", value: "RowClicked-0" }
            ]
        }],
        fields: [
            { name: "altname", selector: { type: "xpath", value: "//table[@id='DebtComponentDisbursement_DebtorDisbursementTable_tblData']//td[contains(text(),'P')]/../td" } }
        ]
    }
] as const satisfies MasterPageDefinition[];

export const derivationFunctionsRegistry: DerivationLogicRegistry = {
    "fullName": (sources) => {
        const firstName = toTitleCase(sources.first_name);
        const lastName = toTitleCase(sources.last_name);
        const company_name = toTitleCase(sources.company_name);
        return company_name ? company_name : [firstName, lastName].filter(Boolean).join(' ');
    },
    "First_Name": ({ first_name }) => {
        return toTitleCase(first_name || '');
    },
    "Last_Name": ({ last_name }) => {
        return toTitleCase(last_name || '');
    },
    "Company_Name": ({ company_name }) => {
        return company_name ? toTitleCase(company_name) : undefined;
    },
    "dt": () => {
        return formatDate(new Date());
    },
    "Obligation": (sources) => {
        return sources.NoticeNumber;
    },
    "ReviewType": ({ challenge_code }) => {
        const ChallengeCodes = {
            "E_EXCIRCUM": "Exceptional circumstances",
            "E_PERUNAWR": "Person unaware",
            "E_SPCIRCUM": "Special circumstances",
            "E_CONTRLAW": "Contrary to the law",
            "E_MISTAKID": "Mistake of identity"
        };
        const challengeDescription = ChallengeCodes[challenge_code as keyof typeof ChallengeCodes] || challenge_code;
        switch (challengeDescription) {
            case 'Special Circumstances':
                return `ER Special: ${challengeDescription}`;
            case 'General':
                return `ER General: ${challengeDescription}`;
            default:
                return `Review`;
        }
    },
    "Challenge": ({ challenge_code }) => {
        const ChallengeCodes = {
            "E_EXCIRCUM": "Exceptional circumstances",
            "E_PERUNAWR": "Person unaware",
            "E_SPCIRCUM": "Special circumstances",
            "E_CONTRLAW": "Contrary to the law",
            "E_MISTAKID": "Mistake of identity"
        };
        return ChallengeCodes[challenge_code as keyof typeof ChallengeCodes] || challenge_code;
    },
    "enforcename": async ({ NoticeType, altname }) => {
        /** Map of input source codes to enforcement agency names for '1A' and '1C'. */
        const InputSourceMap: Record<string, string | undefined> = {
            "1A": "Traffic Camera Office",
            "1C": "Victoria Police Toll Enforcement",
        };

        /** Enforcement agency name if the NoticeType is '1A' or '1C', otherwise undefined*/
        const enforcename = InputSourceMap[NoticeType];
        if (enforcename) return enforcename;
        if (!workbook) workbook = await initialiseWorkbookProcesser('https://vicgov.sharepoint.com/:x:/s/VG002447/ERw7UOkUPWZLpAiwgjuPgmcBjEx8dklCu-9D9_bknPVOUQ?download=1');
        const agencyData = await workbook.fetchAndConvertXlsxToJson({ Sheet: 'Agencies', Column: 'enforcename' });
        return agencyData[altname];
    },
    "todayplus14": () => {
        const today = new Date();
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + 14);

        // Get the individual parts of the date
        const day = futureDate.getDate();
        const month = futureDate.toLocaleString('en-GB', { month: 'long' });
        const year = futureDate.getFullYear();

        return `${day} ${month} ${year}`;
    },
    "todayplus21": () => {
        const today = new Date();
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + 21);

        // Get the individual parts of the date
        const day = futureDate.getDate();
        const month = futureDate.toLocaleString('en-GB', { month: 'long' });
        const year = futureDate.getFullYear();

        return `${day} ${month} ${year}`;
    },
    "todayplus28": () => {
        const today = new Date();
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + 28);

        // Get the individual parts of the date
        const day = futureDate.getDate();
        const month = futureDate.toLocaleString('en-GB', { month: 'long' });
        const year = futureDate.getFullYear();

        return `${day} ${month} ${year}`;
    },
    "Address2": async ({ altname }) => {
        if (!workbook) workbook = await initialiseWorkbookProcesser('https://vicgov.sharepoint.com/:x:/s/VG002447/ERw7UOkUPWZLpAiwgjuPgmcBjEx8dklCu-9D9_bknPVOUQ?download=1');
        const agencyData = await workbook.fetchAndConvertXlsxToJson({ Sheet: 'Agencies', Column: 'Address2' });
        const Address2 = agencyData[altname];
        return Address2;
    },
    "Address3": async ({ altname }) => {
        if (!workbook) workbook = await initialiseWorkbookProcesser('https://vicgov.sharepoint.com/:x:/s/VG002447/ERw7UOkUPWZLpAiwgjuPgmcBjEx8dklCu-9D9_bknPVOUQ?download=1');
        const agencyData = await workbook.fetchAndConvertXlsxToJson({ Sheet: 'Agencies', Column: 'Address3' });
        const Address3 = agencyData[altname];
        return Address3;
    },
    "MOU": async ({ altname }) => {
        if (!workbook) workbook = await initialiseWorkbookProcesser('https://vicgov.sharepoint.com/:x:/s/VG002447/ERw7UOkUPWZLpAiwgjuPgmcBjEx8dklCu-9D9_bknPVOUQ?download=1');
        const agencyData = await workbook.fetchAndConvertXlsxToJson({ Sheet: 'Agencies', Column: 'MOU' });
        const MOU = agencyData[altname];
        return MOU;
    },
    "enforcementAgencyCode": async (sources) => {
        if (!workbook) workbook = await initialiseWorkbookProcesser('https://vicgov.sharepoint.com/:x:/s/VG002447/ERw7UOkUPWZLpAiwgjuPgmcBjEx8dklCu-9D9_bknPVOUQ?download=1');
        const agencyData = await workbook.fetchAndConvertXlsxToJson({ Sheet: 'Agencies', Column: 'enforcementAgencyCode' });
        const agencyAddress = agencyData[sources.altname];
        return agencyAddress;
    },
    "enforcementAgencyID": async (sources) => {
        if (!workbook) workbook = await initialiseWorkbookProcesser('https://vicgov.sharepoint.com/:x:/s/VG002447/ERw7UOkUPWZLpAiwgjuPgmcBjEx8dklCu-9D9_bknPVOUQ?download=1');
        const agencyData = await workbook.fetchAndConvertXlsxToJson({ Sheet: 'Agencies', Column: 'enforcementAgencyID' });
        const agencyID = agencyData[sources.altname];
        return agencyID;
    },
    "Address_1": async ({ best_residential_address, best_postal_address, street, locality, addressType }) => {
        if (best_residential_address || best_postal_address) {
            const fullAddress = best_postal_address || best_residential_address;
            if (typeof fullAddress !== 'string') return undefined;
            const addressArray = fullAddress.split(',');
            const street = addressArray[0] || '';
            const locality = addressArray[1] || '';
            return formatLocalityAndStreet(street, addressArray.length > 3 ? locality : undefined);
        }
        return addressType === 'POSTAL' ? formatLocalityAndStreet(street, locality) : undefined;
    },
    "Town": ({ best_residential_address, best_postal_address, suburb, addressType }) => {
        if (best_residential_address && best_postal_address) {
            const fullAddress = best_postal_address || best_residential_address;
            if (typeof fullAddress !== 'string') return undefined;
            const addressArray = fullAddress.split(',');
            const Town = addressArray[addressArray.length - 2];
            return Town.trim().toUpperCase();
        }
        return typeof suburb !== 'boolean' && addressType === 'POSTAL' ? suburb?.toUpperCase() : undefined;
    },
    "State": ({ best_residential_address, best_postal_address, state, addressType }) => {
        if (best_residential_address || best_postal_address) {
            const fullAddress = best_postal_address || best_residential_address;
            if (typeof fullAddress !== 'string') return undefined;
            const addressArray = fullAddress.split(',');
            const state = addressArray[addressArray.length - 1];
            return state.trim().toUpperCase();
        }
        return addressType === 'POSTAL' && typeof state === 'string' ? state.trim().toUpperCase() : undefined;
    },
    "Post_Code": ({ best_residential_postcode, best_postal_postcode }) => {
        const bestPostcode = best_postal_postcode || best_residential_postcode
        if (!bestPostcode || typeof bestPostcode !== 'string') return undefined;
        return bestPostcode.trim();
    },
    "PRN Address": ({ prn_street_name, prn_suburb, prn_postcode, prn_country }) => {
        return `${prn_street_name} ${prn_suburb} ${prn_postcode} ${prn_country}`;
    },
    "InActivePaymentArrangement": ({ HoldCodeEndDate }) => {
        return HoldCodeEndDate === 'PAYARNGMNT' ? true : false;
    },
    "is_company": ({ company_name }) => {
        return company_name ? true : false;
    },

    "Town2": ({ Town }) => {
        // Convert suburb to title case
        if (!Town || typeof Town !== 'string') return undefined;
        return toTitleCase(Town);
    },
    "NoticeStatus": ({ NoticeStatus }) => {
        return NoticeStatus?.replace('CHLGLOG/', '');
    },
    "NFDlapsed": ({ DueDate, obligation_status }) => {
        if (!DueDate || typeof DueDate !== "string") return undefined
        if (!obligation_status || typeof obligation_status !== "string") return undefined
        const dateParts = DueDate.split("/");
        return obligation_status === 'SELDEA'
            || obligation_status === 'WARRNT'
            || (new Date(Number(dateParts[2] || 0), Number(dateParts[1]) - 1, Number(dateParts[0] || 0)).getTime() < new Date().getTime()
                && obligation_status === 'NFDP')
    }
}

function formatLocalityAndStreet(street: string | boolean | undefined = '', locality: string | boolean | undefined = '') {
    if (typeof locality !== 'string' || typeof street !== 'string') {
        throw new Error("Locality or street are not strings.");
    }
    const replacements: [RegExp, string][] = [
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
    ];
    let expandedLocality: string | undefined = toTitleCase(locality.trim());
    let expandedStreet: string | undefined = toTitleCase(street.trim());
    // Apply each replacement sequentially
    for (const [regex, replacementString] of replacements) {
        expandedLocality = expandedLocality.replace(regex, replacementString);
    }
    // Apply each replacement sequentially
    for (const [regex, replacementString] of replacements) {
        expandedStreet = expandedStreet.replace(regex, replacementString);
    }
    return `${expandedStreet}${street !== '' ? ' ' + expandedLocality : ''}`.trim();
}

export const defaultTargetFields: (DerivedFieldName | ExtractedFieldName)[] = ["returns", "obligation_status", "NFDlapsed", "todayplus14", "todayplus21", "todayplus28", "Challenge", "is_company", "Is_Company", "InActivePaymentArrangement", "VRM", "VRM State", "date_of_birth", "enforcementAgencyID", "warrant_fee_waived", "HoldCodeEndDate", "IssueDate", "Infringement", "dt", "NoticeType", "agency_code", "input_source", "name", "enforcename", "Town2", "altname", "Address_1", "Address2", "Address3", "Email", "EmailAddress", "enforcementAgencyCode", "MOU", "Debtor_ID", "ReviewType", "debtor_id", "fullName", "total_amount_outstanding", "DueDate", "BalanceOutstanding", "infringement_number", "reduced_charge", "penalty_reminder_fee", "registration_fee", "enforcement_fee", "warrant_issue_fee", "amount_waived", "amount_paid", "court_costs", "court_fine", "UserID", "Obligation", "Last_Name", "First_Name", "Offence_Description", "Balance_Outstanding", "Status", "Date_of_Offence", "Date of Issue", "Input Source", "PRN Issue Date", "NFD Issue Date", "Driver License No.", "Driver License State", "driver_licence_expiry", "PRN Address", "Post_Code", "State", "offence_location", "Town", "Company_Name", "Offence", "pre-payments", "refunds", "reversed_fees", "cancellations", "writeoff", "hearing_costs", "transfer_in", "transfer_out", "court_courts_type_3", "Category"] as const; 