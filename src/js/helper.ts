import { selectionRules, CellsInfo, ProcessorRule } from './tableProcessorConfig';

/////Helper functions/////////////////////////////////////////////////////////////////////////////////

type FilterResult = { checked: boolean, shouldProcess: boolean };

/**
 * Toggles all checkboxes with the name 'boxes' based on the state of a source checkbox
 * @param source - The source checkbox element that triggers the toggle
 */
function toggle(source: HTMLInputElement): void {
	const checkboxes: NodeListOf<HTMLInputElement> = document.getElementsByName('boxes') as NodeListOf<HTMLInputElement>;
	for (let i = 0; i < checkboxes.length; i++) {
		checkboxes[i].checked = source.checked;
	}
}

/**
 * Sets the checked state of a checkbox in a table cell
 */
function setCheckboxState(cell: Element, state: boolean): boolean {
	const checkbox = cell.querySelector('input');
	if (checkbox) {
		checkbox.checked = state;
		return true;
	}
	return false;
}

/**
 * Generic function to process table rows with a custom filter function
 */
async function processTableRows(
	filterFn: (cells: NodeListOf<ChildNode>, cellsInfo: CellsInfo) => FilterResult
): Promise<void> {
	const table = document.querySelector("#DebtorNoticesCtrl_DebtorNoticesTable_tblData > tbody");
	if (!table) return;

	const tableRows = table.childNodes;
	for (let row = 1; row < tableRows.length - 1; row++) {
		const cells = tableRows[row].childNodes;
		const cellsInfo: CellsInfo = {
			holdStatusCell: null,
			contraventionCodeCell: null,
			noticeStatusCell: null,
			noticeNumberCell: null,
			balanceOutstandingCell: null,
			currentChallengeLoggedCell: null
		};

		// Find all needed cells by ID pattern
		for (let cell = 2; cell < cells.length - 2; cell++) {
			const cellElement = cells[cell] as Element;
			if (cellElement.id) {
				if (cellElement.id.includes("HoldCode")) {
					cellsInfo.holdStatusCell = cellElement;
				} else if (cellElement.id.includes("CellDataContraventionCode")) {
					cellsInfo.contraventionCodeCell = cellElement;
				} else if (cellElement.id.includes("CellDataNoticeStatus")) {
					cellsInfo.noticeStatusCell = cellElement;
				} else if (cellElement.id.includes("CurrentChallengeLogged")) {
					cellsInfo.currentChallengeLoggedCell = cellElement;
				} else if (cellElement.id.includes("CellDataNoticeNumber")) {
					cellsInfo.noticeNumberCell = cellElement;
				} else if (cellElement.id.includes("CellDataBalanceOutstanding")) {
					cellsInfo.balanceOutstandingCell = cellElement;
				}
			}
		}

		// Apply the filter function to determine checkbox state
		const result = filterFn(cells, cellsInfo);

		// Only process if the filter function indicates we should
		if (result.shouldProcess) {
			setCheckboxState(cells[1] as Element, result.checked);
		}
	}
}

/**
 * Applies a rule from the configuration to select table rows
 * @param ruleKey - The key of the rule in the selectionRules object
 */
async function applySelectionRule(ruleKey: keyof typeof selectionRules): Promise<void> {
	if (!selectionRules[ruleKey]) {
		console.error(`Selection rule '${ruleKey}' not found`);
		return;
	}

	const rule = selectionRules[ruleKey];

	await processTableRows((cells, cellsInfo) => {
		return {
			checked: rule.filter(cellsInfo),
			shouldProcess: true
		};
	});
}

/**
 * Selects all rows that have an FVSPEND hold code
 */
async function selectFVSHolds(): Promise<void> {
	await applySelectionRule('fvsHolds');
}

/**
 * Selects all rows that have a PAYARNGMNT hold code
 */
async function selectPAHolds(): Promise<void> {
	await applySelectionRule('paymentArrangements');
}

/**
 * Selects all rows with "Enforcement Review" in the CurrentChallengeLogged column
 */
async function selectEnforcementReview(): Promise<void> {
	await applySelectionRule('enforcementReview');
}

/**
 * Selects appropriate rows based on status and other criteria
 */
async function selectApplicable(): Promise<void> {
	await applySelectionRule('applicableRows');
}

/**
 * Compares a text value against values in a table and checks matching rows
 */
function compare(txtValue: string, cells: NodeListOf<ChildNode>, trd: NodeListOf<ChildNode>): void {
	for (let j = 1; j < trd.length - 1; j++) {
		const tdd = trd[j].childNodes;
		const celld = tdd[2];
		const txtValued = (celld as HTMLElement).innerText;
		if (txtValue === txtValued) {
			setCheckboxState(cells[1] as Element, true);
		}
	}
}

/**
 * Gets the review decision table from another page
 * @returns The table's child nodes
 */
async function getReviewDecisionTable(): Promise<NodeListOf<ChildNode> | null> {
	try {
		const host = window.location.host.split(".")[0];
		let response = await fetch(`https://${host}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorDecisionReview.aspx`);
		let pageText = await response.text();
		const parser = new DOMParser();
		let reviewPage = parser.parseFromString(pageText, 'text/html');

		const dropdown = reviewPage.querySelector("#DebtorDecisionCtrl_dropdownReviewType") as HTMLSelectElement;

		if (dropdown && dropdown.value !== "2") {
			// Standard DOM API approach - no jQuery needed
			const theForm = reviewPage.querySelector('form') as HTMLFormElement;
			const outData = new URLSearchParams();

			if (theForm) {
				for (const pair of new FormData(theForm)) {
					outData.append(pair[0] as string, pair[1] as string);
				}

				outData.set("DebtorDecisionCtrl$dropdownReviewType", "2");
				outData.set("__EVENTTARGET", "DebtorDecisionCtrl$dropdownReviewType");

				response = await fetch(`https://${host}.view.civicacloud.com.au/Traffic/Debtors/Forms/DebtorDecisionReview.aspx`, {
					method: 'POST',
					body: outData
				});

				pageText = await response.text();
				// Update the review page with the new response
				reviewPage = parser.parseFromString(pageText, 'text/html');
			}
		}

		// Use standard DOM API to find the table
		const decisionTable = reviewPage.querySelector('#DebtorDecisionCtrl_DebtorNoticesTable_tblData > tbody');
		return decisionTable?.childNodes || null;
	} catch (error) {
		console.error("Error fetching review decision table:", error);
		return null;
	}
}

/**
 * Enables or disables form inputs based on a checkbox state
 */
function switcher(inputs: HTMLInputElement[], that: HTMLInputElement): void {
	for (let i = 0; i < inputs.length; i++) {
		inputs[i].disabled = !that.checked;
	}
}

// Export all functions to be used in other files
export {
	toggle,
	selectFVSHolds,
	selectPAHolds,
	selectEnforcementReview,
	compare,
	selectApplicable,
	getReviewDecisionTable,
	switcher,
	// Export the new function for direct rule application
	applySelectionRule
};