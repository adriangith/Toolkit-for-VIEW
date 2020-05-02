document.getElementById('myfile').addEventListener("change", handleFiles);

async function handleFiles() {
  /* Get file, read file, and convert to arrayBuffer */
  const file = this.files[0]
  function readFile(file){
    return new Promise((resolve, reject) => {
      var fr = new FileReader();  
      fr.onload = () => {
        resolve(fr.result)
      };
      fr.readAsArrayBuffer(file);
    });
  }
  const arrayBuffer = await readFile(file)
  let data = new Uint8Array(arrayBuffer)

  /* Get workbook */
  let workbook = XLSX.read(data, {type: "array"});

  /* Get worksheet */
  let first_sheet_name = workbook.SheetNames[0];
  let worksheet = workbook.Sheets[first_sheet_name];

  /* Convert worksheet to Json */
  let JsonData = XLSX.utils.sheet_to_json(worksheet, { raw: true });

  /* Group by Debtor id and convert to an array */
  let grouped = groupBy(JsonData, "DebtorID");
  groupedArray = [];
  
  for (key in grouped) {
    let element = {
      DebtorID: grouped[key][0].DebtorID,
      GivenName: grouped[key][0].GivenName,
      FamilyName: grouped[key][0].FamilyName,
      Mstreet: grouped[key][0].Mstreet,
      MTown: grouped[key][0].MTown,
      MState: grouped[key][0].MState,
      MPostCode: grouped[key][0].MPostCode,
      a: grouped[key]
    };
   
    groupedArray.push(element);
  }
  
  chrome.runtime.sendMessage({"letterData": { "letter": groupedArray }}, function(response) {});
}

function groupBy(arr, property) {
  return arr.reduce(function(memo, x) {
    if (!memo[x[property]]) { memo[x[property]] = []; }
    memo[x[property]].push(x);
    return memo;
  }, {});
}

document.getElementById('myfile').addEventListener("change", handleFiles);