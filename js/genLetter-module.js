let expressions = require('angular-expressions');

export function downloadLetter(address, properties) {
    let addressArray = address.split(",");

    if (addressArray.length > 5) {
        addressArray[1] = `${addressArray[0]}${addressArray[1]}`;
        addressArray.shift();
    }

    let l = {
        "provable": [],
        "courtFines": [],
        "nonProvable": [],
        "zeroBalance": [],
        "dateOfBankruptcy": toDate(properties.dateOfBankruptcy).toLocaleString('en-au', { day: 'numeric', month: 'long', year: 'numeric' }),
        "bankruptcynotificationdate": toDate(document.getElementById('noteDate').value).toLocaleString('en-au', { day: 'numeric', month: 'long', year: 'numeric' }),
        "First_Name": properties.firstName,
        "Last_Name": properties.lastName,
        "Address_1": addressArray[0].trim(),
        "Town": addressArray[1].trim(),
        "State": addressArray[2].trim(),
        "Post_Code": addressArray[3].trim(),
        "Debtor_ID": properties.debtorId
    }
    let reduced = properties.agencies.reduce((obj, item) => (obj[item.key] = item.value, obj), {});

    properties.allObligations.rows({ selected: true }).every(function (rowIdx, tableLoop, rowLoop) {
        let data = this.data();

        const types = ["1A", "1B", "1C", "2A"];
        const statuses = ["WARRNT", "CHLGLOG", "NFDP"];
        if (String(data.Offence) === "0000") {
            properties.courtDetails;
            data.hearingDate = properties.courtDetails[data.NoticeNumber].hearingDate
            data.courtLocation = properties.courtDetails[data.NoticeNumber].courtLocation
            data.CaseRef = properties.courtDetails[data.NoticeNumber].CaseRef
        }
        data.agency = reduced[data.NoticeNumber];
        let bd = moment(properties.dateOfBankruptcy, "YYYY-MM-DD")
        let td = moment(data.OffenceDate, "DD/MM/YYYY")

        let balance = Number(data.BalanceOutstanding.replace(/[^0-9.-]+/g, ""));

        (balance <= 0) &&
            (l.zeroBalance.push(data)) ||
            (bd.isAfter(td)) &&
            (types.some(type => data.InputType === type)) &&
            (statuses.some(status => data.NoticeStatusPreviousStatus.includes(status))) &&
            (l.provable.push(data)) ||
            (data.Offence === "0000") &&
            (l.courtFines.push(data)) ||
            (statuses.some(status => data.NoticeStatusPreviousStatus.includes(status))) &&
            (l.nonProvable.push(data));

    })
    backgroundLetterMaker(l, properties)
}

function angularParser(tag) {
    if (tag === '.') {
        return {
            get: function (s) { return s; }
        }
    }
    const expr = expressions.compile(tag.replace(/(’|“|”)/g, "'"));
    return {
        get: function (s) {
            return expr(s);
        }
    }
}

async function backgroundLetterMaker(letterData, properties) {
    const letterTemplate = await loadLetter("https://trimwebdrawer.justice.vic.gov.au/record/13930494/File/document")
    /* Create a letter for each of the objects in letterData */
    const letter = makeLetter(letterData, letterTemplate, properties)
}

function makeLetter(content, letterTemplate, properties) {
    var zip = new JSZip(letterTemplate);
    var doc = new window.Docxtemplater().loadZip(zip)
    doc.setOptions({
        parser: angularParser
    })

    doc.setData(content);
    try {
        // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
        doc.render()
    }
    catch (error) {
        var e = {
            message: error.message,
            name: error.name,
            stack: error.stack,
            properties: error.properties,
        }
        console.log(JSON.stringify({ error: e }));
        // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
        throw error;
    }
    var out = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }) //Output the document using Data-URI    
    saveAs(out, `${titleCase(properties.firstName)} ${titleCase(properties.lastName)} - Bankruptcy Confirmation.docx`)
    //window.close()
}

function loadLetter(url) {
    return new Promise((resolve, reject) => {
        JSZipUtils.getBinaryContent(url, function (err, data) {
            if (err) {
                throw err; // or handle err
            }
            data = resolve(data);
            return data;
        });
    });
}

const toDate = (dateStr = "2000-01-01") => {
    const [day, month, year] = dateStr.split("-").reverse()
    return new Date(year, month - 1, day)
}

function titleCase(string) {
    var sentence = string.toLowerCase().split(" ");
    for (var i = 0; i < sentence.length; i++) {
        sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1);
    }
    return sentence.join(" ");
}
