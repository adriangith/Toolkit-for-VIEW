var opts = {
    lines: 13, // The number of lines to draw
    length: 38, // The length of each line
    width: 17, // The line thickness
    radius: 45, // The radius of the inner circle
    scale: .3, // Scales overall size of the spinner
    corners: 1, // Corner roundness (0..1)
    color: '#43088e', // CSS color or array of colors
    fadeColor: 'transparent', // CSS color or array of colors
    speed: 1, // Rounds per second
    rotate: 0, // The rotation offset
    animation: 'spinner-line-fade-default', // The CSS animation name for the lines
    direction: 1, // 1: clockwise, -1: counterclockwise
    zIndex: 2e9, // The z-index (defaults to 2000000000)
    className: 'spinner', // The CSS class to assign to the spinner
    top: '35px', // Top position relative to parent
    left: '50%', // Left position relative to parent
    shadow: '0 0 1px transparent', // Box-shadow for the lines
    position: 'relative' // Element positioning
};

async function bankruptcy() {
    const ph = `ctl00$mainContentPlaceHolder$taskSearchControl$`

    //Remove Address control
    document.getElementById("DebtorAddressCtrl").remove();

    //Make a template for controls
    const ctrlTemplate = (props) => `
    <table id="${props.Ctrl}" cellspacing="0" cellpadding="0" width="100%" class="Ctrl">
        <tbody>
            <tr>
                <td>
                    <div class="menu-header">
                        <span id="${props.header}" >${props.name}</span>
                    </div>
                    <div id="${props.body}">
                        <table class="bordertable">
                            <tbody>
                                <tr>
                                    <td class="tdRowspace"></td>
                                </tr>
                                <tr>
                                    <td id="${props.id}" style="padding:6px">
                                        <div class="placeholder" id="${props.id}1"></div>
                                        <table class="target"></table>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </td>
            </tr>
        </tbody>
    </table>`

    //Create debtor bankruptcy control
    const bankruptcyCtrl = ctrlTemplate({ Ctrl: "DebtorBankruptcyCtrl", id: "apps", header: "DebtorBankruptcyCtrl_lblDebtorBankruptcyNotifications", name: "Debtor: Bankruptcy Notifications", body: "DebtorBankruptcyCtrll_debtorBankruptcyNotification" })

    //Create register control
    const registerCtrl = ctrlTemplate({ Ctrl: "BankruptcyRegisterCtrl", id: "reg", header: "DebtorRegisterCtrl_lblBankrutcyRegister", name: "Bankruptcy Register", body: "DebtorRegisterCtrll_BankrutcyRegister" })

    //Get container for controls
    const dataArea = document.querySelector("td.dataArea")

    //Append debtor bankruptcy control to DOM
    dataArea.insertAdjacentHTML('beforeend', bankruptcyCtrl);

    //Append register control to DOM
    dataArea.insertAdjacentHTML('beforeend', registerCtrl);

    //Add buttons
    addButtons("#DebtorBankruptcyCtrl", "New Application")
    addButtons("#BankruptcyRegisterCtrl", "Check Holds")

    //Add spinner
    var regSpinner = new Spin.Spinner(opts).spin(document.getElementById("reg1"));
    var appsSpinner = new Spin.Spinner(opts).spin(document.getElementById("apps1"));

    //Get stateless task page
    let taskPage = await getHTMLDocument(`https://${document.location.host.split('.')[0]}.view.civicacloud.com.au/Taskflow/Forms/Management/TaskMaintenance.aspx?ProcessMode=User`, "get");

    //Get form data from task page
    let formData = getFormData(taskPage, {
        [`${ph}statusText`]: "OPEN",
        [`${ph}taskTypeText`]: "FVBANKRUPT",
        [`${ph}taskSearchButton.x`]: 0,
        [`${ph}taskSearchButton.y`]: 0
    })

    //Get stateful task page
    taskPage = await getHTMLDocument(`https://${document.location.host.split('.')[0]}.view.civicacloud.com.au/Taskflow/Forms/Management/TaskMaintenance.aspx?ProcessMode=User`, "post", formData);

    //Get full results if more than 5
    if (taskPage.querySelector('[id*="goToPageText"]') !== null) {
        formData = getFormData(taskPage, {
            [`${ph}goToPageText`]: "00",
            [`${ph}goToButton.x`]: 0,
            [`${ph}goToButton.y`]: 0
        })

        taskPage = await getHTMLDocument(`https://${document.location.host.split('.')[0]}.view.civicacloud.com.au/Taskflow/Forms/Management/TaskMaintenance.aspx?ProcessMode=User`, "post", formData);
    }

    //Sanitise table
    const table = sanitiseTable(taskPage.querySelector("#ctl00_mainContentPlaceHolder_taskSearchControl_taskSearchGrid"))

    //Convert table to array of objects
    let tableData = parseTable(table);

    //Remove white space and special characters from property keys
    tableData = tableData.map(function (row) {
        const newRow = {};
        Object.keys(row).forEach(function (key) {
            newRow[key.replace(/\.|\-|\?|[(]|\//g, "").replace(/\)/g, "").replace(/ /g, "").trim()] = row[key]
        });
        return newRow;
    });

    //Expand task description
    tableData = tableData.map(row => {
        const descriptionArray = row.Description.split(/:|,/);
        const descriptionObject = { "Status": "", "AFSA Reference": "", "Date of Bankruptcy": "" };
        let newRow = {};
        descriptionArray.some(function (item, index) {
            if (index % 2 === 0 && descriptionArray.length > 1) {
                descriptionObject[item.trim()] = descriptionArray[index + 1].trim();
            }
            return (index > 4);
        });
        descriptionObject["Date of Bankruptcy"] = descriptionObject["Date of Bankruptcy"].substring(0,10);
        newRow.TaskId = `<a href = 'https://${window.location.host.split('.')[0]}.view.civicacloud.com.au/Taskflow/Forms/Management/TaskMaintenance.aspx?TaskId=${row.TaskId}&ProcessMode=User'>${row.TaskId}</a>`;
        newRow.TaskIdRaw = row.TaskId;
        newRow.DebtorId = row.ModRef;
        newRow.ModRef = `<a href='javascript:document.getElementById("DebtorDetailsCtrl_DebtorIdSearch").value = ${row.ModRef}; document.getElementById("DebtorDetailsCtrl_debtorIdTextBoxButton").click()'>${row.ModRef}</a>`;
        newRow.TaskType = row.TaskType;
        return newRow = { ...newRow, ...descriptionObject }
    })

    $.fn.dataTable.moment('DD/MM/YYYY');

    //Create register datatable
    const registerDataTable = makeDataTable(tableData, "#reg > table", [
        { "data": "TaskId", "title": "Task Id" },
        { "data": "Status", "title": "Status", "width": "100%" },
        { "data": "AFSA Reference", "title": "AFSA Reference" },
        { "data": "Date of Bankruptcy", "title": "Date of Bankruptcy" },
        { "data": "ModRef", "title": "Debtor ID" },
        { "data": "DebtorId", "title": "DebtorId", "visible": false },
        { "data": "TaskIdRaw", "title": "TaskIdRaw", "visible": false },
    ], [
        {
            extend: 'excelHtml5',
            autoFilter: true,
            title: null,
            filename: function () {
                return "Bankruptcy and Debt Agreements Register - As of " + moment(new Date()).format("DD-MM-YYYY")
            },
            exportOptions: {
                columns: ':visible'
            }
        }
    ]);

    //Get rows, if any, that match current debtor id
    var indexes = registerDataTable.rows().eq(0).filter(function (rowIdx) {
        return registerDataTable.cell(rowIdx, 5).data() === document.getElementById("DebtorDetailsCtrl_DebtorIdSearch").value.trim() ? true : false;
    });

    //Extract the rows from the register data table that match current debtor id
    const debtorTable = registerDataTable.rows(indexes).data(0).toArray();

    //Create datatable for current debtor
    const debtorDataTable = makeDataTable(debtorTable, "#apps > table", [
        { "data": "TaskId", "title": "Task Id" },
        { "data": "Status", "title": "Status", "width": "100%" },
        { "data": "AFSA Reference", "title": "AFSA Reference" },
        { "data": "Date of Bankruptcy", "title": "Date of Bankruptcy" },
        { "data": null, "title": "Actions", "defaultContent": `<span class="updateButton mybutton" onClick='return false;'>Update</span>` }
    ], []);

    //Remove spinners
    document.querySelectorAll(".placeholder").forEach(element => element.remove())

    //Add gridheader class to table rows
    document.querySelectorAll(".target > thead > tr").forEach(element => element.className = "gridheader");

    document.querySelectorAll(".updateButton").forEach(element => {
        element.addEventListener("mouseup", function () {
            postData(
                {
                    taskNote: "updateBankruptcy",
                    source: document.location.host.split('.')[0],
                    debtorid: document.getElementById('DebtorDetailsCtrl_DebtorIdSearch').value,
                    taskId: element.parentElement.parentElement.firstElementChild.textContent,
                    pages: ["uploadDocuments", "bankruptcyDate", "removeHolds", "placeHolds", "liftProceduralHolds", "proceduralHolds", "taskNote", "application", "letter", "finish"]
                }
            )
        });
    });
}

bankruptcy();

async function getHTMLDocument(url, method, body) {
    let parser = new DOMParser();
    const opts = {
        method: method,
    }
    if (body) { opts.body = new URLSearchParams(body) }
    let res = await fetch(url, opts)
    let resText = await res.text()
    return (parser.parseFromString(resText, "text/html"));
}

function getFormData(parsedDocument, formDataToAppend) {
    const formData = new FormData(parsedDocument.querySelector('form'))
    for (let [key, value] of Object.entries(formDataToAppend)) {
        formData.set(key, value);
    }
    return formData;
}

function sanitiseTable(table) {
    const headerRow = table.firstElementChild.firstElementChild;
    const thead = document.createElement('thead');
    table.insertAdjacentElement('afterbegin', thead);
    thead.append(headerRow);
    return table
}

function setAttributes(el, attrs) {
    for (var key in attrs) {
        el.setAttribute(key, attrs[key]);
    }
}

function makeDataTable(tableData, target, columns, buttons) {
    const opts = {
        "data": tableData,
        "dom": 'rt<"clear"><"bottom"lpi>fB',
        "pageLength": 10,
        "lengthMenu": [
            [-1, 5, 10, 20, 30, 40, 50],
            [
                "All Records",
                "5 Records per page",
                "10 Records per page",
                "20 Records per page",
                "30 Records per page",
                "40 Records per page",
                "50 Records per page"
            ]
        ],
        "bFilter": false,
        "language": {
            "emptyTable": "No current notification of bankruptcy"
        },
        "oLanguage": {
            "sInfo": "<b>Results</b>: _START_-_END_ of _TOTAL_",
            "sLengthMenu": "_MENU_",
            "oPaginate": {
                "sNext": "Next >>",
                "sPrevious": "&lt&lt Last"
            },
        }
    }

    buttons && (opts.buttons = buttons)

    opts.columns = columns;

    const dataTable = $(document.querySelector(target)).DataTable(opts)
    return dataTable;
}

function postData(data) {
    chrome.runtime.sendMessage({
        validate: new URL(document.location).searchParams.get("mode"),
        data: data
    })
}

function addButtons(parentElement, buttonText) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    const button = document.createElement('span');
    tr.append(td);
    td.append(button);
    button.innerText = buttonText;
    setAttributes(button, {
        onclick: "return false",
        style: "cursor: hand",
        class: "mybutton"
    });
    setAttributes(td, {
        class: "tdButtons",
        align: "right"
    });
    document.querySelector(`${parentElement} .bordertable > tbody`).insertAdjacentElement('beforeend', tr);
    button.addEventListener("mouseup", function () {
        if (!confirm("Are you sure you wish to create a new bankruptcy task?")) return;
        postData({
            taskNote: "createBankruptcy",
            source: document.location.host.split('.')[0],
            debtorid: document.getElementById('DebtorDetailsCtrl_DebtorIdSearch').value,
            pages: ["bankruptcyDate", "removeHolds", "placeHolds", "liftProceduralHolds", "proceduralHolds", "letter", "uploadDocuments", "application", "debtorNote", "taskNote", "finish"]
        })
    });
}