import * as XLSX from 'xlsx';

/**
  * Fetches an XLSX file and converts its first sheet to a { ColA: ColB } object.
  */
async function fetchWorkbook(url: string): Promise<XLSX.WorkBook> {
    if (typeof XLSX === 'undefined') {
        throw new Error("SheetJS library (XLSX) not found.");
    }
    const response = await chrome.runtime.sendMessage({
        type: 'fetch',
        data: [url],
        method: 'GET'
    });


    const commaIndex = response.indexOf(',');

    console.log("Spreadsheet data fetched.");
    const workbook = XLSX.read(response.substring(commaIndex + 1), { type: 'base64' });
    console.log("Workbook parsed.");
    return workbook;
}

/**
 * Helper function to fetch an XLSX file and parse its first sheet.
 * Returns the headers and data rows separately.
 *
 * @param {string} url - The URL of the XLSX file.
 * @param {boolean} rawValues - If true, use raw cell values; otherwise, use formatted strings (e.g., 'TRUE').
 * @returns {Promise<{ headers: any[], dataRows: any[][] }>} Headers and data rows.
 * @throws {Error} If fetching or parsing fails.
 */
async function fetchAndParseSheet(sheet: string, workbook: XLSX.WorkBook): Promise<{ headers: string[], dataRows: (string)[][] }> {
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
        throw new Error("Workbook contains no sheets.");
    }
    console.log(`Processing sheet: ${sheet || firstSheetName}`);
    const worksheet = workbook.Sheets[sheet || firstSheetName];

    // Use raw: rawValues option based on parameter
    const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1, defval: null, raw: false });

    if (rows.length === 0) {
        console.warn(`Sheet '${firstSheetName}' is empty.`);
        return { headers: [], dataRows: [] }; // Return empty arrays if sheet is empty
    }

    const headers = rows[0];
    const dataRows = rows.slice(1); // All rows except the header

    return { headers, dataRows };
}

export async function initialiseWorkbookProcesser(
    WorkbookURL: string
) {

    const workbook = await fetchWorkbook(WorkbookURL);

    async function fetchAndProcessOptions(sheet: string): Promise<OptionsResult[]> {
        // We need formatted strings ('TRUE'/'FALSE'), so use raw: false
        const { headers, dataRows } = await fetchAndParseSheet(sheet, workbook);

        if (!headers || headers.length === 0) {
            console.warn("Sheet has no header row.");
            return [];
        }
        if (dataRows.length === 0) {
            console.warn("Sheet has no data rows.");
            return [];
        }

        const result: OptionsResult[] = [];
        const hasEnoughColumnsForLetters = headers.length >= 3;

        for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];
            if (!row || row.length === 0 || row[0] === null || row[0] === undefined || String(row[0]).trim() === '') {
                // console.warn(`Skipping data row ${i + 1}: No description in Column A.`);
                continue;
            }

            const description = String(row[0]);
            const letters: string[] = [];

            if (hasEnoughColumnsForLetters) {
                for (let j = 1; j < headers.length; j++) { // Start from Col B (index 1)
                    const cellValue = row[j];
                    if (cellValue && typeof cellValue === 'string' && cellValue.trim().toLowerCase() === 'true') {
                        letters.push(String(headers[j])); // Ensure header is string
                    }
                }
            }

            result.push({ description, letters });
        }
        console.log(`Options processing complete. Processed: ${result.length} valid rows.`);
        return result;
    }

    async function fetchAndConvertXlsxToJson<S extends string, C extends string | undefined = undefined, R = C extends string ? Record<string, string> : Record<string, string>[]>({
        Sheet,
        Column
    }: {
        Sheet: S,
        Column?: C
    }): Promise<R> {
        const { headers, dataRows } = await fetchAndParseSheet(Sheet, workbook);

        if (dataRows.length === 0) {
            console.warn('Spreadsheet has no data rows.');
            if (!Column) {
                const emptyArray: Record<string, string>[] = [];
                return emptyArray as R;
            }
            const emptyObject: Record<string, string> = {};
            return emptyObject as R;
        }


        // If no column is specified, return array of objects with headers as keys
        if (!Column) {
            const result: Record<string, string>[] = [];
            let rowsProcessed = 0;
            let rowsSkipped = 0;

            for (let i = 0; i < dataRows.length; i++) {
                const row = dataRows[i];
                if (!row) {
                    rowsSkipped++;
                    continue;
                }

                const rowObject: Record<string, string> = {};
                let hasValidData = false;

                // Map each cell in the row to its corresponding header
                headers.forEach((header, index) => {
                    if (header) {
                        const value = row[index];
                        if (value !== undefined) {
                            rowObject[header] = value;
                            hasValidData = true;
                        }
                    }
                });

                // Only add rows that have at least some valid data
                if (hasValidData) {
                    result.push(rowObject);
                    rowsProcessed++;
                } else {
                    rowsSkipped++;
                }
            }

            console.log(`Object array conversion complete. Processed: ${rowsProcessed}, Skipped: ${rowsSkipped}`);
            return result as R;
        }

        // Original functionality for when Column is specified
        const resultObject: Record<string, string> = {};
        let rowsProcessed = 0;
        let rowsSkipped = 0;

        if (!headers || headers.length === 0) {
            console.warn("No headers found in the sheet.");
            const emptyObject: Record<string, string> = {};
            return emptyObject as R;
        }

        const columnIndex = headers.indexOf(Column);
        if (columnIndex === -1) {
            throw new Error(`Column '${Column}' not found in the sheet.`);
        }

        for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];
            if (!row) {
                rowsSkipped++;
                continue;
            }

            const key = row[0];
            const value = row[columnIndex];

            if (key !== null && key !== undefined && String(key).trim() !== '') {
                const keyStr = String(key);
                resultObject[keyStr] = value;
                rowsProcessed++;
            } else {
                rowsSkipped++;
            }
        }

        console.log(`Key/Value conversion complete. Processed: ${rowsProcessed}, Skipped: ${rowsSkipped}`);
        return resultObject as R;
    }

    return { fetchAndProcessOptions, fetchAndConvertXlsxToJson };
}

// --- Your New Function (using the helper) ---
export interface OptionsResult {
    description: string;
    letters: string[];
    recipient?: boolean;
}

