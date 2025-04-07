function DocxMerger(options, files) {

    this._body = [];
    this._header = [];
    this._footer = [];
    this._Basestyle = options.style || 'source';
    this._style = [];
    this._numbering = [];
    this._pageBreak = typeof options.pageBreak !== 'undefined' ? !!options.pageBreak : true;
    this._files = [];
    var self = this;
    (files || []).forEach(function(file) {
        self._files.push(new JSZip(file));
    });
    this._contentTypes = {};

    this._media = {};
    this._rel = {};

    this._builder = this._body;

    this.insertPageBreak = function() {
        var pb = '<w:p> \
					<w:r> \
						<w:br w:type="page"/> \
					</w:r> \
				  </w:p>';

        this._builder.push(pb);
    };

    this.insertRaw = function(xml) {

        this._builder.push(xml);
    };

    this.mergeBody = function(files) {

        var self = this;
        this._builder = this._body;

        mergeContentTypes(files, this._contentTypes);
        prepareMediaFiles(files, this._media);
        mergeRelations(files, this._rel);

        prepareNumbering(files);
        mergeNumbering(files, this._numbering);

        prepareStyles(files, this._style);
        mergeStyles(files, this._style);

        files.forEach(function(zip, index) {
            //var zip = new JSZip(file);
            var xml = zip.file("word/document.xml").asText();
            xml = xml.substring(xml.indexOf("<w:body>") + 8);
            xml = xml.substring(0, xml.indexOf("</w:body>"));
            xml = xml.substring(0, xml.lastIndexOf("<w:sectPr"));

            self.insertRaw(xml);
            if (self._pageBreak && index < files.length-1)
                self.insertPageBreak();
        });
    };

    this.save = function(type, callback) {

        var zip = this._files[0];

        var xml = zip.file("word/document.xml").asText();
        var startIndex = xml.indexOf("<w:body>") + 8;
        var endIndex = xml.lastIndexOf("<w:sectPr");

        xml = xml.replace(xml.slice(startIndex, endIndex), this._body.join(''));

        generateContentTypes(zip, this._contentTypes);
        copyMediaFiles(zip, this._media, this._files);
        generateRelations(zip, this._rel);
        generateNumbering(zip, this._numbering);
        generateStyles(zip, this._style);

        zip.file("word/document.xml", xml);

        callback(zip.generate({ 
            type: type,
            compression: "DEFLATE",
            compressionOptions: {
                level: 4
            }
        }));
    };


    if (this._files.length > 0) {

        this.mergeBody(this._files);
    }
}

var mergeContentTypes = function(files, _contentTypes) {


    files.forEach(function(zip) {
        // var zip = new JSZip(file);
        var xmlString = zip.file("[Content_Types].xml").asText();
        var xml = new DOMParser().parseFromString(xmlString, 'text/xml');

        var childNodes = xml.getElementsByTagName('Types')[0].childNodes;

        for (var node in childNodes) {
            if (/^\d+$/.test(node) && childNodes[node].getAttribute) {
                var contentType = childNodes[node].getAttribute('ContentType');
                if (!_contentTypes[contentType])
                    _contentTypes[contentType] = childNodes[node].cloneNode();
            }
        }

    });
};

var mergeRelations = function(files, _rel) {

    files.forEach(function(zip) {
        // var zip = new JSZip(file);
        var xmlString = zip.file("word/_rels/document.xml.rels").asText();
        var xml = new DOMParser().parseFromString(xmlString, 'text/xml');

        var childNodes = xml.getElementsByTagName('Relationships')[0].childNodes;

        for (var node in childNodes) {
            if (/^\d+$/.test(node) && childNodes[node].getAttribute) {
                var Id = childNodes[node].getAttribute('Id');
                if (!_rel[Id])
                    _rel[Id] = childNodes[node].cloneNode();
            }
        }

    });
};

var generateContentTypes = function(zip, _contentTypes) {
    // body...
    var xmlString = zip.file("[Content_Types].xml").asText();
    var xml = new DOMParser().parseFromString(xmlString, 'text/xml');
    var serializer = new XMLSerializer();

    var types = xml.documentElement.cloneNode();

    for (var node in _contentTypes) {
        types.appendChild(_contentTypes[node]);
    }

    var startIndex = xmlString.indexOf("<Types");
    xmlString = xmlString.replace(xmlString.slice(startIndex), serializer.serializeToString(types));

    zip.file("[Content_Types].xml", xmlString);
};

var generateRelations = function(zip, _rel) {
    // body...
    var xmlString = zip.file("word/_rels/document.xml.rels").asText();
    var xml = new DOMParser().parseFromString(xmlString, 'text/xml');
    var serializer = new XMLSerializer();

    var types = xml.documentElement.cloneNode();

    for (var node in _rel) {
        types.appendChild(_rel[node]);
    }

    var startIndex = xmlString.indexOf("<Relationships");
    xmlString = xmlString.replace(xmlString.slice(startIndex), serializer.serializeToString(types));

    zip.file("word/_rels/document.xml.rels", xmlString);
};

var prepareMediaFiles = function(files, media) {

    var count = 1;

 files.forEach(function(zip, index) {
     // var zip = new JSZip(file);
     var medFiles = zip.folder("word/media").files;

     for (var mfile in medFiles) {
         if (/^word\/media/.test(mfile) && mfile.length > 11) {
             // console.log(mfile);
             media[count] = {};
             media[count].oldTarget = mfile;
             media[count].newTarget = mfile.replace(/[0-9]/, '_' + count).replace('word/', "");
             media[count].fileIndex = index;
             updateMediaRelations(zip, count, media);
             updateMediaContent(zip, count, media);
             count++;
         }
     }
 });

 // console.log(JSON.stringify(media));

 // this.updateRelation(files);
};

var updateMediaRelations = function(zip, count, _media) {

 var xmlString = zip.file("word/_rels/document.xml.rels").asText();
 var xml = new DOMParser().parseFromString(xmlString, 'text/xml');

 var childNodes = xml.getElementsByTagName('Relationships')[0].childNodes;
 var serializer = new XMLSerializer();

 for (var node in childNodes) {
     if (/^\d+$/.test(node) && childNodes[node].getAttribute) {
         var target = childNodes[node].getAttribute('Target');
         if ('word/' + target == _media[count].oldTarget) {

             _media[count].oldRelID = childNodes[node].getAttribute('Id');

             childNodes[node].setAttribute('Target', _media[count].newTarget);
             childNodes[node].setAttribute('Id', _media[count].oldRelID + '_' + count);
         }
     }
 }

 // console.log(serializer.serializeToString(xml.documentElement));

 var startIndex = xmlString.indexOf("<Relationships");
 xmlString = xmlString.replace(xmlString.slice(startIndex), serializer.serializeToString(xml.documentElement));

 zip.file("word/_rels/document.xml.rels", xmlString);

 // console.log( xmlString );
};

var updateMediaContent = function(zip, count, _media) {

 var xmlString = zip.file("word/document.xml").asText();
 var xml = new DOMParser().parseFromString(xmlString, 'text/xml');

 xmlString = xmlString.replace(new RegExp(_media[count].oldRelID + '"', 'g'), _media[count].oldRelID + '_' + count + '"');

 zip.file("word/document.xml", xmlString);
};

var copyMediaFiles = function(base, _media, _files) {

 for (var media in _media) {
     var content = _files[_media[media].fileIndex].file(_media[media].oldTarget).asUint8Array();

     base.file('word/' + _media[media].newTarget, content);
 }
};

var prepareNumbering = function(files) {

    var serializer = new XMLSerializer();

    files.forEach(function(zip, index) {
        var xmlBin = zip.file('word/numbering.xml');
        if (!xmlBin) {
            return;
        }
        var xmlString = xmlBin.asText();
        var xml = new DOMParser().parseFromString(xmlString, 'text/xml');
        var nodes = xml.getElementsByTagName('w:abstractNum');

        for (var node in nodes) {
            if (/^\d+$/.test(node) && nodes[node].getAttribute) {
                var absID = nodes[node].getAttribute('w:abstractNumId');
                nodes[node].setAttribute('w:abstractNumId', absID + index);
                var pStyles = nodes[node].getElementsByTagName('w:pStyle');
                for (var pStyle in pStyles) {
                    if (pStyles[pStyle].getAttribute) {
                        var pStyleId = pStyles[pStyle].getAttribute('w:val');
                        pStyles[pStyle].setAttribute('w:val', pStyleId + '_' + index);
                    }
                }
                var numStyleLinks = nodes[node].getElementsByTagName('w:numStyleLink');
                for (var numstyleLink in numStyleLinks) {
                    if (numStyleLinks[numstyleLink].getAttribute) {
                        var styleLinkId = numStyleLinks[numstyleLink].getAttribute('w:val');
                        numStyleLinks[numstyleLink].setAttribute('w:val', styleLinkId + '_' + index);
                    }
                }

                var styleLinks = nodes[node].getElementsByTagName('w:styleLink');
                for (var styleLink in styleLinks) {
                    if (styleLinks[styleLink].getAttribute) {
                        var styleLinkId = styleLinks[styleLink].getAttribute('w:val');
                        styleLinks[styleLink].setAttribute('w:val', styleLinkId + '_' + index);
                    }
                }

            }
        }

        var numNodes = xml.getElementsByTagName('w:num');

        for (var node in numNodes) {
            if (/^\d+$/.test(node) && numNodes[node].getAttribute) {
                var ID = numNodes[node].getAttribute('w:numId');
                numNodes[node].setAttribute('w:numId', ID + index);
                var absrefID = numNodes[node].getElementsByTagName('w:abstractNumId');
                for (var i in absrefID) {
                    if (absrefID[i].getAttribute) {
                        var iId = absrefID[i].getAttribute('w:val');
                        absrefID[i].setAttribute('w:val', iId + index);
                    }
                }


            }
        }



        var startIndex = xmlString.indexOf("<w:numbering ");
        xmlString = xmlString.replace(xmlString.slice(startIndex), serializer.serializeToString(xml.documentElement));

        zip.file("word/numbering.xml", xmlString);
        // console.log(nodes);
    });
};

var mergeNumbering = function(files, _numbering) {

    // this._builder = this._style;

    // console.log("MERGE__STYLES");


    files.forEach(function(zip) {
        var xmlBin = zip.file('word/numbering.xml');
        if (!xmlBin) {
          return;
        }
        var xml = xmlBin.asText();

        xml = xml.substring(xml.indexOf("<w:abstractNum "), xml.indexOf("</w:numbering"));

        _numbering.push(xml);

    });
};

var generateNumbering = function(zip, _numbering) {
    var xmlBin = zip.file('word/numbering.xml');
    if (!xmlBin) {
      return;
    }
    var xml = xmlBin.asText();
    var startIndex = xml.indexOf("<w:abstractNum ");
    var endIndex = xml.indexOf("</w:numbering>");

    // console.log(xml.substring(startIndex, endIndex))

    xml = xml.replace(xml.slice(startIndex, endIndex), _numbering.join(''));

    // console.log(xml.substring(xml.indexOf("</w:docDefaults>")+16, xml.indexOf("</w:styles>")))
    // console.log(this._style.join(''))
    // console.log(xml)

    zip.file("word/numbering.xml", xml);
};

var prepareStyles = function(files, style) {
    // var self = this;
    // var style = this._styles;
    var serializer = new XMLSerializer();

    files.forEach(function(zip, index) {
        console.log('prepare');
        var xmlString = zip.file("word/styles.xml").asText();
        var xml = new DOMParser().parseFromString(xmlString, 'text/xml');
        var nodes = xml.getElementsByTagName('w:style');

        for (var node in nodes) {
            if (/^\d+$/.test(node) && nodes[node].getAttribute) {
                var styleId = nodes[node].getAttribute('w:styleId');
                nodes[node].setAttribute('w:styleId', styleId + '_' + index);
                var basedonStyle = nodes[node].getElementsByTagName('w:basedOn')[0];
                if (basedonStyle) {
                    var basedonStyleId = basedonStyle.getAttribute('w:val');
                    basedonStyle.setAttribute('w:val', basedonStyleId + '_' + index);
                }

                var w_next = nodes[node].getElementsByTagName('w:next')[0];
                if (w_next) {
                    var w_next_ID = w_next.getAttribute('w:val');
                    w_next.setAttribute('w:val', w_next_ID + '_' + index);
                }

                var w_link = nodes[node].getElementsByTagName('w:link')[0];
                if (w_link) {
                    var w_link_ID = w_link.getAttribute('w:val');
                    w_link.setAttribute('w:val', w_link_ID + '_' + index);
                }

                var numId = nodes[node].getElementsByTagName('w:numId')[0];
                if (numId) {
                    var numId_ID = numId.getAttribute('w:val');
                    numId.setAttribute('w:val', numId_ID + index);
                }

                updateStyleRel_Content(zip, index, styleId);
            }
        }

        var startIndex = xmlString.indexOf("<w:styles ");
        xmlString = xmlString.replace(xmlString.slice(startIndex), serializer.serializeToString(xml.documentElement));

        zip.file("word/styles.xml", xmlString);
        // console.log(nodes);
    });
};

var mergeStyles = function(files, _styles) {

    files.forEach(function(zip) {
        console.log('merge');
        var xml = zip.file("word/styles.xml").asText();

        xml = xml.substring(xml.indexOf("<w:style "), xml.indexOf("</w:styles"));

        _styles.push(xml);

    });
};

var updateStyleRel_Content = function(zip, fileIndex, styleId) {


    var xmlString = zip.file("word/document.xml").asText();
    var xml = new DOMParser().parseFromString(xmlString, 'text/xml');

    xmlString = xmlString.replace(new RegExp('w:val="' + styleId + '"', 'g'), 'w:val="' + styleId + '_' + fileIndex + '"');

    // zip.file("word/document.xml", "");

    zip.file("word/document.xml", xmlString);
};

var generateStyles = function(zip, _style) {
    var xml = zip.file("word/styles.xml").asText();
    var startIndex = xml.indexOf("<w:style ");
    var endIndex = xml.indexOf("</w:styles>");

    // console.log(xml.substring(startIndex, endIndex))

    xml = xml.replace(xml.slice(startIndex, endIndex), _style.join(''));

    // console.log(xml.substring(xml.indexOf("</w:docDefaults>")+16, xml.indexOf("</w:styles>")))
    // console.log(this._style.join(''))
    // console.log(xml)

    zip.file("word/styles.xml", xml);
};