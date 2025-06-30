import { RowSelectionState, Updater } from "@tanstack/react-table";
import { DebtorSummaryObligationTable, VIEWDebtorSummaryObligation } from "./types";

export function handleSelectFVSHolds(_: string | null, table: DebtorSummaryObligationTable) {
    const selectRowFn = (row: VIEWDebtorSummaryObligation, newSelectionState: Updater<RowSelectionState>) => {
        if (row.HoldCodeEndDate && row.HoldCodeEndDate.includes("FVSPEND") && typeof newSelectionState === 'object') {
            newSelectionState[row.NoticeNumber] = true;
        }
    }

    selectRows(selectRowFn, _, table);
}

export function handleSelectPAHolds(_: string | null, table: DebtorSummaryObligationTable) {
    const selectRowFn = (row: VIEWDebtorSummaryObligation, newSelectionState: Updater<RowSelectionState>) => {
        // First uncheck all rows
        if (typeof newSelectionState === 'object') {
            newSelectionState[row.NoticeNumber] = false;
        }

        // Then check rows that have PAYARNGMNT hold code
        if (row.HoldCodeEndDate && row.HoldCodeEndDate.includes("PAYARNGMNT") && typeof newSelectionState === 'object') {
            newSelectionState[row.NoticeNumber] = true;
        }
    }

    selectRows(selectRowFn, _, table);
}

export function handleSelectEnforcementReview(_: string | null, table: DebtorSummaryObligationTable) {
    const selectRowFn = (row: VIEWDebtorSummaryObligation, newSelectionState: Updater<RowSelectionState>) => {
        // First uncheck all rows
        if (typeof newSelectionState === 'object') {
            newSelectionState[row.NoticeNumber] = false;
        }

        // Then check rows that have "Enforcement Review" in CurrentChallengeLogged
        if (row.CurrentChallengeLogged && row.CurrentChallengeLogged.includes("Enforcement Review") && typeof newSelectionState === 'object') {
            newSelectionState[row.NoticeNumber] = true;
        }
    }

    selectRows(selectRowFn, _, table);
}

export function handleSelectActionable(_: string | null, table: DebtorSummaryObligationTable) {
    const enforcementActionableStatuses = ["WARRNT", "NFDP", "SELNFD", "SELDEA"];
    const ESIOffences = ["2095", "1992", "1999", "1996", "1929", "1930", "1931", "1932", "1933", "1934", "1949", "1950", "1951", "1952", "1953", "1954", "0000"];

    const selectRowFn = (row: VIEWDebtorSummaryObligation, newSelectionState: Updater<RowSelectionState>) => {
        // Start with row unchecked
        let shouldSelect = false;

        // Check for enforcement review challenge logged
        if (row.CurrentChallengeLogged && row.CurrentChallengeLogged.includes("Enforcement Review")) {
            shouldSelect = true;
        }

        // Check for actionable statuses
        if (row.NoticeStatus) {
            for (const status of enforcementActionableStatuses) {
                if (row.NoticeStatus.includes(status)) {
                    shouldSelect = true;
                    break;
                }
            }
        }

        // Uncheck ineligible offenses
        if (row.ContraventionCode) {
            for (const offence of ESIOffences) {
                if (row.ContraventionCode.includes(offence)) {
                    shouldSelect = false;
                    break;
                }
            }
        }

        // Uncheck offences with balance of $0 or less
        if (row.BalanceOutstanding) {
            const balance = Number(row.BalanceOutstanding.replace(/[^0-9.-]+/g, ""));
            if (balance <= 0) {
                shouldSelect = false;
            }
        }

        // Apply final selection state
        if (typeof newSelectionState === 'object') {
            newSelectionState[row.NoticeNumber] = shouldSelect;
        }
    }

    selectRows(selectRowFn, _, table);
}

function selectRows(selectRowFn: (row: VIEWDebtorSummaryObligation, newSelectionState: Updater<RowSelectionState>) => void, _: string | null, table: DebtorSummaryObligationTable) {
    const allRows = table.options.data;

    /** Selection object. The desired state. */
    const newSelectionState: Updater<RowSelectionState> = {};

    allRows.forEach(row => {
        selectRowFn(row, newSelectionState);
    });

    table.setRowSelection(newSelectionState);
}
