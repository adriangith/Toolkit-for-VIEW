import * as XLSX from 'xlsx';
import { fetchParams } from './types'

/**
  * Fetches an XLSX file and converts its first sheet to a { ColA: ColB } object.
  */
async function fetchWorkbook(url: string): Promise<XLSX.WorkBook> {
    if (typeof XLSX === 'undefined') {
        throw new Error("SheetJS library (XLSX) not found.");
    }

    const response = await chrome.runtime.sendMessage<fetchParams>({
        type: 'fetchBase64',
        data: [url, {
            method: 'GET',
        }],
    });

    // Check for error responses
    if (response && typeof response === 'object' && response.error) {
        if (response.error === 'CORS') {
            throw new Error('CORS error: Unable to fetch the workbook due to cross-origin restrictions.');
        } else {
            throw new Error(`Fetch error: ${response.error}`);
        }
    }

    // Check if response is valid
    if (!response || typeof response !== 'string') {
        throw new Error('Invalid response: Expected base64 data string.');
    }

    const commaIndex = response.indexOf(',');

    // Check if base64 data format is valid
    if (commaIndex === -1) {
        throw new Error('Invalid response format: Expected data URL with base64 content.');
    }

    console.log("Spreadsheet data fetched.");

    try {
        const workbook = XLSX.read(response.substring(commaIndex + 1), { type: 'base64' });
        console.log("Workbook parsed.");
        return workbook;
    } catch (error) {
        throw new Error(`Failed to parse workbook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
async function fetchAndParseSheet(sheet: string, workbook: XLSX.WorkBook): Promise<{ headers: string[], dataRows: (string | null)[][] }> {
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
        throw new Error("Workbook contains no sheets.");
    }
    console.log(`Processing sheet: ${sheet || firstSheetName}`);
    const worksheet = workbook.Sheets[sheet || firstSheetName];

    if (!worksheet || !worksheet['!ref']) { // Handle case of empty or undefined sheet/range
        console.warn(`Sheet '${sheet || firstSheetName}' is empty or has no data range.`);
        return { headers: [], dataRows: [] };
    }

    // Get rows with formatted values (respects raw:false, defval:null)
    // sheet_to_json with header:1 returns (any)[][], effectively (string | number | boolean | null)[][]
    // With raw:false, most types are formatted to strings. We assume (string | null)[][] is the effective type here.
    const rows: (string | null)[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, raw: false });

    // Iterate through the rows and cells to replace display values with hyperlink targets where applicable
    const range = XLSX.utils.decode_range(worksheet['!ref']); // Get sheet range

    for (let i = 0; i < rows.length; ++i) { // `i` is the 0-indexed row number in the `rows` array
        const sheetRowIndex = range.s.r + i; // Actual row index in the XLSX sheet
        const currentRow = rows[i];
        if (!currentRow) continue; // Should not typically occur with header:1

        for (let j = 0; j < currentRow.length; ++j) { // `j` is the 0-indexed col number in the `rows[i]` array
            const sheetColIndex = range.s.c + j; // Actual col index in the XLSX sheet
            const cellAddress = XLSX.utils.encode_cell({ r: sheetRowIndex, c: sheetColIndex });
            const cell = worksheet[cellAddress]; // Get the raw cell object

            if (cell && cell.l && cell.l.Target) {
                let linkTarget: string = cell.l.Target;
                const sharePointPatternMatch = linkTarget.match(/(\.\.\/)*(:[wls]:)/);
                if (sharePointPatternMatch) {
                    linkTarget = new URL(linkTarget, 'https://vicgov.sharepoint.com/').href;
                }
                rows[i][j] = linkTarget;
            }
        }
    }

    if (rows.length === 0) {
        console.warn(`Sheet '${sheet || firstSheetName}' is effectively empty after processing.`);
        return { headers: [], dataRows: [] };
    }

    // Extract headers (first row). Convert nulls in header to empty strings.
    const headers: string[] = rows[0] ? rows[0].map(h => h === null ? "" : String(h)) : [];
    // Extract data rows (all rows except the header)
    const dataRows: (string | null)[][] = rows.slice(1);

    return { headers, dataRows };
}

export async function initialiseWorkbookProcesser(
    WorkbookURL: string
) {

    const workbook = await fetchWorkbook(WorkbookURL);

    /**
     * Fetches and processes the "Options" sheet to retrieve correspondence options and their associated templates.
     *
     * @remarks
     * Expects the sheet to contain a column named "description" for option names,
     * with each option potentially linked to an array of letter templates.
     *
     * @returns An array of options, each with a description and an array of templates (letters).
     *
     * @throws Will throw an error if the "Options" sheet cannot be fetched or processed.
     *
     * @example
     * const options = await fetchAndProcessOptions('Sheet1');
     * console.log(options);
     * // Output: [{ description: 'Option 1', letters: ['A', 'B'] }, ...]
     */
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

    async function fetchAndConvertXlsxToJson<M extends Record<string, string>, C extends string | undefined = undefined, S extends string = string, R = C extends string ? M : M[]>({
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
                            rowObject[header] = value || '';
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
                resultObject[keyStr] = value || '';;
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

