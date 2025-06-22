import * as XLSX from 'xlsx';
import { ObligationArray, DerivedFieldName, ExtractedFieldName } from './types';

function currencyFormat(column: string, workSheet: XLSX.WorkSheet) {
	const C = XLSX.utils.decode_col(column); // 1
	const fmt = '$0.00'; // or '"$"#,##0.00_);[Red]\\("$"#,##0.00\\)' or any Excel number format

	/* get worksheet range */
	if (!workSheet['!ref']) return;
	const range = XLSX.utils.decode_range(workSheet['!ref']);
	for (let i = range.s.r + 1; i <= range.e.r; ++i) {
		/* find the data cell (range.s.r + 1 skips the header row of the worksheet) */
		const ref = XLSX.utils.encode_cell({ r: i, c: C });
		/* if the particular row did not contain data for the column, the cell will not be generated */
		if (!workSheet[ref]) continue;
		/* `.t == "n"` for number cells */
		if (workSheet[ref].t != 'n') continue;
		/* assign the `.z` number format */
		workSheet[ref].z = fmt;
	}
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

	const currencyColumns = ["E", "U", "V", "W", "X", "Y", "Z"]

	currencyColumns.map(column => currencyFormat(column, workSheet))

	XLSX.utils.book_append_sheet(wb, workSheet, sheetName);
	const b64 = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
	chrome.downloads.download({
		url: `data:application/octet-stream;base64,${b64}`,
		filename: name + ' Obligations.xlsx'
	});
}








