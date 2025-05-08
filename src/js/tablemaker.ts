import * as XLSX from 'xlsx';

export function table(data: Record<string, string | number | boolean>[], name: string) { // Changed data type to string[]
	//config[4].active = false;
	const wb = XLSX.utils.book_new();

	const sheetName = 'Obligations'

	for (let i = 0; i < data.length; i++) {
		const obj = data[i];
		for (const prop in obj) {
			if (typeof obj[prop] === "string" && obj[prop].includes('$')) {
				obj[prop] = obj[prop].replace(/\$/g, '');
			}
			if (Object.prototype.hasOwnProperty.call(obj, prop) && obj[prop] !== null) {
				if ((obj[prop] !== "" || typeof obj[prop] === "boolean") && prop !== "Infringement" && prop !== "Obligation") {
					console.log(prop);
					obj[prop] = +obj[prop];
				}
			}
		}
	}

	data = JSON.parse(JSON.stringify(data, null, 2));

	const workSheet = XLSX.utils.json_to_sheet(data);

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

	function currencyFormat(column: string) {
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

	const currencyColumns = ["E", "U", "V", "W", "X", "Y", "Z"]

	currencyColumns.map(column => currencyFormat(column))

	XLSX.utils.book_append_sheet(wb, workSheet, sheetName);
	XLSX.writeFile(wb, name + ' Obligations.xlsx', { bookType: 'xlsx', type: 'binary' });
}








