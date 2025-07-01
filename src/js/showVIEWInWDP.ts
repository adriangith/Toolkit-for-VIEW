import { CollectedData } from "./types";

/**
 * Switches the active obligation (and debtor as a side effect) to the one specified.
 * @param obligation The obligation to switch to
 * @returns response from fetch
 */
async function switchObligationsR(obligation: CollectedData, VIEWEnvironment: string = 'djr') {
	if (!obligation || !obligation["Obligation"]) {
		throw new Error("Invalid obligation data provided");
	}
	//Changes the active obligation
	const res = fetch(`https://${VIEWEnvironment}.view.civicacloud.com.au/Traffic/Notices/forms/NoticesManagement/SearchNotice.aspx?&NoticeNo=` + obligation["Obligation"], {
		method: 'GET',
		redirect: 'follow'
	});
	return res
}

function getFormData(formElement: HTMLFormElement) {

	const outData = new URLSearchParams();
	for (const pair of new FormData(formElement)) {

		if (pair[1] instanceof File) {
			continue;
		}

		outData.append(pair[0], pair[1]);
	}
	return outData;
}

async function getPage(page: { url: string }, formData = new URLSearchParams()) {
	const res = await fetch(page.url, {
		method: 'POST',
		body: formData
	});
	const htmlText = await res.text();
	return htmlText;
}

export async function showVIEWInWDP(ObligationList: CollectedData[], VIEWEnvironment: string = 'djr') {
	/** Flag indicating whether at least one obligation was found. If no obligations are found, the function will return false. */
	let hit = false;

	/** Switches the active obligation in VIEW */
	await switchObligationsR(ObligationList[0], VIEWEnvironment);

	/** Promise response containing the html text of the debtor obligations page. */
	const res = await fetch(`https://${VIEWEnvironment}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorObligations.aspx`);

	/** Html text of the debtor obligations page. */
	let htmlText = await res.text();

	const parser = new DOMParser();

	/** Html document of the debtor obligations page. */
	const doc = parser.parseFromString(htmlText, "text/html");

	/** Extracted form from the debtor obligations page */
	const form = doc.getElementsByTagName("form")[0];

	/** Extracted form data from the debtor obligations page */
	const formData = await getFormData(form);

	// Ammend formdata to show all obligations
	formData.set("DebtorNoticesCtrl$DebtorNoticesTable$ddRecordsPerPage", "0");

	/** Html text of the debtor obligations page with all obligations listed. */
	htmlText = await getPage({ "url": `https://${VIEWEnvironment}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorObligations.aspx` }, formData);

	/** Table of obligations from VIEW. */
	const obligationTable = doc.querySelector("#DebtorNoticesCtrl_DebtorNoticesTable_tblData tbody");

	/** List of captured obligations */
	const captured = [] as CollectedData[];
	if (obligationTable === null) { return false }
	for (let i = 0; i < obligationTable.childNodes.length; i++) {
		if (obligationTable.childNodes[i].nodeName === "TR") {
			const row = obligationTable.childNodes[i].childNodes;
			if (row[1].textContent == ObligationList[0].Obligation) { hit = true }

			const NoticeStatusCell = row[7]
			if (NoticeStatusCell === null || NoticeStatusCell.textContent === null) {
				throw new Error("NoticeStatusCell is null or empty");
			}
			const NoticeStatus = NoticeStatusCell.textContent.replace("/", "/\n");
			captured.push({
				"Notice Number": row[1].textContent || '',
				"Issued": row[5].textContent || '',
				"Balance Outstanding": row[6].textContent || '',
				"Notice Status": NoticeStatus || '',
				"Offence": row[8].textContent || '',
			});
		}
	}
	if (hit === false) { return false };
	return captured
}