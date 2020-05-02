class View {
    constructor() {

    }

    View.Scrape() {

        
    }

}

/* 

Current
>>>>>>>>>
State which fields we want from each obligation page.
Obligation Page -> Field

New
>>>>>>>>>
State which fields we want and provide locations that the information can be found and the rules for getting the information from the page

How it could work:

Let us say we have a list of debtor ids, and we want to extract the best postal address
View.Scrape([Array of debtor numbers or obligation numbers], [Array of capture selectors], [Array of skip selectors and values], [Array of skip obligation numbers])
e.g. View.Scrape([5635435, 5434554], [postalAddress])

But what if we want the notice address for each debtor's obligations?
e.g. View.Scrape([5635435, 5434554], [noticeAddress])

But what if we want to avoid an obligation if a selector has a certain value or we have told the system we don't want it? 
e.g. 

View.Scrape({
    "debtorIds": [5635435, 5434554], 
    "selectors": [noticeAddress], 
    "skipSelectors": {Status: "Paid", Status: "NFDP"}, 
    "skipObligations": [13242424334,132421435,4535443]
})

    OR

View.Scrape({
    "obligationNos": [1832423432, 16482348903], 
    "selectors": [noticeAddress]
})

The selector's level determines if we look in the debtor level or the notice level for the selector.

What about warrant and court order scraping?

Before we scrape we calculate check 

Parser object has method for collecting obligation numbers from a debtor
scraper object gets each individual selector
combiner object takes objects returned by scraper and returns a single structured object.

Selectors
---------------
{
    "displayName": "First Name", 
    "key": "firstName",
    "xlsxExport": true,
    "ColumnWidth": 8.5, 
    "location": {
        "page": "All",
        "level": "notice",
        "selectorType":"page",
        "summary": false
    }
}

{
    "displayName": "Postal Address", 
    "key": "postalAddress",
    "xlsxExport": true,
    "ColumnWidth": 8.5, 
    "locations": {
        "page": "Addresses",
        "level": "debtor",
        "selectorType":"table"
    }
}

{
    "displayName": "Balance Outstanding", 
    "key": "balanceOutstanding",
    "xlsxExport": true,
    "ColumnWidth": 8.5, 
    "locations": {
        "page": "All",
        "level": "notice",
        "selectorType":"page",
        "summaryId": "DataBalanceOutstanding",
        "id": "NoticeInfo_lblBalanceOst"
    }

{
    "displayName": "Offence Location", 
    "key": "offenceLocation",
    "xlsxExport": false,
    "ColumnWidth": 20,  
    "locations": [{
        "page": "All",
        "level": "notice",
        "selectorType":"page"
    }
}

THE LAWS <-->
1. obligationNo is mandatory for a data extract.
2. selectors that get data from summaryTables must be able to locate obligationNo in each row.
3. There are three types of selectors - Table, Page and SummaryTable.
<-->

Selector type can be:
Table - obligation
Page - Either debtor or obligation
SummaryTable - Debtor level

- Data from the obligation summary table will always be fastest to locate. 
- What if we need to get licence state, challenge type and offence description.
    Offence description can be found on both challenge type pages and licence state pages. App would have to check if data can be located

Priority 1: Obligation table

Locations:
ObligationNo - Debtor table, Obligation Information Pages
Agency - Obligation Information Pages




*/