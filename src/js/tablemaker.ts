import * as XLSX from 'xlsx';
import { ObligationArray, DerivedFieldName, ExtractedFieldName } from './types';

/**
 * Formats a column in a SheetJS worksheet as currency (USD with commas and 2 decimal places)
 * @param {Object} worksheet - The SheetJS worksheet object
 * @param {number} columnIndex - Zero-based column index (0 = A, 1 = B, 2 = C, etc.)
 * @param {number} startRow - Starting row index (0-based, typically 1 to skip headers)
 * @param {number} endRow - Ending row index (0-based, optional - will use worksheet range if not provided)
 * @returns {Object} The modified worksheet object
 */
function currencyFormat(worksheet: XLSX.WorkSheet, columnIndex: number, startRow = 1, endRow: null | number = null) {
	// Get the worksheet range if endRow is not provided
	if (endRow === null) {
		const range = worksheet['!ref'] ? XLSX.utils.decode_range(worksheet['!ref']) : { e: { r: 0 } };
		endRow = range.e.r;
	}

	// Format each cell in the specified column range
	for (let row = startRow; row <= endRow; row++) {
		const cellAddress = XLSX.utils.encode_cell({ r: row, c: columnIndex });

		if (worksheet[cellAddress]) {
			const cell = worksheet[cellAddress];

			// Handle currency strings like "$395.00" or "$ 395.00"
			if (typeof cell.v === 'string') {
				// Remove $ symbol, spaces, and commas, then parse as float
				const cleanValue = cell.v.replace(/[$\s,]/g, '');
				const numValue = parseFloat(cleanValue);

				if (!isNaN(numValue)) {
					cell.v = numValue;        // Set the actual numeric value
					cell.t = 'n';            // Set cell type to number
					cell.z = '$#,##0.00';    // Apply currency format
				}
			}
			// Handle case where it's already a number
			else if (typeof cell.v === 'number') {
				cell.z = '$#,##0.00';
			}
		}
	}

	return worksheet;
}

function isKeyOf<T extends object>(obj: T, key: string | symbol): key is keyof T {
	return key in obj;
}

/** Exports a table of obligations to an Excel file.
* @param data - The array of obligations to be exported.
*/
export function table(data: ObligationArray, name: string, columns: (DerivedFieldName | ExtractedFieldName)[]) {
	/** Workbook object for exporting data.*/
	const wb = XLSX.utils.book_new();

	/** Name of the worksheet to be created. */
	const sheetName = 'Obligations'

	data = JSON.parse(JSON.stringify(data, null, 2));

	// remove any properties that are not in the columns array
	data = data.map((item) => {
		return Object.fromEntries(
			Object.entries(item).filter(([key]) => columns.includes(key))
		);
	});

	const sortedData = data.map(obj =>
		Object.fromEntries(
			columns
				.filter(col => obj.hasOwnProperty(col))
				.map(col => [col, obj[col]])
		)
	);

	const workSheet = XLSX.utils.json_to_sheet(sortedData);

	const wscols = [
		{ wch: 10 },
		{ wch: 10 },
		{ wch: 20 },
		{ wch: 45 },
		{ wch: 8.5 },
		{ wch: 8.5 },
		{ wch: 9.5 },
		{ wch: 9.5 },
		{ wch: 2.5 },
		{ wch: 9.5 },
		{ wch: 9.5 }
	];

	workSheet['!cols'] = wscols;

	const currencyColumns = ["E", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]

	currencyColumns.map(column => currencyFormat(workSheet, XLSX.utils.decode_col(column)))

	XLSX.utils.book_append_sheet(wb, workSheet, sheetName);
	const b64 = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
	chrome.downloads.download({
		url: `data:application/octet-stream;base64,${b64}`,
		filename: name + ' Obligations.xlsx'
	});
}








