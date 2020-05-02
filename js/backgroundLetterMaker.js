const streamSaver = window.streamSaver

  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (sender.url === chrome.runtime.getURL("popup/index.html")) {
            backgroundLetterMaker(request.letterData);
        }
    });

async function backgroundLetterMaker(letterData) {
  const letterTemplate = await loadLetter("https://vicgov-my.sharepoint.com/:w:/g/personal/adrian_zafir_justice_vic_gov_au/ESsFQWxRwARJlVXJs8g4B68Bqfpsrwu3htSA9q0g2keHIA?download=1")
  //const letterTemplate = await loadLetter("https://trimwebdrawer.justice.vic.gov.au/record/13809148/File/document")
  /* Create a letter for each of the objects in letterData */
  const mergedLetter = makeLetter(letterData, letterTemplate)
  console.log(mergedLetter);
}

function makeLetter(content, letterTemplate) {
    var zip = new JSZip(letterTemplate);
    var doc=new window.Docxtemplater().loadZip(zip)
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
          console.log(JSON.stringify({error: e}));
    // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
    throw error;
      }
    var out=doc.getZip().generate({
      type:"blob",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }) //Output the document using Data-URI    
    saveAs(out, "output.docx")
}

function loadLetter(url){
    return new Promise((resolve, reject) => {
      JSZipUtils.getBinaryContent(url, function(err, data) {
        if(err) {
            throw err; // or handle err
        }
        data = resolve(data);
        return data;
      });
    });
  }

var expressions = require('angular-expressions');

function angularParser(tag) {
    if (tag === '.') {
        return {
            get: function(s){ return s;}
        }
    }
    const expr = expressions.compile(tag.replace(/(’|“|”)/g, "'"));
    return {
        get: function(s) {
            return expr(s);
        }
    }
}