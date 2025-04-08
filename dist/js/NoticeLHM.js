/******/ (() => { // webpackBootstrap
/*!*****************************!*\
  !*** ./src/js/noticeLHM.js ***!
  \*****************************/
var obligationsButton = document.createElement('tr');
obligationsButton.innerHTML = "<td class=\"leftmenufirstcol\">&nbsp; </td> \n                \t\t\t\t <td class=\"leftmenumiddlecol\"> \n                   \t\t\t\t \t<img src=\"https://".concat(window.location.host.split(".")[0], ".view.civicacloud.com.au/Common/Images/BulletPnt.gif\">&nbsp;<a href=\"javascript:ConfirmChangesLose('https://").concat(window.location.host.split(".")[0], ".view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorObligationsSummary.aspx')\" accesskey=\"i\" style=\"VERTICAL-ALIGN: top\" target=\"\">Obligations Summary</a></td>\n\t  \t\t\t\t\t\t\t <td class=\"leftmenulastcol\">&nbsp; </td>");
var sibling = document.querySelector("#dvInformation > table > tbody > tr:nth-child(11)");
document.querySelector("#dvInformation > table > tbody").insertBefore(obligationsButton, sibling.nextSibling);
/******/ })()
;
//# sourceMappingURL=NoticeLHM.js.map