import * as XLSX from 'xlsx';
import { ObligationArray } from './types'; // Assuming your types are defined here

/**
 * Define the structure for a single column's configuration.
 */
interface ColumnConfig {
	header: string;
	width: number;
	isCurrency?: boolean;
	isDate?: boolean; // Added to support your new config
	name?: string;
}

// currencyFormat function remains the same...
function currencyFormat(worksheet: XLSX.WorkSheet, columnIndex: number, startRow = 1, endRow: null | number = null) {
	if (endRow === null) {
		const range = worksheet['!ref'] ? XLSX.utils.decode_range(worksheet['!ref']) : { e: { r: 0 } };
		endRow = range.e.r;
	}
	for (let row = startRow; row <= endRow; row++) {
		const cellAddress = XLSX.utils.encode_cell({ r: row, c: columnIndex });
		if (worksheet[cellAddress]) {
			const cell = worksheet[cellAddress];
			if (typeof cell.v === 'string') {
				const cleanValue = cell.v.replace(/[$\s,]/g, '');
				const numValue = parseFloat(cleanValue);
				if (!isNaN(numValue)) {
					cell.v = numValue;
					cell.t = 'n';
					cell.z = '$#,##0.00';
				}
			} else if (typeof cell.v === 'number') {
				cell.z = '$#,##0.00';
			}
		}
	}
	return worksheet;
}


/**
 * Exports a table of obligations to an Excel file using a detailed column configuration.
 */
export function table(data: ObligationArray, name: string, columns: ColumnConfig[]) {
	const wb = XLSX.utils.book_new();
	const sheetName = 'Obligations';
	const dataToExport = JSON.parse(JSON.stringify(data));
	const headers = columns.map(col => col.header);

	// --- ✅ EXPLICIT FILTERING STEP ---
	// Manually create a new array containing objects with only the specified keys.
	// This guarantees no extra fields will be included.
	const filteredData = dataToExport.map((row: Record<string, unknown>) => {
		const filteredRow: Record<string, unknown> = {};
		columns.forEach(col => {
			const sourceKey = col.name || col.header;
			const value = row[sourceKey];
			if (value !== undefined) {
				filteredRow[col.header] = value;
			}
		});
		return filteredRow;
	});

	// --- WORKSHEET CREATION ---
	// Pass the NEW filteredData to the function.
	const workSheet = XLSX.utils.json_to_sheet(filteredData, { header: headers });

	// --- DYNAMIC FORMATTING & FEATURES ---

	// 1. Set Column Widths
	workSheet['!cols'] = columns.map(col => ({
		wch: col.width
	}));

	// ✅ 2. Add AutoFilter capabilities to the header row
	if (workSheet['!ref']) {
		workSheet['!autofilter'] = { ref: workSheet['!ref'] };
	}

	// 3. Apply cell-specific formatting
	columns.forEach((col, index) => {
		if (col.isCurrency) {
			currencyFormat(workSheet, index);
		}
	});

	// --- FILE GENERATION ---
	XLSX.utils.book_append_sheet(wb, workSheet, sheetName);
	const b64 = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
	chrome.downloads.download({
		url: `data:application/octet-stream;base64,${b64}`,
		filename: `${name} Obligations.xlsx`
	});
}