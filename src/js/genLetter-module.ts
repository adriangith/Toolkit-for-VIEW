
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';
import ImageModule from 'open-docxtemplater-image-module';
import expressionParser from "docxtemplater/expressions.js";


window.addEventListener<"message">('message', async (event) => {
    const { data, template, letterType } = event.data
    console.log("geh", data, template, letterType)
    const correspondence = await makeLetter(data, template, letterType, ImageModuleInstance);
    window.parent.postMessage({ type: letterType, correspondence }, "*");
})


const opts = {
    getImage: async function (tagValue, tagName) {
        return await chrome.runtime.sendMessage<Message<ChromeStorage>>({ type: 'fetch', data: { key: "getImage" } }).then((res) => {
            return res;
        });
    },
    getSize: function (img, tagValue, tagName) {
        return [150, 150];
    }
}

const ImageModuleInstance = new ImageModule(opts)

/**
 * 
 * Currently only used for the bankruptcy letter
 */
export function downloadLetter(address, properties) {
    const addressArray = address.split(",");

    if (addressArray.length > 5) {
        addressArray[1] = `${addressArray[0]}${addressArray[1]}`;
        addressArray.shift();
    }

    const l = {
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
        "Debtor_ID": properties.debtorid
    }
    const reduced = properties.agencies.reduce((obj, item) => (obj[item.key] = item.value, obj), {});

    properties.allObligations.rows({ selected: true }).every(function (rowIdx, tableLoop, rowLoop) {
        const data = this.data();

        const types = ["1A", "1B", "1C", "2A"];
        const statuses = ["WARRNT", "CHLGLOG", "NFDP", "SELDEA"];
        if (String(data.Offence) === "0000") {
            properties.courtDetails;
            data.hearingDate = properties.courtDetails[data.NoticeNumber].hearingDate
            data.courtLocation = properties.courtDetails[data.NoticeNumber].courtLocation
            data.CaseRef = properties.courtDetails[data.NoticeNumber].CaseRef
        }
        data.agency = reduced[data.NoticeNumber];
        const bd = moment(properties.dateOfBankruptcy, "YYYY-MM-DD")
        const td = moment(data.OffenceDate, "DD/MM/YYYY")

        const balance = Number(data.BalanceOutstanding.replace(/[^0-9.-]+/g, ""));

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
    properties.filename = `${titleCase(properties.firstName)} ${titleCase(properties.lastName)} - Bankruptcy Confirmation`
    backgroundLetterMaker(l, properties, "https://trimwebdrawer.justice.vic.gov.au/record/13930494/File/document")
}

/**
 * 
 * Currently only used for the bankruptcy letter
 */
async function backgroundLetterMaker(letterData, properties, letterTemplateURL) {
    const letterTemplate = await loadLetter(letterTemplateURL)
    /* Create a letter for each of the objects in letterData */
    const letter = makeLetter(letterData, letterTemplate, properties.filename)
}

function angularParser(tag) {

    if (tag === '.') {
        return {
            get: function (s) { return s; }
        }
    }

    /*  if (tag.includes('%')) {
        return {
            'get': function (scope) { return scope[tag] }
        }
    }*/

    const expr = expressionParser.compile(tag.replace(/(’|“|”)/g, "'"));

    return {
        get: function (s) {
            return expr(s);
        }
    }
}

export async function makeLetter(content, letterTemplate, filename, imageModule) {
    const zip = new PizZip((await letterTemplate).split(',')[1], { base64: true });
    const doc = new Docxtemplater(zip,
        {
            modules: [imageModule],
            parser: angularParser,
        })

    console.log(content)


    try {
        // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
        doc.render(content);
    }
    catch (error) {
        const e = {
            message: error.message,
            name: error.name,
            stack: error.stack,
            properties: error.properties,
        }
        // console.log(JSON.stringify({ error: e }));
        // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
        throw error;
    }
    const out = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }) //Output the document using Data-URI    
    return out
}

const toDate = (dateStr = "2000-01-01") => {
    const [day, month, year] = dateStr.split("-").reverse()
    return new Date(year, month - 1, day)
}

function titleCase(string) {
    const sentence = string.trim().toLowerCase().split(" ");
    for (let i = 0; i < sentence.length; i++) {
        sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1);
    }
    return sentence.join(" ");
}
