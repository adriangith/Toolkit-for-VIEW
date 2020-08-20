let tmnotices =  document.getElementById('Cell_Notices');
tmbulkupdate = tmnotices.cloneNode(true);
tmnotices.after(tmbulkupdate);
tmbulkupdate.id = 'Cell_Bulk_Update';
let tmbul = tmbulkupdate.querySelector('span > a');
tmbul.textContent = "Bulk Update";
let tmbulArray = tmbul.href.split('/')
tmbulArray[tmbulArray.length - 1] = 'BulkUpdateMain.aspx';
tmbul.href = tmbulArray.join('/');
