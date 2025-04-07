import { makeLetter } from '../js/genLetter-module.js';
const opts = {};


MicroModal.init();
document.getElementById('run-mail-merge').addEventListener('mouseup', async () => {
    let formData = new FormData(document.getElementById('Mail-merge-form'));
    let object = {};
    for (let [key, value] of formData) {
        object[key] = value
    }
    console.log(object);
    let debtorObligations;
    if (object["data-list-source"] === "data-list-url") {
        debtorObligations = await fetch(object['data-list-url'])
            .then(response => response.blob())
            .then(async blob => {
                const workbook = XLSX.read(await blob.arrayBuffer(), { type: 'array' })
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const JSONData = XLSX.utils.sheet_to_json(worksheet, { raw: true });
                const debtorObligations = Object.values(groupBy(removeWhitespace(JSONData), "DebtorID"));
                debtorObligations.forEach(letterData => {
                    if (letterData.BarcodeValue !== undefined) {
                        JsBarcode("#barcode", letterData.BarcodeValue);
                        letterData.image = document.getElementById("barcode").src;
                    }
                })
                return debtorObligations
            }
            );
    } else {
        debtorObligations = await object['data-list-local'].arrayBuffer().then(resp => {
            let ui8 = new Uint8Array(resp);
            const workbook = XLSX.read([...ui8], { type: 'array' })
            //  const workbook = XLSX.read([...ui8], { type: 'array', cellText:false, cellDates:true })
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const JSONData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
            // const JSONData = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF:'dd"/"mm"/"yyyy' });
            const debtorObligations = Object.values(groupBy(amendDate(removeWhitespace(JSONData)), "DebtorID"));
            debtorObligations.forEach(letterData => {
                if (letterData.BarcodeValue !== undefined) {
                    JsBarcode("#barcode", letterData.BarcodeValue);
                    letterData.image = document.getElementById("barcode").src;
                }
            })
            return debtorObligations
        })
    }
    let template;
    if (object["template-source"] === "template-url") {
        template = await loadLetter(object['template-url-text'])
    } else {
        template = await object['template-local-file'].arrayBuffer().then(resp => {
            let ui8 = new Uint8Array(resp);
            return [...ui8]
        })
    }

    opts.fileType = "docx"

    opts.getImage = function (tagValue, tagName) {
        const base64Regex = /^data:image\/(png|jpg|svg|svg\+xml);base64,/;
        if (!base64Regex.test(tagValue)) {
            return false;
        }
        const stringBase64 = tagValue.replace(base64Regex, "");
        let binaryString;
        if (typeof window !== "undefined") {
            binaryString = window.atob(stringBase64);
        } else {
            binaryString = new Buffer(stringBase64, "base64").toString("binary");
        }
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            const ascii = binaryString.charCodeAt(i);
            bytes[i] = ascii;
        }
        return bytes.buffer;
    }

    opts.getSize = function (img, tagValue, tagName) {
        return [105, 60];
    }
    var imageModule = new ImageModule(opts);

    makeLetter({ "content": debtorObligations }, template, object['save-name'], imageModule)
})

function groupBy(arr, property) {
    return arr.reduce(function (array, x) {
        const ob = array.find(item => item[property] === x[property]);
        if (ob === undefined) array.push({ ...x, a: [x] })
        else ob.a.push(x);
        return array;
    }, []);
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

function removeWhitespace(JSONarray) {
    return JSONarray.map(object => {
        const newObject = {}
        for (var [key, value] of Object.entries(object)) {
            newObject[key.trim()] = value.trim();
        }
        return newObject;
    })
}

function amendDate(JSONarray) {
    return JSONarray.map(object => {
        const newObject = {}
        for (var [key, value] of Object.entries(object)) {
            const dateCheck = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{1,2})$/) 
            if (dateCheck === null) {
                newObject[key] = value;
            } else {
                newObject[key] = `${dateCheck[2]}/${dateCheck[1]}/${dateCheck[3]}`;
            }
        }
        return newObject;
    })
}

document.getElementById("template-local-label").addEventListener("mouseup", radio => {
    document.getElementById("template-local-file").style.display = 'block';
    document.getElementById("template-url-text").style.display = 'none';
})

document.getElementById("template-url-label").addEventListener("mouseup", radio => {
    document.getElementById("template-local-file").style.display = 'none';
    document.getElementById("template-url-text").style.display = 'block';
})

document.getElementById("data-list-local-label").addEventListener("mouseup", radio => {
    document.getElementById("data-list-local-file").style.display = 'none';
    document.getElementById("data-list-url-text").style.display = 'block';
})

document.getElementById("data-list-url-label").addEventListener("mouseup", radio => {
    document.getElementById("data-list-local-file").style.display = 'block';
    document.getElementById("data-list-url-text").style.display = 'none';
})

function persistInput(input) {
    var key = "input-" + input.id;
    var storedValue = localStorage.getItem(key);
    console.log(storedValue);
    if (storedValue) {
        input.value = storedValue;
    }

    input.addEventListener('input', function () {
        localStorage.setItem(key, input.value);
    });
}


persistInput(document.getElementById("template-url-text"))
persistInput(document.getElementById("data-list-url-text"))
persistInput(document.getElementById("save-name"))

