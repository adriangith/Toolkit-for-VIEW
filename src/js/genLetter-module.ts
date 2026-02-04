import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import expressionParser from "docxtemplater/expressions.js";
import { Opts } from 'docxtemplater-image-module-pwndoc';
import ImageModule from 'docxtemplater-image-module-pwndoc';
import { GenerateDocumentMessage, Message } from "./types";

/**
 * Handle incoming generation requests from the parent window.
 */
window.addEventListener('message', async (event: MessageEvent<GenerateDocumentMessage>) => {
    if (event.data.type !== 'generate-document') return;
    const { dataSet, base64Template, correspondenceDescription } = event.data.data;

    // cast dataSet to Record<string, unknown> as expected by docxtemplater
    const correspondence = await makeLetter(
        dataSet as unknown as Record<string, unknown>,
        base64Template,
        correspondenceDescription,
        ImageModuleInstance
    );

    window.parent.postMessage({ type: correspondenceDescription, correspondence }, "*");
});

const opts: Opts = {
    getImage: async function () {
        // Fix: Changed type to 'fetchBase64' to align with types.d.ts definition
        return await chrome.runtime.sendMessage<Message>({
            type: 'fetchBase64',
            data: ["getImage"] // Corrected data format for fetchParams
        });
    },
    getSize: function () {
        return [150, 150];
    }
};

const ImageModuleInstance = new ImageModule(opts);

/**
 * Helper to load binary templates
 */
async function loadLetter(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read blob"));
        reader.readAsDataURL(blob);
    });
}

/**
 * Specialized logic for bankruptcy confirmation letters.
 */
export async function downloadLetter(address: string, properties: Record<string, unknown>) {
    const addressArray = address.split(",");

    if (addressArray.length > 5) {
        addressArray[1] = `${addressArray[0]}${addressArray[1]}`;
        addressArray.shift();
    }

    const noteDateEl = document.getElementById('noteDate') as HTMLInputElement | null;
    const notificationDate = noteDateEl ? toDate(noteDateEl.value) : new Date();

    const l: Record<string, unknown> = {
        "provable": [] as Record<string, unknown>[],
        "courtFines": [] as Record<string, unknown>[],
        "nonProvable": [] as Record<string, unknown>[],
        "zeroBalance": [] as Record<string, unknown>[],
        "dateOfBankruptcy": toDate(properties.dateOfBankruptcy as string).toLocaleString('en-au', { day: 'numeric', month: 'long', year: 'numeric' }),
        "bankruptcynotificationdate": notificationDate.toLocaleString('en-au', { day: 'numeric', month: 'long', year: 'numeric' }),
        "First_Name": properties.firstName as string,
        "Last_Name": properties.lastName as string,
        "Address_1": addressArray[0]?.trim() || "",
        "Town": addressArray[1]?.trim() || "",
        "State": addressArray[2]?.trim() || "",
        "Post_Code": addressArray[3]?.trim() || "",
        "Debtor_ID": properties.debtorid as string
    };

    const agencies = (properties.agencies as { key: string; value: string }[]) || [];
    const reduced = agencies.reduce((acc: Record<string, string>, item) => {
        acc[item.key] = item.value;
        return acc;
    }, {});

    // Iterate through selected obligations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (properties.allObligations as any).rows({ selected: true }).every(function (this: any) {
        const data = this.data();
        const types = ["1A", "1B", "1C", "2A"];
        const statuses = ["WARRNT", "CHLGLOG", "NFDP", "SELDEA"];

        if (String(data.Offence) === "0000") {
            const courtDetails = properties.courtDetails as Record<string, Record<string, string>> | undefined;
            const court = courtDetails?.[data.NoticeNumber as string];
            if (court) {
                data.hearingDate = court.hearingDate;
                data.courtLocation = court.courtLocation;
                data.CaseRef = court.CaseRef;
            }
        }

        data.agency = reduced[data.NoticeNumber as string];

        // Use native date comparison instead of missing moment library
        const bd = toDate(properties.dateOfBankruptcy as string);
        const [d, m, y] = (data.OffenceDate as string || "").split("/");
        const td = new Date(Number(y), Number(m) - 1, Number(d));

        const balance = parseFloat(String(data.BalanceOutstanding || "0").replace(/[^0-9.-]+/g, ""));

        // Logic split for readability and type safety
        if (balance <= 0) {
            (l.zeroBalance as Record<string, unknown>[]).push(data);
        } else if (bd > td && types.includes(data.InputType as string) && statuses.some(s => (data.NoticeStatusPreviousStatus as string)?.includes(s))) {
            (l.provable as Record<string, unknown>[]).push(data);
        } else if (data.Offence === "0000") {
            (l.courtFines as Record<string, unknown>[]).push(data);
        } else if (statuses.some(s => (data.NoticeStatusPreviousStatus as string)?.includes(s))) {
            (l.nonProvable as Record<string, unknown>[]).push(data);
        }
        return true;
    });

    properties.filename = `${titleCase(properties.firstName as string)} ${titleCase(properties.lastName as string)} - Bankruptcy Confirmation`;
    await backgroundLetterMaker(l, properties, "https://trimwebdrawer.justice.vic.gov.au/record/13930494/File/document");
}

async function backgroundLetterMaker(letterData: Record<string, unknown>, properties: Record<string, unknown>, letterTemplateURL: string) {
    const letterTemplate = await loadLetter(letterTemplateURL);
    await makeLetter(letterData, letterTemplate, properties.filename as string, ImageModuleInstance);
}

async function makeLetter(content: Record<string, unknown>, letterTemplate: string, filename: string, imageModule: ImageModule) {
    const base64Data = letterTemplate.includes(',') ? letterTemplate.split(',')[1] : letterTemplate;
    const zip = new PizZip(base64Data, { base64: true });

    const doc = new Docxtemplater(zip, {
        modules: [imageModule],
        parser: expressionParser,
    });

    doc.render(content);

    const out = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    return out;
}

const toDate = (dateStr: string = "2000-01-01"): Date => {
    // Basic support for YYYY-MM-DD or simple strings
    const parts = dateStr.split("-");
    if (parts.length === 3) {
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    return new Date(dateStr);
};

function titleCase(str: string = ""): string {
    return str.trim().toLowerCase().split(" ").map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(" ");
}