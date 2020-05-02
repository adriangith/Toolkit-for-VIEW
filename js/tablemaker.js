String.prototype.trunc = String.prototype.trunc ||
      function(n){
          return (this.length > n) ? this.substr(0, n) + '' : this;
      };

function table(data, name) {
	config[4].active = false;
	var wb = XLSX.utils.book_new();

	var sheetName = 'Obligations'

	for(var i = 0; i < data.length; i++){
		var obj = data[i];
		for(var prop in obj){
			if(typeof obj[prop] === "string" && obj[prop].includes('$')) {
				obj[prop] = obj[prop].replace(/\$/g,'');
			}
			if(obj.hasOwnProperty(prop) && obj[prop] !== null && !isNaN(obj[prop])){
				if ((obj[prop] !== "" || typeof obj[prop] === Boolean) && prop !== "Infringement" && prop !== "Obligation") {
					console.log(prop);
					obj[prop] = +obj[prop];
				} 
			}
		}
	}
	
	data = JSON.parse(JSON.stringify(data, null, 2));

	var workSheet = XLSX.utils.json_to_sheet(data);

	var wscols = [
		{wch:10},
		{wch:10},
		{wch:20},
		{wch:45},
		{wch:8.5},
		{wch:8.5},
		{wch:9.5},
		{wch:9.5},
		{wch:2.5},
		{wch:9.5},
		{wch:9.5}
	];
	
	workSheet['!cols'] = wscols;

	function currencyFormat(column) {
		var C = XLSX.utils.decode_col(column); // 1
		var fmt = '$0.00'; // or '"$"#,##0.00_);[Red]\\("$"#,##0.00\\)' or any Excel number format
		
		/* get worksheet range */
		var range = XLSX.utils.decode_range(workSheet['!ref']);
		for(var i = range.s.r + 1; i <= range.e.r; ++i) {
		/* find the data cell (range.s.r + 1 skips the header row of the worksheet) */
		var ref = XLSX.utils.encode_cell({r:i, c:C});
		/* if the particular row did not contain data for the column, the cell will not be generated */
		if(!workSheet[ref]) continue;
		/* `.t == "n"` for number cells */
		if(workSheet[ref].t != 'n') continue;
		/* assign the `.z` number format */
		workSheet[ref].z = fmt;
		}
	}

	currencyColumns = ["E", "U", "V", "W","X","Y", "Z"]

	currencyColumns.map(column => currencyFormat(column))

	XLSX.utils.book_append_sheet(wb, workSheet, sheetName);
	XLSX.writeFile(wb, name + ' Obligations.xlsx', {bookType:'xlsx',  type: 'binary'});
}


async function table2(data, name) {
	config[4].active = false;
	const dataConfig = {
		filename: name + " Obligations",
	    sheet: {
			data: JsonToTable(data)
		}
	}
	console.log(dataConfig);
	zipcelx(dataConfig);
}

function JsonToTable(data) {
	tableArray = []
	lineArray = []
	Object.keys(data[0]).map(function(value) {
		lineArray.push({"value": value, "type": "string"})
	})
	tableArray.push(lineArray)
	for (line in data) {
		//line corresponds to the values for a single obligation.
		lineArray = []
		for (var key in data[line]) {
			let type = "string"
				
				lineArray.push({"value": data[line][key], "type": type})
		}
		tableArray.push(lineArray)
	}
	return tableArray
}

	
	

	

	

