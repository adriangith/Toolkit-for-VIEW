// Configuration object for the different row selection rules
export type ProcessorRule = {
    name: string;
    description: string;
    filter: (cellsInfo: CellsInfo) => boolean;
};

export type CellsInfo = Record<string, Element | null>;

// Rules configuration object
export const selectionRules: Record<string, ProcessorRule> = {
    fvsHolds: {
        name: "FVSPEND Holds",
        description: "Select all rows with FVSPEND holds",
        filter: (cellsInfo) => Boolean(cellsInfo.holdStatusCell?.textContent?.includes("FVSPEND"))
    },

    paymentArrangements: {
        name: "Payment Arrangements",
        description: "Select all rows with PAYARNGMNT holds",
        filter: (cellsInfo) => Boolean(cellsInfo.holdStatusCell?.textContent?.includes("PAYARNGMNT"))
    },

    enforcementReview: {
        name: "Enforcement Reviews",
        description: "Select all rows with Enforcement Review challenge",
        filter: (cellsInfo) => Boolean(cellsInfo.currentChallengeLoggedCell?.textContent?.includes("Enforcement Review"))
    },

    applicableRows: {
        name: "Applicable Notices",
        description: "Select applicable notices based on multiple criteria",
        filter: (cellsInfo) => {
            const enforcementActionableStatuses: string[] = ["WARRNT", "NFDP", "SELNFD", "SELDEA"];
            const ESIOffences: string[] = ["2095", "1992", "1999", "1996", "1929", "1930", "1931", "1932", "1933", "1934", "1949", "1950", "1951", "1952", "1953", "1954", "0000"];

            let shouldCheck = false;

            // Check enforcement review
            if (cellsInfo.currentChallengeLoggedCell?.textContent?.includes("Enforcement Review")) {
                shouldCheck = true;
            }

            // Check actionable statuses
            if (cellsInfo.noticeStatusCell?.textContent) {
                for (const status of enforcementActionableStatuses) {
                    if (cellsInfo.noticeStatusCell.textContent.indexOf(status) > -1) {
                        shouldCheck = true;
                    }
                }
            }

            // Uncheck ineligible offenses
            if (cellsInfo.contraventionCodeCell?.textContent) {
                for (const offence of ESIOffences) {
                    if (cellsInfo.contraventionCodeCell.textContent.indexOf(offence) > -1) {
                        shouldCheck = false;
                    }
                }
            }

            // Uncheck zero/negative balances
            if (cellsInfo.balanceOutstandingCell?.textContent) {
                const balance = Number(cellsInfo.balanceOutstandingCell.textContent.replace(/[^0-9.-]+/g, ""));
                if (balance <= 0) {
                    shouldCheck = false;
                }
            }

            return shouldCheck;
        }
    }
};