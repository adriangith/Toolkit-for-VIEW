import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import expressionParser from "docxtemplater/expressions.js";
import { Opts } from 'docxtemplater-image-module-pwndoc';
import ImageModule from 'docxtemplater-image-module-pwndoc';
import { Message } from "./types";


window.addEventListener<"message">('message', async (event) => {
    const { dataSet, base64Template, correspondenceDescription } = event.data
    const correspondence = await makeLetter(dataSet, base64Template, correspondenceDescription, ImageModuleInstance);
    window.parent.postMessage({ type: correspondenceDescription, correspondence }, "*");
})


const opts: Opts = {
    getImage: async function () {
        return await chrome.runtime.sendMessage<Message>({ type: 'fetch', data: { key: "getImage" } }).then((res) => {
            return res;
        });
    },
    getSize: function () {
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
async function backgroundLetterMaker(letterData: Record<string, unknown>, properties, letterTemplateURL) {
    const letterTemplate = await loadLetter(letterTemplateURL)
    /* Create a letter for each of the objects in letterData */
    const letter = makeLetter(letterData, letterTemplate, properties.filename)
}

export async function makeLetter(content: Record<string, unknown>, letterTemplate: string, filename: string, imageModule: ImageModule) {
    const zip = new PizZip((await letterTemplate).split(',')[1], { base64: true });
    const doc = new Docxtemplater(zip,
        {
            modules: [imageModule],
            parser: expressionParser,
        })

    // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
    doc.render(content);

    const out = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }) //Output the document using Data-URI    
    return out
}

const toDate = (dateStr = "2000-01-01") => {
    const [day, month, year] = dateStr.split("-").reverse()
    return new Date(Number(year), Number(month) - 1, Number(day))
}

function titleCase(string: string) {
    const sentence = string.trim().toLowerCase().split(" ");
    for (let i = 0; i < sentence.length; i++) {
        sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1);
    }
    return sentence.join(" ");
}
