var obligationsButton = document.createElement('tr');
obligationsButton.innerHTML = `<td class="leftmenufirstcol">&nbsp; </td> 
                				 <td class="leftmenumiddlecol"> 
                   				 	<img src="https://${window.location.host.split(".")[0]}.view.civicacloud.com.au/Common/Images/BulletPnt.gif">&nbsp;<a href="javascript:ConfirmChangesLose(\'https://${window.location.host.split(".")[0]}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorObligationsSummary.aspx\')" accesskey="i" style="VERTICAL-ALIGN: top" target="">Obligations Summary</a></td>
	  							 <td class="leftmenulastcol">&nbsp; </td>`

var sibling = document.querySelector("#dvInformation > table > tbody > tr:nth-child(11)")
document.querySelector("#dvInformation > table > tbody").insertBefore(obligationsButton, sibling.nextSibling);
