(function (f) { if (typeof exports === "object" && typeof module !== "undefined") { module.exports = f() } else if (typeof define === "function" && define.amd) { define([], f) } else { var g; if (typeof window !== "undefined") { g = window } else if (typeof global !== "undefined") { g = global } else if (typeof self !== "undefined") { g = self } else { g = this } g.Docxtemplater = f() } })(function () {
  var define, module, exports; return (function () { function r(e, n, t) { function o(i, f) { if (!n[i]) { if (!e[i]) { var c = "function" == typeof require && require; if (!f && c) return c(i, !0); if (u) return u(i, !0); var a = new Error("Cannot find module '" + i + "'"); throw a.code = "MODULE_NOT_FOUND", a } var p = n[i] = { exports: {} }; e[i][0].call(p.exports, function (r) { var n = e[i][1][r]; return o(n || r) }, p, p.exports, r, e, n, t) } return n[i].exports } for (var u = "function" == typeof require && require, i = 0; i < t.length; i++)o(t[i]); return o } return r })()({
    1: [function (require, module, exports) {
      "use strict";

      module.exports = {
        XMLSerializer: window.XMLSerializer,
        DOMParser: window.DOMParser,
        XMLDocument: window.XMLDocument
      };
    }, {}], 2: [function (require, module, exports) {
      "use strict";

      function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

      var _require = require('./browser-versions/xmldom.js'),
        DOMParser = _require.DOMParser,
        XMLSerializer = _require.XMLSerializer;

      var _require2 = require("./errors"),
        throwXmlTagNotFound = _require2.throwXmlTagNotFound;

      var _require3 = require("./utils"),
        last = _require3.last,
        first = _require3.first;

      function parser(tag) {
        return _defineProperty({}, "get", function get(scope) {
          if (tag === ".") {
            return scope;
          }

          return scope[tag];
        });
      }

      function getNearestLeftIndex(parsed, elements, index) {
        for (var i = index; i >= 0; i--) {
          var part = parsed[i];

          for (var j = 0, len = elements.length; j < len; j++) {
            var element = elements[j];

            if (isStarting(part.value, element)) {
              return j;
            }
          }
        }

        return null;
      }

      function getNearestRightIndex(parsed, elements, index) {
        for (var i = index, l = parsed.length; i < l; i++) {
          var part = parsed[i];

          for (var j = 0, len = elements.length; j < len; j++) {
            var element = elements[j];

            if (isEnding(part.value, element)) {
              return j;
            }
          }
        }

        return -1;
      }

      function getNearestLeft(parsed, elements, index) {
        var found = getNearestLeftIndex(parsed, elements, index);

        if (found !== -1) {
          return elements[found];
        }

        return null;
      }

      function getNearestRight(parsed, elements, index) {
        var found = getNearestRightIndex(parsed, elements, index);

        if (found !== -1) {
          return elements[found];
        }

        return null;
      }

      function buildNearestCache(postparsed, tags) {
        return postparsed.reduce(function (cached, part, i) {
          if (part.type === "tag" && tags.indexOf(part.tag) !== -1) {
            cached.push({
              i: i,
              part: part
            });
          }

          return cached;
        }, []);
      }

      function getNearestLeftIndexWithCache(index, cache) {
        if (cache.length === 0) {
          return -1;
        }

        for (var i = 0, len = cache.length; i < len; i++) {
          var current = cache[i];
          var next = cache[i + 1];

          if (current.i < index && (!next || index < next.i) && current.part.position === "start") {
            return i;
          }
        }

        return -1;
      }

      function getNearestLeftWithCache(index, cache) {
        var found = getNearestLeftIndexWithCache(index, cache);

        if (found !== -1) {
          return cache[found].part.tag;
        }

        return null;
      }

      function getNearestRightIndexWithCache(index, cache) {
        if (cache.length === 0) {
          return -1;
        }

        for (var i = 0, len = cache.length; i < len; i++) {
          var current = cache[i];
          var _last = cache[i - 1];

          if (index < current.i && (!_last || _last.i < index) && current.part.position === "end") {
            return i;
          }
        }

        return -1;
      }

      function getNearestRightWithCache(index, cache) {
        var found = getNearestRightIndexWithCache(index, cache);

        if (found !== -1) {
          return cache[found].part.tag;
        }

        return null;
      }

      function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
      }

      function startsWith(str, prefix) {
        return str.substring(0, prefix.length) === prefix;
      }

      function unique(arr) {
        var hash = {},
          result = [];

        for (var i = 0, l = arr.length; i < l; ++i) {
          if (!hash.hasOwnProperty(arr[i])) {
            hash[arr[i]] = true;
            result.push(arr[i]);
          }
        }

        return result;
      }

      function chunkBy(parsed, f) {
        return parsed.reduce(function (chunks, p) {
          var currentChunk = last(chunks);
          var res = f(p);

          if (currentChunk.length === 0) {
            currentChunk.push(p);
            return chunks;
          }

          if (res === "start") {
            chunks.push([p]);
          } else if (res === "end") {
            currentChunk.push(p);
            chunks.push([]);
          } else {
            currentChunk.push(p);
          }

          return chunks;
        }, [[]]).filter(function (p) {
          return p.length > 0;
        });
      }

      var defaults = {
        nullGetter: function nullGetter(part) {
          if (!part.module) {
            return "undefined";
          }

          if (part.module === "rawxml") {
            return "";
          }

          return "";
        },
        xmlFileNames: [],
        parser: parser,
        linebreaks: false,
        delimiters: {
          start: "{",
          end: "}"
        }
      };

      function mergeObjects() {
        var resObj = {};
        var obj, keys;

        for (var i = 0; i < arguments.length; i += 1) {
          obj = arguments[i];
          keys = Object.keys(obj);

          for (var j = 0; j < keys.length; j += 1) {
            resObj[keys[j]] = obj[keys[j]];
          }
        }

        return resObj;
      }

      function xml2str(xmlNode) {
        var a = new XMLSerializer();
        return a.serializeToString(xmlNode).replace(/xmlns(:[a-z0-9]+)?="" ?/g, "");
      }

      function str2xml(str) {
        if (str.charCodeAt(0) === 65279) {
          // BOM sequence
          str = str.substr(1);
        }

        var parser = new DOMParser();
        return parser.parseFromString(str, "text/xml");
      }

      var charMap = {
        "&": "&amp;",
        "'": "&apos;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;"
      };

      function escapeRegExp(str) {
        // to be able to use a string as a regex
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }

      var charMapRegexes = Object.keys(charMap).map(function (endChar) {
        var startChar = charMap[endChar];
        return {
          rstart: new RegExp(escapeRegExp(startChar), "g"),
          rend: new RegExp(escapeRegExp(endChar), "g"),
          start: startChar,
          end: endChar
        };
      });

      function wordToUtf8(string) {
        var r;

        for (var i = 0, l = charMapRegexes.length; i < l; i++) {
          r = charMapRegexes[i];
          string = string.replace(r.rstart, r.end);
        }

        return string;
      }

      function utf8ToWord(string) {
        if (typeof string !== "string") {
          string = string.toString();
        }

        var r;

        for (var i = 0, l = charMapRegexes.length; i < l; i++) {
          r = charMapRegexes[i];
          string = string.replace(r.rend, r.start);
        }

        return string;
      } // This function is written with for loops for performance


      function concatArrays(arrays) {
        var result = [];

        for (var i = 0; i < arrays.length; i++) {
          var array = arrays[i];

          for (var j = 0, len = array.length; j < len; j++) {
            result.push(array[j]);
          }
        }

        return result;
      }

      var spaceRegexp = new RegExp(String.fromCharCode(160), "g");

      function convertSpaces(s) {
        return s.replace(spaceRegexp, " ");
      }

      function pregMatchAll(regex, content) {
        /* regex is a string, content is the content. It returns an array of all matches with their offset, for example:
           regex=la
           content=lolalolilala
        returns: [{array: {0: 'la'},offset: 2},{array: {0: 'la'},offset: 8},{array: {0: 'la'} ,offset: 10}]
        */
        var matchArray = [];
        var match;

        while ((match = regex.exec(content)) != null) {
          matchArray.push({
            array: match,
            offset: match.index
          });
        }

        return matchArray;
      }

      function isEnding(value, element) {
        return value === "</" + element + ">";
      }

      function isStarting(value, element) {
        return value.indexOf("<" + element) === 0 && [">", " "].indexOf(value[element.length + 1]) !== -1;
      }

      function getRight(parsed, element, index) {
        var val = getRightOrNull(parsed, element, index);

        if (val !== null) {
          return val;
        }

        throwXmlTagNotFound({
          position: "right",
          element: element,
          parsed: parsed,
          index: index
        });
      }

      function getRightOrNull(parsed, elements, index) {
        if (typeof elements === "string") {
          elements = [elements];
        }

        var level = 1;

        for (var i = index, l = parsed.length; i < l; i++) {
          var part = parsed[i];

          for (var j = 0, len = elements.length; j < len; j++) {
            var element = elements[j];

            if (isEnding(part.value, element)) {
              level--;
            }

            if (isStarting(part.value, element)) {
              level++;
            }

            if (level === 0) {
              return i;
            }
          }
        }

        return null;
      }

      function getLeft(parsed, element, index) {
        var val = getLeftOrNull(parsed, element, index);

        if (val !== null) {
          return val;
        }

        throwXmlTagNotFound({
          position: "left",
          element: element,
          parsed: parsed,
          index: index
        });
      }

      function getLeftOrNull(parsed, elements, index) {
        if (typeof elements === "string") {
          elements = [elements];
        }

        var level = 1;

        for (var i = index; i >= 0; i--) {
          var part = parsed[i];

          for (var j = 0, len = elements.length; j < len; j++) {
            var element = elements[j];

            if (isStarting(part.value, element)) {
              level--;
            }

            if (isEnding(part.value, element)) {
              level++;
            }

            if (level === 0) {
              return i;
            }
          }
        }

        return null;
      }

      function isTagStart(tagType, _ref2) {
        var type = _ref2.type,
          tag = _ref2.tag,
          position = _ref2.position;
        return type === "tag" && tag === tagType && position === "start";
      }

      function isTagEnd(tagType, _ref3) {
        var type = _ref3.type,
          tag = _ref3.tag,
          position = _ref3.position;
        return type === "tag" && tag === tagType && position === "end";
      }

      function isParagraphStart(options) {
        return isTagStart("w:p", options) || isTagStart("a:p", options);
      }

      function isParagraphEnd(options) {
        return isTagEnd("w:p", options) || isTagEnd("a:p", options);
      }

      function isTextStart(part) {
        return part.type === "tag" && part.position === "start" && part.text;
      }

      function isTextEnd(part) {
        return part.type === "tag" && part.position === "end" && part.text;
      }

      function isContent(p) {
        return p.type === "placeholder" || p.type === "content" && p.position === "insidetag";
      }

      var corruptCharacters = /[\x00-\x08\x0B\x0C\x0E-\x1F]/; // 00    NUL '\0' (null character)
      // 01    SOH (start of heading)
      // 02    STX (start of text)
      // 03    ETX (end of text)
      // 04    EOT (end of transmission)
      // 05    ENQ (enquiry)
      // 06    ACK (acknowledge)
      // 07    BEL '\a' (bell)
      // 08    BS  '\b' (backspace)
      // 0B    VT  '\v' (vertical tab)
      // 0C    FF  '\f' (form feed)
      // 0E    SO  (shift out)
      // 0F    SI  (shift in)
      // 10    DLE (data link escape)
      // 11    DC1 (device control 1)
      // 12    DC2 (device control 2)
      // 13    DC3 (device control 3)
      // 14    DC4 (device control 4)
      // 15    NAK (negative ack.)
      // 16    SYN (synchronous idle)
      // 17    ETB (end of trans. blk)
      // 18    CAN (cancel)
      // 19    EM  (end of medium)
      // 1A    SUB (substitute)
      // 1B    ESC (escape)
      // 1C    FS  (file separator)
      // 1D    GS  (group separator)
      // 1E    RS  (record separator)
      // 1F    US  (unit separator)

      function hasCorruptCharacters(string) {
        return corruptCharacters.test(string);
      }

      module.exports = {
        endsWith: endsWith,
        startsWith: startsWith,
        getNearestLeft: getNearestLeft,
        getNearestRight: getNearestRight,
        getNearestLeftWithCache: getNearestLeftWithCache,
        getNearestRightWithCache: getNearestRightWithCache,
        getNearestLeftIndex: getNearestLeftIndex,
        getNearestRightIndex: getNearestRightIndex,
        getNearestLeftIndexWithCache: getNearestLeftIndexWithCache,
        getNearestRightIndexWithCache: getNearestRightIndexWithCache,
        buildNearestCache: buildNearestCache,
        isContent: isContent,
        isParagraphStart: isParagraphStart,
        isParagraphEnd: isParagraphEnd,
        isTagStart: isTagStart,
        isTagEnd: isTagEnd,
        isTextStart: isTextStart,
        isTextEnd: isTextEnd,
        unique: unique,
        chunkBy: chunkBy,
        last: last,
        first: first,
        mergeObjects: mergeObjects,
        xml2str: xml2str,
        str2xml: str2xml,
        getRightOrNull: getRightOrNull,
        getRight: getRight,
        getLeftOrNull: getLeftOrNull,
        getLeft: getLeft,
        pregMatchAll: pregMatchAll,
        convertSpaces: convertSpaces,
        escapeRegExp: escapeRegExp,
        charMapRegexes: charMapRegexes,
        hasCorruptCharacters: hasCorruptCharacters,
        defaults: defaults,
        wordToUtf8: wordToUtf8,
        utf8ToWord: utf8ToWord,
        concatArrays: concatArrays,
        charMap: charMap
      };
    }, { "./browser-versions/xmldom.js": 1, "./errors": 3, "./utils": 22 }], 3: [function (require, module, exports) {
      "use strict";

      function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

      function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

      function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

      var _require = require("./utils"),
        last = _require.last,
        first = _require.first;

      function XTError(message) {
        this.name = "GenericError";
        this.message = message;
        this.stack = new Error(message).stack;
      }

      XTError.prototype = Error.prototype;

      function XTTemplateError(message) {
        this.name = "TemplateError";
        this.message = message;
        this.stack = new Error(message).stack;
      }

      XTTemplateError.prototype = new XTError();

      function XTRenderingError(message) {
        this.name = "RenderingError";
        this.message = message;
        this.stack = new Error(message).stack;
      }

      XTRenderingError.prototype = new XTError();

      function XTScopeParserError(message) {
        this.name = "ScopeParserError";
        this.message = message;
        this.stack = new Error(message).stack;
      }

      XTScopeParserError.prototype = new XTError();

      function XTInternalError(message) {
        this.name = "InternalError";
        this.properties = {
          explanation: "InternalError"
        };
        this.message = message;
        this.stack = new Error(message).stack;
      }

      XTInternalError.prototype = new XTError();

      function XTAPIVersionError(message) {
        this.name = "APIVersionError";
        this.properties = {
          explanation: "APIVersionError"
        };
        this.message = message;
        this.stack = new Error(message).stack;
      }

      XTAPIVersionError.prototype = new XTError();

      function throwApiVersionError(msg, properties) {
        var err = new XTAPIVersionError(msg);
        err.properties = _objectSpread({
          id: "api_version_error"
        }, properties);
        throw err;
      }

      function throwMultiError(errors) {
        var err = new XTTemplateError("Multi error");
        err.properties = {
          errors: errors,
          id: "multi_error",
          explanation: "The template has multiple errors"
        };
        throw err;
      }

      function getUnopenedTagException(options) {
        var err = new XTTemplateError("Unopened tag");
        err.properties = {
          xtag: last(options.xtag.split(" ")),
          id: "unopened_tag",
          context: options.xtag,
          offset: options.offset,
          lIndex: options.lIndex,
          explanation: "The tag beginning with \"".concat(options.xtag.substr(0, 10), "\" is unopened")
        };
        return err;
      }

      function getUnclosedTagException(options) {
        var err = new XTTemplateError("Unclosed tag");
        err.properties = {
          xtag: first(options.xtag.split(" ")).substr(1),
          id: "unclosed_tag",
          context: options.xtag,
          offset: options.offset,
          lIndex: options.lIndex,
          explanation: "The tag beginning with \"".concat(options.xtag.substr(0, 10), "\" is unclosed")
        };
        return err;
      }

      function throwXmlTagNotFound(options) {
        var err = new XTTemplateError("No tag \"".concat(options.element, "\" was found at the ").concat(options.position));
        var part = options.parsed[options.index];
        err.properties = {
          id: "no_xml_tag_found_at_".concat(options.position),
          explanation: "No tag \"".concat(options.element, "\" was found at the ").concat(options.position),
          offset: part.offset,
          part: part,
          parsed: options.parsed,
          index: options.index,
          element: options.element
        };
        throw err;
      }

      function getCorruptCharactersException(_ref) {
        var tag = _ref.tag,
          value = _ref.value,
          offset = _ref.offset;
        var err = new XTRenderingError("There are some XML corrupt characters");
        err.properties = {
          id: "invalid_xml_characters",
          xtag: tag,
          value: value,
          offset: offset,
          explanation: "There are some corrupt characters for the field ${tag}"
        };
        return err;
      }

      function throwContentMustBeString(type) {
        var err = new XTInternalError("Content must be a string");
        err.properties.id = "xmltemplater_content_must_be_string";
        err.properties.type = type;
        throw err;
      }

      function throwExpandNotFound(options) {
        var _options$part = options.part,
          value = _options$part.value,
          offset = _options$part.offset,
          _options$id = options.id,
          id = _options$id === void 0 ? "raw_tag_outerxml_invalid" : _options$id,
          _options$message = options.message,
          message = _options$message === void 0 ? "Raw tag not in paragraph" : _options$message;
        var part = options.part;
        var _options$explanation = options.explanation,
          explanation = _options$explanation === void 0 ? "The tag \"".concat(value, "\" is not inside a paragraph") : _options$explanation;

        if (typeof explanation === "function") {
          explanation = explanation(part);
        }

        var err = new XTTemplateError(message);
        err.properties = {
          id: id,
          explanation: explanation,
          rootError: options.rootError,
          xtag: value,
          offset: offset,
          postparsed: options.postparsed,
          expandTo: options.expandTo,
          index: options.index
        };
        throw err;
      }

      function throwRawTagShouldBeOnlyTextInParagraph(options) {
        var err = new XTTemplateError("Raw tag should be the only text in paragraph");
        var tag = options.part.value;
        err.properties = {
          id: "raw_xml_tag_should_be_only_text_in_paragraph",
          explanation: "The raw tag \"".concat(tag, "\" should be the only text in this paragraph. This means that this tag should not be surrounded by any text or spaces."),
          xtag: tag,
          offset: options.part.offset,
          paragraphParts: options.paragraphParts
        };
        throw err;
      }

      function getUnmatchedLoopException(options) {
        var location = options.location;
        var t = location === "start" ? "unclosed" : "unopened";
        var T = location === "start" ? "Unclosed" : "Unopened";
        var err = new XTTemplateError("".concat(T, " loop"));
        var tag = options.part.value;
        err.properties = {
          id: "".concat(t, "_loop"),
          explanation: "The loop with tag \"".concat(tag, "\" is ").concat(t),
          xtag: tag,
          offset: options.part.offset
        };
        return err;
      }

      function getClosingTagNotMatchOpeningTag(_ref2) {
        var tags = _ref2.tags;
        var err = new XTTemplateError("Closing tag does not match opening tag");
        err.properties = {
          id: "closing_tag_does_not_match_opening_tag",
          explanation: "The tag \"".concat(tags[0].value, "\" is closed by the tag \"").concat(tags[1].value, "\""),
          openingtag: first(tags).value,
          offset: [first(tags).offset, last(tags).offset],
          closingtag: last(tags).value
        };
        return err;
      }

      function getScopeCompilationError(_ref3) {
        var tag = _ref3.tag,
          rootError = _ref3.rootError,
          offset = _ref3.offset;
        var err = new XTScopeParserError("Scope parser compilation failed");
        err.properties = {
          id: "scopeparser_compilation_failed",
          offset: offset,
          tag: tag,
          explanation: "The scope parser for the tag \"".concat(tag, "\" failed to compile"),
          rootError: rootError
        };
        return err;
      }

      function getScopeParserExecutionError(_ref4) {
        var tag = _ref4.tag,
          scope = _ref4.scope,
          error = _ref4.error,
          offset = _ref4.offset;
        var err = new XTScopeParserError("Scope parser execution failed");
        err.properties = {
          id: "scopeparser_execution_failed",
          explanation: "The scope parser for the tag ".concat(tag, " failed to execute"),
          scope: scope,
          offset: offset,
          tag: tag,
          rootError: error
        };
        return err;
      }

      function getLoopPositionProducesInvalidXMLError(_ref5) {
        var tag = _ref5.tag,
          offset = _ref5.offset;
        var err = new XTTemplateError("The position of the loop tags \"".concat(tag, "\" would produce invalid XML"));
        err.properties = {
          tag: tag,
          id: "loop_position_invalid",
          explanation: "The tags \"".concat(tag, "\" are misplaced in the document, for example one of them is in a table and the other one outside the table"),
          offset: offset
        };
        return err;
      }

      function throwUnimplementedTagType(part, index) {
        var errorMsg = "Unimplemented tag type \"".concat(part.type, "\"");

        if (part.module) {
          errorMsg += " \"".concat(part.module, "\"");
        }

        var err = new XTTemplateError(errorMsg);
        err.properties = {
          part: part,
          index: index,
          id: "unimplemented_tag_type"
        };
        throw err;
      }

      function throwMalformedXml(part) {
        var err = new XTInternalError("Malformed xml");
        err.properties = {
          part: part,
          id: "malformed_xml"
        };
        throw err;
      }

      function throwLocationInvalid(part) {
        throw new XTInternalError("Location should be one of \"start\" or \"end\" (given : ".concat(part.location, ")"));
      }

      function throwFileTypeNotHandled(fileType) {
        var err = new XTInternalError("The filetype \"".concat(fileType, "\" is not handled by docxtemplater"));
        err.properties = {
          id: "filetype_not_handled",
          explanation: "The file you are trying to generate is of type \"".concat(fileType, "\", but only docx and pptx formats are handled"),
          fileType: fileType
        };
        throw err;
      }

      function throwFileTypeNotIdentified() {
        var err = new XTInternalError("The filetype for this file could not be identified, is this file corrupted ?");
        err.properties = {
          id: "filetype_not_identified"
        };
        throw err;
      }

      function throwXmlInvalid(content, offset) {
        var err = new XTTemplateError("An XML file has invalid xml");
        err.properties = {
          id: "file_has_invalid_xml",
          content: content,
          offset: offset,
          explanation: "The docx contains invalid XML, it is most likely corrupt"
        };
        throw err;
      }

      module.exports = {
        XTError: XTError,
        XTTemplateError: XTTemplateError,
        XTInternalError: XTInternalError,
        XTScopeParserError: XTScopeParserError,
        XTAPIVersionError: XTAPIVersionError,
        // Remove this alias in v4
        RenderingError: XTRenderingError,
        XTRenderingError: XTRenderingError,
        getClosingTagNotMatchOpeningTag: getClosingTagNotMatchOpeningTag,
        getLoopPositionProducesInvalidXMLError: getLoopPositionProducesInvalidXMLError,
        getScopeCompilationError: getScopeCompilationError,
        getScopeParserExecutionError: getScopeParserExecutionError,
        getUnclosedTagException: getUnclosedTagException,
        getUnmatchedLoopException: getUnmatchedLoopException,
        getUnopenedTagException: getUnopenedTagException,
        getCorruptCharactersException: getCorruptCharactersException,
        throwApiVersionError: throwApiVersionError,
        throwContentMustBeString: throwContentMustBeString,
        throwFileTypeNotHandled: throwFileTypeNotHandled,
        throwFileTypeNotIdentified: throwFileTypeNotIdentified,
        throwLocationInvalid: throwLocationInvalid,
        throwMalformedXml: throwMalformedXml,
        throwMultiError: throwMultiError,
        throwExpandNotFound: throwExpandNotFound,
        throwRawTagShouldBeOnlyTextInParagraph: throwRawTagShouldBeOnlyTextInParagraph,
        throwUnimplementedTagType: throwUnimplementedTagType,
        throwXmlTagNotFound: throwXmlTagNotFound,
        throwXmlInvalid: throwXmlInvalid
      };
    }, { "./utils": 22 }], 4: [function (require, module, exports) {
      "use strict";

      var loopModule = require("./modules/loop");

      var spacePreserveModule = require("./modules/space-preserve");

      var rawXmlModule = require("./modules/rawxml");

      var expandPairTrait = require("./modules/expand-pair-trait");

      var render = require("./modules/render");

      var PptXFileTypeConfig = {
        getTemplatedFiles: function getTemplatedFiles(zip) {
          var slideTemplates = zip.file(/ppt\/(slideMasters)\/(slideMaster)\d+\.xml/).map(function (file) {
            return file.name;
          });
          return slideTemplates.concat(["ppt/presentation.xml", "docProps/app.xml", "docProps/core.xml"]);
        },
        textPath: function textPath() {
          return "ppt/slides/slide1.xml";
        },
        tagsXmlTextArray: ["Company", "HyperlinkBase", "Manager", "cp:category", "cp:keywords", "dc:creator", "dc:description", "dc:subject", "dc:title", "a:t", "m:t", "vt:lpstr"],
        tagsXmlLexedArray: ["p:sp", "a:tc", "a:tr", "a:table", "a:p", "a:r", "a:rPr", "p:txBody", "a:txBody"],
        expandTags: [{
          contains: "a:tc",
          expand: "a:tr"
        }],
        onParagraphLoop: [{
          contains: "a:p",
          expand: "a:p",
          onlyTextInTag: true
        }],
        tagRawXml: "p:sp",
        tagTextXml: "a:t",
        baseModules: [loopModule, expandPairTrait, rawXmlModule, render],
        tagShouldContain: [{
          tag: "p:txBody",
          shouldContain: ["a:p"],
          value: "<a:p></a:p>"
        }, {
          tag: "a:txBody",
          shouldContain: ["a:p"],
          value: "<a:p></a:p>"
        }]
      };
      var DocXFileTypeConfig = {
        getTemplatedFiles: function getTemplatedFiles(zip) {
          var baseTags = ["docProps/core.xml", "docProps/app.xml"];
          var headerFooters = zip.file(/word\/(header|footer)\d+\.xml/).map(function (file) {
            return file.name;
          });
          return headerFooters.concat(baseTags);
        },
        textPath: function textPath(doc) {
          return doc.targets[0];
        },
        tagsXmlTextArray: ["Company", "HyperlinkBase", "Manager", "cp:category", "cp:keywords", "dc:creator", "dc:description", "dc:subject", "dc:title", "w:t", "m:t", "vt:lpstr"],
        tagsXmlLexedArray: ["w:tc", "w:tr", "w:table", "w:p", "w:r", "w:br", "w:rPr", "w:pPr", "w:spacing", "w:sdtContent"],
        expandTags: [{
          contains: "w:tc",
          expand: "w:tr"
        }],
        onParagraphLoop: [{
          contains: "w:p",
          expand: "w:p",
          onlyTextInTag: true
        }],
        tagRawXml: "w:p",
        tagTextXml: "w:t",
        baseModules: [loopModule, spacePreserveModule, expandPairTrait, rawXmlModule, render],
        tagShouldContain: [{
          tag: "w:tc",
          shouldContain: ["w:p"],
          value: "<w:p></w:p>"
        }, {
          tag: "w:sdtContent",
          shouldContain: ["w:p", "w:r"],
          value: "<w:p></w:p>"
        }]
      };
      module.exports = {
        docx: DocXFileTypeConfig,
        pptx: PptXFileTypeConfig
      };
    }, { "./modules/expand-pair-trait": 10, "./modules/loop": 11, "./modules/rawxml": 12, "./modules/render": 13, "./modules/space-preserve": 14 }], 5: [function (require, module, exports) {
      "use strict";

      function joinUncorrupt(parts, contains) {
        // Before doing this "uncorruption" method here, this was done with the `part.emptyValue` trick, however, there were some corruptions that were not handled, for example with a template like this :
        //
        // ------------------------------------------------
        // | {-w:p falsy}My para{/falsy}   |              |
        // | {-w:p falsy}My para{/falsy}   |              |
        // ------------------------------------------------
        var collecting = "";
        var currentlyCollecting = -1;
        return parts.reduce(function (full, part) {
          for (var i = 0, len = contains.length; i < len; i++) {
            var _contains$i = contains[i],
              tag = _contains$i.tag,
              shouldContain = _contains$i.shouldContain,
              value = _contains$i.value;
            var startTagRegex = new RegExp("^(<(".concat(tag, ")[^>]*>)$"), "g");

            if (currentlyCollecting === i) {
              if (part === "</".concat(tag, ">")) {
                currentlyCollecting = -1;
                return full + collecting + value + part;
              }

              collecting += part;

              for (var j = 0, len2 = shouldContain.length; j < len2; j++) {
                var sc = shouldContain[j];

                if (part.indexOf("<".concat(sc, " ")) !== -1 || part.indexOf("<".concat(sc, ">")) !== -1) {
                  currentlyCollecting = -1;
                  return full + collecting;
                }
              }

              return full;
            }

            if (currentlyCollecting === -1 && startTagRegex.test(part)) {
              currentlyCollecting = i;
              collecting = part;
              return full;
            }
          }

          return full + part;
        }, "");
      }

      module.exports = joinUncorrupt;
    }, {}], 6: [function (require, module, exports) {
      "use strict";

      function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

      function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

      function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

      function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

      var _require = require("./errors"),
        getUnclosedTagException = _require.getUnclosedTagException,
        getUnopenedTagException = _require.getUnopenedTagException,
        throwMalformedXml = _require.throwMalformedXml,
        throwXmlInvalid = _require.throwXmlInvalid;

      var _require2 = require("./doc-utils"),
        concatArrays = _require2.concatArrays,
        isTextStart = _require2.isTextStart,
        isTextEnd = _require2.isTextEnd;

      var NONE = -2;
      var EQUAL = 0;
      var START = -1;
      var END = 1;

      function inRange(range, match) {
        return range[0] <= match.offset && match.offset < range[1];
      }

      function updateInTextTag(part, inTextTag) {
        if (isTextStart(part)) {
          if (inTextTag) {
            throwMalformedXml(part);
          }

          return true;
        }

        if (isTextEnd(part)) {
          if (!inTextTag) {
            throwMalformedXml(part);
          }

          return false;
        }

        return inTextTag;
      }

      function getTag(tag) {
        var position = "";
        var start = 1;
        var end = tag.indexOf(" ");

        if (tag[tag.length - 2] === "/") {
          position = "selfclosing";

          if (end === -1) {
            end = tag.length - 2;
          }
        } else if (tag[1] === "/") {
          start = 2;
          position = "end";

          if (end === -1) {
            end = tag.length - 1;
          }
        } else {
          position = "start";

          if (end === -1) {
            end = tag.length - 1;
          }
        }

        return {
          tag: tag.slice(start, end),
          position: position
        };
      }

      function tagMatcher(content, textMatchArray, othersMatchArray) {
        var cursor = 0;
        var contentLength = content.length;
        var allMatches = concatArrays([textMatchArray.map(function (tag) {
          return {
            tag: tag,
            text: true
          };
        }), othersMatchArray.map(function (tag) {
          return {
            tag: tag,
            text: false
          };
        })]).reduce(function (allMatches, t) {
          allMatches[t.tag] = t.text;
          return allMatches;
        }, {});
        var totalMatches = [];

        while (cursor < contentLength) {
          cursor = content.indexOf("<", cursor);

          if (cursor === -1) {
            break;
          }

          var offset = cursor;
          var nextOpening = content.indexOf("<", cursor + 1);
          cursor = content.indexOf(">", cursor);

          if (cursor === -1 || nextOpening !== -1 && cursor > nextOpening) {
            throwXmlInvalid(content, offset);
          }

          var tagText = content.slice(offset, cursor + 1);

          var _getTag = getTag(tagText),
            tag = _getTag.tag,
            position = _getTag.position;

          var text = allMatches[tag];

          if (text == null) {
            continue;
          }

          totalMatches.push({
            type: "tag",
            position: position,
            text: text,
            offset: offset,
            value: tagText,
            tag: tag
          });
        }

        return totalMatches;
      }

      function getDelimiterErrors(delimiterMatches, fullText, ranges) {
        if (delimiterMatches.length === 0) {
          return [];
        }

        var errors = [];
        var inDelimiter = false;
        var lastDelimiterMatch = {
          offset: 0
        };
        var xtag;
        var rangeIndex = 0;
        delimiterMatches.forEach(function (delimiterMatch) {
          while (ranges[rangeIndex + 1]) {
            if (ranges[rangeIndex + 1].offset > delimiterMatch.offset) {
              break;
            }

            rangeIndex++;
          }

          xtag = fullText.substr(lastDelimiterMatch.offset, delimiterMatch.offset - lastDelimiterMatch.offset);

          if (delimiterMatch.position === "start" && inDelimiter || delimiterMatch.position === "end" && !inDelimiter) {
            if (delimiterMatch.position === "start") {
              errors.push(getUnclosedTagException({
                xtag: xtag,
                offset: lastDelimiterMatch.offset
              }));
              delimiterMatch.error = true;
            } else {
              errors.push(getUnopenedTagException({
                xtag: xtag,
                offset: delimiterMatch.offset
              }));
              delimiterMatch.error = true;
            }
          } else {
            inDelimiter = !inDelimiter;
          }

          lastDelimiterMatch = delimiterMatch;
        });
        var delimiterMatch = {
          offset: fullText.length
        };
        xtag = fullText.substr(lastDelimiterMatch.offset, delimiterMatch.offset - lastDelimiterMatch.offset);

        if (inDelimiter) {
          errors.push(getUnclosedTagException({
            xtag: xtag,
            offset: lastDelimiterMatch.offset
          }));
          delimiterMatch.error = true;
        }

        return errors;
      }

      function compareOffsets(startOffset, endOffset) {
        if (startOffset === -1 && endOffset === -1) {
          return NONE;
        }

        if (startOffset === endOffset) {
          return EQUAL;
        }

        if (startOffset === -1 || endOffset === -1) {
          return endOffset < startOffset ? START : END;
        }

        return startOffset < endOffset ? START : END;
      }

      function splitDelimiters(inside) {
        var newDelimiters = inside.split(" ");

        if (newDelimiters.length !== 2) {
          throw new Error("New Delimiters cannot be parsed");
        }

        var _newDelimiters = _slicedToArray(newDelimiters, 2),
          start = _newDelimiters[0],
          end = _newDelimiters[1];

        if (start.length === 0 || end.length === 0) {
          throw new Error("New Delimiters cannot be parsed");
        }

        return [start, end];
      }

      function getAllIndexes(fullText, delimiters) {
        var indexes = [];
        var start = delimiters.start,
          end = delimiters.end;
        var offset = -1;
        var insideTag = false;

        while (true) {
          var startOffset = fullText.indexOf(start, offset + 1);
          var endOffset = fullText.indexOf(end, offset + 1);
          var position = null;
          var len = void 0;
          var compareResult = compareOffsets(startOffset, endOffset);

          if (compareResult === NONE) {
            return indexes;
          }

          if (compareResult === EQUAL) {
            if (!insideTag) {
              compareResult = START;
            } else {
              compareResult = END;
            }
          }

          if (compareResult === END) {
            insideTag = false;
            offset = endOffset;
            position = "end";
            len = end.length;
          }

          if (compareResult === START) {
            insideTag = true;
            offset = startOffset;
            position = "start";
            len = start.length;
          }

          if (position === "start" && fullText[offset + start.length] === "=") {
            indexes.push({
              offset: startOffset,
              position: "start",
              length: start.length,
              changedelimiter: true
            });
            var nextEqual = fullText.indexOf("=", offset + start.length + 1);

            var _endOffset = fullText.indexOf(end, nextEqual + 1);

            indexes.push({
              offset: _endOffset,
              position: "end",
              length: end.length,
              changedelimiter: true
            });

            var _insideTag = fullText.substr(offset + start.length + 1, nextEqual - offset - start.length - 1);

            var _splitDelimiters = splitDelimiters(_insideTag);

            var _splitDelimiters2 = _slicedToArray(_splitDelimiters, 2);

            start = _splitDelimiters2[0];
            end = _splitDelimiters2[1];
            offset = _endOffset;
            continue;
          }

          indexes.push({
            offset: offset,
            position: position,
            length: len
          });
        }
      }

      function parseDelimiters(innerContentParts, delimiters) {
        var full = innerContentParts.map(function (p) {
          return p.value;
        }).join("");
        var delimiterMatches = getAllIndexes(full, delimiters);
        var offset = 0;
        var ranges = innerContentParts.map(function (part) {
          offset += part.value.length;
          return {
            offset: offset - part.value.length,
            lIndex: part.lIndex
          };
        });
        var errors = getDelimiterErrors(delimiterMatches, full, ranges);
        var cutNext = 0;
        var delimiterIndex = 0;
        var parsed = ranges.map(function (p, i) {
          var offset = p.offset;
          var range = [offset, offset + innerContentParts[i].value.length];
          var partContent = innerContentParts[i].value;
          var delimitersInOffset = [];

          while (delimiterIndex < delimiterMatches.length && inRange(range, delimiterMatches[delimiterIndex])) {
            delimitersInOffset.push(delimiterMatches[delimiterIndex]);
            delimiterIndex++;
          }

          var parts = [];
          var cursor = 0;

          if (cutNext > 0) {
            cursor = cutNext;
            cutNext = 0;
          }

          var insideDelimiterChange;
          delimitersInOffset.forEach(function (delimiterInOffset) {
            var value = partContent.substr(cursor, delimiterInOffset.offset - offset - cursor);

            if (value.length > 0) {
              if (insideDelimiterChange) {
                if (delimiterInOffset.changedelimiter) {
                  cursor = delimiterInOffset.offset - offset + delimiterInOffset.length;
                  insideDelimiterChange = delimiterInOffset.position === "start";
                }

                return;
              }

              parts.push({
                type: "content",
                value: value,
                offset: cursor + offset
              });
              cursor += value.length;
            }

            var delimiterPart = {
              type: "delimiter",
              position: delimiterInOffset.position,
              offset: cursor + offset
            };

            if (delimiterInOffset.error) {
              delimiterPart.error = delimiterInOffset.error;
            }

            if (delimiterInOffset.changedelimiter) {
              insideDelimiterChange = delimiterInOffset.position === "start";
              cursor = delimiterInOffset.offset - offset + delimiterInOffset.length;
              return;
            }

            parts.push(delimiterPart);
            cursor = delimiterInOffset.offset - offset + delimiterInOffset.length;
          });
          cutNext = cursor - partContent.length;
          var value = partContent.substr(cursor);

          if (value.length > 0) {
            parts.push({
              type: "content",
              value: value,
              offset: offset
            });
          }

          return parts;
        }, this);
        return {
          parsed: parsed,
          errors: errors
        };
      }

      function getContentParts(xmlparsed) {
        var inTextTag = false;
        var innerContentParts = [];
        xmlparsed.forEach(function (part) {
          inTextTag = updateInTextTag(part, inTextTag);

          if (inTextTag && part.type === "content") {
            innerContentParts.push(part);
          }
        });
        return innerContentParts;
      }

      module.exports = {
        parseDelimiters: parseDelimiters,
        parse: function parse(xmlparsed, delimiters) {
          var inTextTag = false;

          var _parseDelimiters = parseDelimiters(getContentParts(xmlparsed), delimiters),
            delimiterParsed = _parseDelimiters.parsed,
            errors = _parseDelimiters.errors;

          var lexed = [];
          var index = 0;
          xmlparsed.forEach(function (part) {
            inTextTag = updateInTextTag(part, inTextTag);

            if (part.type === "content") {
              part.position = inTextTag ? "insidetag" : "outsidetag";
            }

            if (inTextTag && part.type === "content") {
              Array.prototype.push.apply(lexed, delimiterParsed[index].map(function (p) {
                if (p.type === "content") {
                  p.position = "insidetag";
                }

                return p;
              }));
              index++;
            } else {
              lexed.push(part);
            }
          });
          lexed = lexed.map(function (p, i) {
            p.lIndex = i;
            return p;
          });
          return {
            errors: errors,
            lexed: lexed
          };
        },
        xmlparse: function xmlparse(content, xmltags) {
          var matches = tagMatcher(content, xmltags.text, xmltags.other);
          var cursor = 0;
          var parsed = matches.reduce(function (parsed, match) {
            var value = content.substr(cursor, match.offset - cursor);

            if (value.length > 0) {
              parsed.push({
                type: "content",
                value: value
              });
            }

            cursor = match.offset + match.value.length;
            delete match.offset;

            if (match.value.length > 0) {
              parsed.push(match);
            }

            return parsed;
          }, []);
          var value = content.substr(cursor);

          if (value.length > 0) {
            parsed.push({
              type: "content",
              value: value
            });
          }

          return parsed;
        }
      };
    }, { "./doc-utils": 2, "./errors": 3 }], 7: [function (require, module, exports) {
      "use strict";

      function getMinFromArrays(arrays, state) {
        var minIndex = -1;

        for (var i = 0, l = arrays.length; i < l; i++) {
          if (state[i] >= arrays[i].length) {
            continue;
          }

          if (minIndex === -1 || arrays[i][state[i]].offset < arrays[minIndex][state[minIndex]].offset) {
            minIndex = i;
          }
        }

        if (minIndex === -1) {
          throw new Error("minIndex negative");
        }

        return minIndex;
      }

      module.exports = function (arrays) {
        var totalLength = arrays.reduce(function (sum, array) {
          return sum + array.length;
        }, 0);
        arrays = arrays.filter(function (array) {
          return array.length > 0;
        });
        var resultArray = new Array(totalLength);
        var state = arrays.map(function () {
          return 0;
        });
        var i = 0;

        while (i <= totalLength - 1) {
          var arrayIndex = getMinFromArrays(arrays, state);
          resultArray[i] = arrays[arrayIndex][state[arrayIndex]];
          state[arrayIndex]++;
          i++;
        }

        return resultArray;
      };
    }, {}], 8: [function (require, module, exports) {
      "use strict";

      function emptyFun() { }

      function identity(i) {
        return i;
      }

      module.exports = function (module) {
        var defaults = {
          set: emptyFun,
          parse: emptyFun,
          render: emptyFun,
          getTraits: emptyFun,
          getFileType: emptyFun,
          nullGetter: emptyFun,
          optionsTransformer: identity,
          postrender: identity,
          errorsTransformer: identity,
          getRenderedMap: identity,
          preparse: identity,
          postparse: identity,
          on: emptyFun,
          resolve: emptyFun
        };

        if (Object.keys(defaults).every(function (key) {
          return !module[key];
        })) {
          throw new Error("This module cannot be wrapped, because it doesn't define any of the necessary functions");
        }

        Object.keys(defaults).forEach(function (key) {
          module[key] = module[key] || defaults[key];
        });
        return module;
      };
    }, {}], 9: [function (require, module, exports) {
      "use strict";

      function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

      function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

      function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

      var wrapper = require("../module-wrapper");

      var ctXML = "[Content_Types].xml";
      var docxContentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml";
      var docxmContentType = "application/vnd.ms-word.document.macroEnabled.main+xml";
      var pptxContentType = "application/vnd.openxmlformats-officedocument.presentationml.slide+xml";

      function getPartName(override) {
        var partName = override.getAttribute("PartName");

        if (partName[0] === "/") {
          partName = partName.substr(1);
        }

        return partName;
      }

      var Common =
        /*#__PURE__*/
        function () {
          function Common() {
            _classCallCheck(this, Common);

            this.name = "Common";
            this.recordRun = false;
            this.recordedRun = [];
          }

          _createClass(Common, [{
            key: "getFileType",
            value: function getFileType(_ref) {
              var zip = _ref.zip,
                contentTypes = _ref.contentTypes,
                overrides = _ref.overrides,
                defaults = _ref.defaults,
                doc = _ref.doc;

              if (!contentTypes) {
                return;
              }

              var fileType = null;
              var partNames = [];

              for (var i = 0, len = overrides.length; i < len; i++) {
                var override = overrides[i];
                var contentType = override.getAttribute("ContentType");
                var partName = getPartName(override);
                partNames.push(partName);

                if (contentType === docxContentType) {
                  fileType = "docx";
                  doc.targets.push(partName);
                }

                if (contentType === docxmContentType) {
                  fileType = "docx";
                  doc.targets.push(partName);
                }

                if (contentType === pptxContentType) {
                  fileType = "pptx";
                  doc.targets.push(partName);
                }
              }

              if (fileType) {
                return fileType;
              }

              var _loop = function _loop(_i, _len) {
                var def = defaults[_i];
                var contentType = def.getAttribute("ContentType");

                if ([docxContentType, docxmContentType, pptxContentType].indexOf(contentType) !== -1) {
                  var extension = def.getAttribute("Extension"); // eslint-disable-next-line no-loop-func

                  zip.file(/./).map(function (_ref2) {
                    var name = _ref2.name;

                    if (name.slice(name.length - extension.length - 1) === ".xml" && partNames.indexOf(name) === -1 && name !== ctXML) {
                      doc.targets.push(name);
                      fileType = contentType === pptxContentType ? "pptx" : "docx";
                    }
                  });
                }
              };

              for (var _i = 0, _len = defaults.length; _i < _len; _i++) {
                _loop(_i, _len);
              }

              return fileType;
            }
          }]);

          return Common;
        }();

      module.exports = function () {
        return wrapper(new Common());
      };
    }, { "../module-wrapper": 8 }], 10: [function (require, module, exports) {
      "use strict";

      function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

      function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

      function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

      function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

      var traitName = "expandPair";

      var mergeSort = require("../mergesort");

      var _require = require("../doc-utils"),
        getLeft = _require.getLeft,
        getRight = _require.getRight;

      var wrapper = require("../module-wrapper");

      var _require2 = require("../traits"),
        getExpandToDefault = _require2.getExpandToDefault;

      var _require3 = require("../errors"),
        getUnmatchedLoopException = _require3.getUnmatchedLoopException,
        getClosingTagNotMatchOpeningTag = _require3.getClosingTagNotMatchOpeningTag,
        throwLocationInvalid = _require3.throwLocationInvalid;

      function getOpenCountChange(part) {
        switch (part.location) {
          case "start":
            return 1;

          case "end":
            return -1;

          default:
            throwLocationInvalid(part);
        }
      }

      function getPairs(traits) {
        var errors = [];
        var pairs = [];

        if (traits.length === 0) {
          return {
            pairs: pairs,
            errors: errors
          };
        }

        var countOpen = 1;

        var _traits = _slicedToArray(traits, 1),
          firstTrait = _traits[0];

        if (firstTrait.part.location === "start") {
          for (var i = 1; i < traits.length; i++) {
            var currentTrait = traits[i];
            countOpen += getOpenCountChange(currentTrait.part);

            if (countOpen === 0) {
              var _outer = getPairs(traits.slice(i + 1));

              if (currentTrait.part.value !== firstTrait.part.value && currentTrait.part.value !== "") {
                errors.push(getClosingTagNotMatchOpeningTag({
                  tags: [firstTrait.part, currentTrait.part]
                }));
              } else {
                pairs = [[firstTrait, currentTrait]];
              }

              return {
                pairs: pairs.concat(_outer.pairs),
                errors: errors.concat(_outer.errors)
              };
            }
          }
        }

        var part = firstTrait.part;
        errors.push(getUnmatchedLoopException({
          part: part,
          location: part.location
        }));
        var outer = getPairs(traits.slice(1));
        return {
          pairs: outer.pairs,
          errors: errors.concat(outer.errors)
        };
      }

      var expandPairTrait = {
        name: "ExpandPairTrait",
        optionsTransformer: function optionsTransformer(options, docxtemplater) {
          this.expandTags = docxtemplater.fileTypeConfig.expandTags.concat(docxtemplater.options.paragraphLoop ? docxtemplater.fileTypeConfig.onParagraphLoop : []);
          return options;
        },
        postparse: function postparse(postparsed, _ref) {
          var _this = this;

          var getTraits = _ref.getTraits,
            _postparse = _ref.postparse;
          var traits = getTraits(traitName, postparsed);
          traits = traits.map(function (trait) {
            return trait || [];
          });
          traits = mergeSort(traits);

          var _getPairs = getPairs(traits),
            pairs = _getPairs.pairs,
            errors = _getPairs.errors;

          var expandedPairs = pairs.map(function (pair) {
            var expandTo = pair[0].part.expandTo;

            if (expandTo === "auto") {
              var result = getExpandToDefault(postparsed, pair, _this.expandTags);

              if (result.error) {
                errors.push(result.error);
              }

              expandTo = result.value;
            }

            if (!expandTo) {
              return [pair[0].offset, pair[1].offset];
            }

            var left, right;

            try {
              left = getLeft(postparsed, expandTo, pair[0].offset);
            } catch (e) {
              errors.push(e);
            }

            try {
              right = getRight(postparsed, expandTo, pair[1].offset);
            } catch (e) {
              errors.push(e);
            }

            return [left, right];
          });
          var currentPairIndex = 0;
          var innerParts;
          var newParsed = postparsed.reduce(function (newParsed, part, i) {
            var inPair = currentPairIndex < pairs.length && expandedPairs[currentPairIndex][0] <= i;
            var pair = pairs[currentPairIndex];
            var expandedPair = expandedPairs[currentPairIndex];

            if (!inPair) {
              newParsed.push(part);
              return newParsed;
            }

            if (expandedPair[0] === i) {
              innerParts = [];
            }

            if (pair[0].offset !== i && pair[1].offset !== i) {
              innerParts.push(part);
            }

            if (expandedPair[1] === i) {
              var basePart = postparsed[pair[0].offset];
              basePart.subparsed = _postparse(innerParts, {
                basePart: basePart
              });
              delete basePart.location;
              delete basePart.expandTo;
              newParsed.push(basePart);
              currentPairIndex++;
            }

            return newParsed;
          }, []);
          return {
            postparsed: newParsed,
            errors: errors
          };
        }
      };

      module.exports = function () {
        return wrapper(expandPairTrait);
      };
    }, { "../doc-utils": 2, "../errors": 3, "../mergesort": 7, "../module-wrapper": 8, "../traits": 21 }], 11: [function (require, module, exports) {
      "use strict";

      function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

      function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

      function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

      function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

      function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

      function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

      function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

      var _require = require("../doc-utils"),
        mergeObjects = _require.mergeObjects,
        chunkBy = _require.chunkBy,
        last = _require.last,
        isParagraphStart = _require.isParagraphStart,
        isParagraphEnd = _require.isParagraphEnd,
        isContent = _require.isContent;

      var wrapper = require("../module-wrapper");

      var moduleName = "loop";

      function hasContent(parts) {
        return parts.some(function (part) {
          return isContent(part);
        });
      }

      function getFirstMeaningFulPart(parsed) {
        for (var i = 0, len = parsed.length; i < len; i++) {
          if (parsed[i].type !== "content") {
            return parsed[i];
          }
        }

        return null;
      }

      function isInsideParagraphLoop(part) {
        var firstMeaningfulPart = getFirstMeaningFulPart(part.subparsed);
        return firstMeaningfulPart != null && firstMeaningfulPart.tag !== "w:t";
      }

      function getPageBreakIfApplies(part) {
        if (part.hasPageBreak) {
          if (isInsideParagraphLoop(part)) {
            return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
          }
        }

        return "";
      }

      function isEnclosedByParagraphs(parsed) {
        if (parsed.length === 0) {
          return false;
        }

        return isParagraphStart(parsed[0]) && isParagraphEnd(last(parsed));
      }

      function getOffset(chunk) {
        return hasContent(chunk) ? 0 : chunk.length;
      }

      function addPageBreakAtEnd(subRendered) {
        var found = false;
        var i = subRendered.parts.length - 1;

        for (var j = subRendered.parts.length - 1; i >= 0; i--) {
          var p = subRendered.parts[j];

          if (p === "</w:p>" && !found) {
            found = true;
            subRendered.parts.splice(j, 0, '<w:r><w:br w:type="page"/></w:r>');
            break;
          }
        }

        if (!found) {
          subRendered.parts.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>');
        }
      }

      function addPageBreakAtBeginning(subRendered) {
        subRendered.parts.unshift('<w:p><w:r><w:br w:type="page"/></w:r></w:p>');
      }

      function hasPageBreak(chunk) {
        return chunk.some(function (part) {
          if (part.tag === "w:br" && part.value.indexOf('w:type="page"') !== -1) {
            return true;
          }
        });
      }

      var LoopModule =
        /*#__PURE__*/
        function () {
          function LoopModule() {
            _classCallCheck(this, LoopModule);

            this.name = "LoopModule";
            this.prefix = {
              start: "#",
              end: "/",
              dash: /^-([^\s]+)\s(.+)$/,
              inverted: "^"
            };
          }

          _createClass(LoopModule, [{
            key: "parse",
            value: function parse(placeHolderContent, _ref) {
              var match = _ref.match,
                getValue = _ref.getValue,
                getValues = _ref.getValues;
              var module = moduleName;
              var type = "placeholder";
              var _this$prefix = this.prefix,
                start = _this$prefix.start,
                inverted = _this$prefix.inverted,
                dash = _this$prefix.dash,
                end = _this$prefix.end;

              if (match(start, placeHolderContent)) {
                return {
                  type: type,
                  value: getValue(start, placeHolderContent),
                  expandTo: "auto",
                  module: module,
                  location: "start",
                  inverted: false
                };
              }

              if (match(inverted, placeHolderContent)) {
                return {
                  type: type,
                  value: getValue(inverted, placeHolderContent),
                  expandTo: "auto",
                  module: module,
                  location: "start",
                  inverted: true
                };
              }

              if (match(end, placeHolderContent)) {
                return {
                  type: type,
                  value: getValue(end, placeHolderContent),
                  module: module,
                  location: "end"
                };
              }

              if (match(dash, placeHolderContent)) {
                var _getValues = getValues(dash, placeHolderContent),
                  _getValues2 = _slicedToArray(_getValues, 3),
                  expandTo = _getValues2[1],
                  value = _getValues2[2];

                return {
                  type: type,
                  value: value,
                  expandTo: expandTo,
                  module: module,
                  location: "start",
                  inverted: false
                };
              }

              return null;
            }
          }, {
            key: "getTraits",
            value: function getTraits(traitName, parsed) {
              if (traitName !== "expandPair") {
                return;
              }

              return parsed.reduce(function (tags, part, offset) {
                if (part.type === "placeholder" && part.module === moduleName && part.subparsed == null) {
                  tags.push({
                    part: part,
                    offset: offset
                  });
                }

                return tags;
              }, []);
            }
          }, {
            key: "postparse",
            value: function postparse(parsed, _ref2) {
              var basePart = _ref2.basePart;

              if (!basePart || basePart.expandTo !== "auto" || basePart.module !== moduleName || !isEnclosedByParagraphs(parsed)) {
                return parsed;
              }

              var level = 0;
              var chunks = chunkBy(parsed, function (p) {
                if (isParagraphStart(p)) {
                  level++;

                  if (level === 1) {
                    return "start";
                  }
                }

                if (isParagraphEnd(p)) {
                  level--;

                  if (level === 0) {
                    return "end";
                  }
                }

                return null;
              });

              if (chunks.length <= 2) {
                return parsed;
              }

              var firstChunk = chunks[0];
              var lastChunk = last(chunks);
              var firstOffset = getOffset(firstChunk);
              var lastOffset = getOffset(lastChunk);
              basePart.hasPageBreak = hasPageBreak(lastChunk);
              basePart.hasPageBreakBeginning = hasPageBreak(firstChunk);

              if (firstOffset === 0 || lastOffset === 0) {
                return parsed;
              }

              return parsed.slice(firstOffset, parsed.length - lastOffset);
            }
          }, {
            key: "render",
            value: function render(part, options) {
              if (part.type !== "placeholder" || part.module !== moduleName) {
                return null;
              }

              var totalValue = [];
              var errors = [];

              function loopOver(scope, i, length) {
                var scopeManager = options.scopeManager.createSubScopeManager(scope, part.value, i, part, length);
                var subRendered = options.render(mergeObjects({}, options, {
                  compiled: part.subparsed,
                  tags: {},
                  scopeManager: scopeManager
                }));

                if (part.hasPageBreak && i === length - 1 && isInsideParagraphLoop(part)) {
                  addPageBreakAtEnd(subRendered);
                }

                if (part.hasPageBreakBeginning && isInsideParagraphLoop(part)) {
                  addPageBreakAtBeginning(subRendered);
                }

                totalValue = totalValue.concat(subRendered.parts);
                errors = errors.concat(subRendered.errors || []);
              }

              var result;

              try {
                result = options.scopeManager.loopOver(part.value, loopOver, part.inverted, {
                  part: part
                });
              } catch (e) {
                errors.push(e);
                return {
                  errors: errors
                };
              } // if the loop is showing empty content


              if (result === false) {
                return {
                  value: getPageBreakIfApplies(part) || part.emptyValue || "",
                  errors: errors
                };
              }

              var contains = options.fileTypeConfig.tagShouldContain || [];
              return {
                value: options.joinUncorrupt(totalValue, contains),
                errors: errors
              };
            }
          }, {
            key: "resolve",
            value: function resolve(part, options) {
              if (part.type !== "placeholder" || part.module !== moduleName) {
                return null;
              }

              var sm = options.scopeManager;
              var promisedValue = Promise.resolve().then(function () {
                return sm.getValue(part.value, {
                  part: part
                });
              });
              var promises = [];

              function loopOver(scope, i, length) {
                var scopeManager = sm.createSubScopeManager(scope, part.value, i, part, length);
                promises.push(options.resolve({
                  filePath: options.filePath,
                  modules: options.modules,
                  baseNullGetter: options.baseNullGetter,
                  resolve: options.resolve,
                  compiled: part.subparsed,
                  tags: {},
                  scopeManager: scopeManager
                }));
              }

              return promisedValue.then(function (value) {
                sm.loopOverValue(value, loopOver, part.inverted);
                return Promise.all(promises).then(function (r) {
                  return r.map(function (_ref3) {
                    var resolved = _ref3.resolved;
                    return resolved;
                  });
                });
              });
            }
          }]);

          return LoopModule;
        }();

      module.exports = function () {
        return wrapper(new LoopModule());
      };
    }, { "../doc-utils": 2, "../module-wrapper": 8 }], 12: [function (require, module, exports) {
      "use strict";

      function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

      function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

      function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

      var traits = require("../traits");

      var _require = require("../doc-utils"),
        isContent = _require.isContent;

      var _require2 = require("../errors"),
        throwRawTagShouldBeOnlyTextInParagraph = _require2.throwRawTagShouldBeOnlyTextInParagraph;

      var moduleName = "rawxml";

      var wrapper = require("../module-wrapper");

      function getInner(_ref) {
        var part = _ref.part,
          left = _ref.left,
          right = _ref.right,
          postparsed = _ref.postparsed,
          index = _ref.index;
        var paragraphParts = postparsed.slice(left + 1, right);
        paragraphParts.forEach(function (p, i) {
          if (i === index - left - 1) {
            return;
          }

          if (isContent(p)) {
            throwRawTagShouldBeOnlyTextInParagraph({
              paragraphParts: paragraphParts,
              part: part
            });
          }
        });
        return part;
      }

      var RawXmlModule =
        /*#__PURE__*/
        function () {
          function RawXmlModule() {
            _classCallCheck(this, RawXmlModule);

            this.name = "RawXmlModule";
            this.prefix = "@";
          }

          _createClass(RawXmlModule, [{
            key: "optionsTransformer",
            value: function optionsTransformer(options, docxtemplater) {
              this.fileTypeConfig = docxtemplater.fileTypeConfig;
              return options;
            }
          }, {
            key: "parse",
            value: function parse(placeHolderContent, _ref2) {
              var match = _ref2.match,
                getValue = _ref2.getValue;
              var type = "placeholder";

              if (match(this.prefix, placeHolderContent)) {
                return {
                  type: type,
                  value: getValue(this.prefix, placeHolderContent),
                  module: moduleName
                };
              }

              return null;
            }
          }, {
            key: "postparse",
            value: function postparse(postparsed) {
              return traits.expandToOne(postparsed, {
                moduleName: moduleName,
                getInner: getInner,
                expandTo: this.fileTypeConfig.tagRawXml,
                error: {
                  message: "Raw tag not in paragraph",
                  id: "raw_tag_outerxml_invalid",
                  explanation: function explanation(part) {
                    return "The tag \"".concat(part.value, "\" is not inside a paragraph, putting raw tags inside an inline loop is disallowed.");
                  }
                }
              });
            }
          }, {
            key: "render",
            value: function render(part, options) {
              if (part.module !== moduleName) {
                return null;
              }

              var value;
              var errors = [];

              try {
                value = options.scopeManager.getValue(part.value, {
                  part: part
                });

                if (value == null) {
                  value = options.nullGetter(part);
                }
              } catch (e) {
                errors.push(e);
                return {
                  errors: errors
                };
              }

              if (!value) {
                return {
                  value: part.emptyValue || ""
                };
              }

              return {
                value: value
              };
            }
          }, {
            key: "resolve",
            value: function resolve(part, options) {
              if (part.type !== "placeholder" || part.module !== moduleName) {
                return null;
              }

              return options.scopeManager.getValueAsync(part.value, {
                part: part
              }).then(function (value) {
                if (value == null) {
                  return options.nullGetter(part);
                }

                return value;
              });
            }
          }]);

          return RawXmlModule;
        }();

      module.exports = function () {
        return wrapper(new RawXmlModule());
      };
    }, { "../doc-utils": 2, "../errors": 3, "../module-wrapper": 8, "../traits": 21 }], 13: [function (require, module, exports) {
      "use strict";

      function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

      function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

      function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

      var wrapper = require("../module-wrapper");

      var _require = require("../errors"),
        getScopeCompilationError = _require.getScopeCompilationError;

      var _require2 = require("../doc-utils"),
        utf8ToWord = _require2.utf8ToWord,
        hasCorruptCharacters = _require2.hasCorruptCharacters;

      var _require3 = require("../errors"),
        getCorruptCharactersException = _require3.getCorruptCharactersException;

      var ftprefix = {
        docx: "w",
        pptx: "a"
      };

      var Render =
        /*#__PURE__*/
        function () {
          function Render() {
            _classCallCheck(this, Render);

            this.name = "Render";
            this.recordRun = false;
            this.recordedRun = [];
          }

          _createClass(Render, [{
            key: "set",
            value: function set(obj) {
              if (obj.compiled) {
                this.compiled = obj.compiled;
              }

              if (obj.data != null) {
                this.data = obj.data;
              }
            }
          }, {
            key: "getRenderedMap",
            value: function getRenderedMap(mapper) {
              var _this = this;

              return Object.keys(this.compiled).reduce(function (mapper, from) {
                mapper[from] = {
                  from: from,
                  data: _this.data
                };
                return mapper;
              }, mapper);
            }
          }, {
            key: "optionsTransformer",
            value: function optionsTransformer(options, docxtemplater) {
              this.parser = docxtemplater.parser;
              this.fileType = docxtemplater.fileType;
              return options;
            }
          }, {
            key: "postparse",
            value: function postparse(postparsed) {
              var _this2 = this;

              var errors = [];
              postparsed.forEach(function (p) {
                if (p.type === "placeholder") {
                  var tag = p.value;

                  try {
                    _this2.parser(tag, {
                      tag: p
                    });
                  } catch (rootError) {
                    errors.push(getScopeCompilationError({
                      tag: tag,
                      rootError: rootError,
                      offset: p.offset
                    }));
                  }
                }
              });
              return {
                postparsed: postparsed,
                errors: errors
              };
            }
          }, {
            key: "recordRuns",
            value: function recordRuns(part) {
              if (part.tag === "".concat(ftprefix[this.fileType], ":r")) {
                this.recordRun = false;
                this.recordedRun = [];
              } else if (part.tag === "".concat(ftprefix[this.fileType], ":rPr")) {
                if (part.position === "start") {
                  this.recordRun = true;
                  this.recordedRun = [part.value];
                }

                if (part.position === "end") {
                  this.recordedRun.push(part.value);
                  this.recordRun = false;
                }
              } else if (this.recordRun) {
                this.recordedRun.push(part.value);
              }
            }
          }, {
            key: "render",
            value: function render(part, _ref) {
              var scopeManager = _ref.scopeManager,
                linebreaks = _ref.linebreaks,
                nullGetter = _ref.nullGetter;

              if (linebreaks) {
                this.recordRuns(part);
              }

              if (part.type !== "placeholder" || part.module) {
                return;
              }

              var value;

              try {
                value = scopeManager.getValue(part.value, {
                  part: part
                });
              } catch (e) {
                return {
                  errors: [e]
                };
              }

              if (value == null) {
                value = nullGetter(part);
              }

              if (hasCorruptCharacters(value)) {
                return {
                  errors: [getCorruptCharactersException({
                    tag: part.value,
                    value: value,
                    offset: part.offset
                  })]
                };
              }

              if (typeof value !== "string") {
                value = value.toString();
              }

              if (linebreaks) {
                return this.renderLineBreaks(value);
              }

              return {
                value: utf8ToWord(value)
              };
            }
          }, {
            key: "renderLineBreaks",
            value: function renderLineBreaks(value) {
              var p = ftprefix[this.fileType];
              var br = this.fileType === "docx" ? "<w:r><w:br/></w:r>" : "<a:br/>";
              var lines = value.split("\n");
              var runprops = this.recordedRun.join("");
              return {
                value: lines.map(function (line) {
                  return utf8ToWord(line);
                }).join("</".concat(p, ":t></").concat(p, ":r>").concat(br, "<").concat(p, ":r>").concat(runprops, "<").concat(p, ":t").concat(this.fileType === "docx" ? ' xml:space="preserve"' : "", ">"))
              };
            }
          }]);

          return Render;
        }();

      module.exports = function () {
        return wrapper(new Render());
      };
    }, { "../doc-utils": 2, "../errors": 3, "../module-wrapper": 8 }], 14: [function (require, module, exports) {
      "use strict";

      var wrapper = require("../module-wrapper");

      var _require = require("../doc-utils"),
        isTextStart = _require.isTextStart,
        isTextEnd = _require.isTextEnd,
        endsWith = _require.endsWith,
        startsWith = _require.startsWith;

      var wTpreserve = '<w:t xml:space="preserve">';
      var wTpreservelen = wTpreserve.length;
      var wtEnd = "</w:t>";
      var wtEndlen = wtEnd.length;

      function isWtStart(part) {
        return isTextStart(part) && part.tag === "w:t";
      }

      function addXMLPreserve(chunk, index) {
        var tag = chunk[index].value;

        if (chunk[index + 1].value === "</w:t>") {
          return tag;
        }

        if (tag.indexOf('xml:space="preserve"') !== -1) {
          return tag;
        }

        return tag.substr(0, tag.length - 1) + ' xml:space="preserve">';
      }

      function isInsideLoop(meta, chunk) {
        return meta && meta.basePart && chunk.length > 1;
      }

      var spacePreserve = {
        name: "SpacePreserveModule",
        postparse: function postparse(postparsed, meta) {
          var chunk = [],
            inTextTag = false,
            endLindex = 0,
            lastTextTag = 0;

          function isStartingPlaceHolder(part, chunk) {
            return !endLindex && part.type === "placeholder" && (!part.module || part.module === "loop") && chunk.length > 1;
          }

          var result = postparsed.reduce(function (postparsed, part) {
            if (isWtStart(part)) {
              inTextTag = true;
              lastTextTag = chunk.length;
            }

            if (!inTextTag) {
              postparsed.push(part);
              return postparsed;
            }

            chunk.push(part);

            if (isInsideLoop(meta, chunk)) {
              endLindex = meta.basePart.endLindex;
              chunk[0].value = addXMLPreserve(chunk, 0);
            }

            if (isStartingPlaceHolder(part, chunk)) {
              endLindex = part.endLindex;
              chunk[0].value = addXMLPreserve(chunk, 0);
            }

            if (isTextEnd(part) && part.lIndex > endLindex) {
              if (endLindex !== 0) {
                chunk[lastTextTag].value = addXMLPreserve(chunk, lastTextTag);
              }

              Array.prototype.push.apply(postparsed, chunk);
              chunk = [];
              inTextTag = false;
              endLindex = 0;
              lastTextTag = 0;
            }

            return postparsed;
          }, []);
          Array.prototype.push.apply(result, chunk);
          return result;
        },
        postrender: function postrender(parts) {
          var lastNonEmpty = "";
          var lastNonEmptyIndex = 0;
          return parts.reduce(function (newParts, p, index) {
            if (p === "") {
              newParts.push(p);
              return newParts;
            }

            if (p.indexOf('<w:t xml:space="preserve"></w:t>') !== -1) {
              p = p.replace(/<w:t xml:space="preserve"><\/w:t>/g, "<w:t/>");
            }

            if (endsWith(lastNonEmpty, wTpreserve) && startsWith(p, wtEnd)) {
              newParts[lastNonEmptyIndex] = lastNonEmpty.substr(0, lastNonEmpty.length - wTpreservelen) + "<w:t/>";
              p = p.substr(wtEndlen);
            }

            lastNonEmpty = p;
            lastNonEmptyIndex = index;
            newParts.push(p);
            return newParts;
          }, []);
        }
      };

      module.exports = function () {
        return wrapper(spacePreserve);
      };
    }, { "../doc-utils": 2, "../module-wrapper": 8 }], 15: [function (require, module, exports) {
      "use strict";

      function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

      function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

      function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

      var _require = require("./doc-utils"),
        wordToUtf8 = _require.wordToUtf8,
        concatArrays = _require.concatArrays;

      var _require2 = require("./prefix-matcher"),
        match = _require2.match,
        getValue = _require2.getValue,
        getValues = _require2.getValues;

      function moduleParse(placeHolderContent, options) {
        var modules = options.modules;
        var startOffset = options.startOffset;
        var endLindex = options.lIndex;
        var moduleParsed;
        options.offset = startOffset;
        options.lIndex = endLindex;
        options.match = match;
        options.getValue = getValue;
        options.getValues = getValues;

        for (var i = 0, l = modules.length; i < l; i++) {
          var _module = modules[i];
          moduleParsed = _module.parse(placeHolderContent, options);

          if (moduleParsed) {
            moduleParsed.offset = startOffset;
            moduleParsed.endLindex = endLindex;
            moduleParsed.lIndex = endLindex;
            moduleParsed.raw = placeHolderContent;
            return moduleParsed;
          }
        }

        return {
          type: "placeholder",
          value: placeHolderContent,
          offset: startOffset,
          endLindex: endLindex,
          lIndex: endLindex
        };
      }

      var parser = {
        preparse: function preparse(parsed, modules, options) {
          function preparse(parsed, options) {
            return modules.forEach(function (module) {
              module.preparse(parsed, options);
            });
          }

          return {
            preparsed: preparse(parsed, options)
          };
        },
        postparse: function postparse(postparsed, modules, options) {
          function getTraits(traitName, postparsed) {
            return modules.map(function (module) {
              return module.getTraits(traitName, postparsed);
            });
          }

          var errors = [];

          function postparse(postparsed, options) {
            return modules.reduce(function (postparsed, module) {
              var r = module.postparse(postparsed, _objectSpread({}, options, {
                postparse: postparse,
                getTraits: getTraits
              }));

              if (r.errors) {
                errors = concatArrays([errors, r.errors]);
                return r.postparsed;
              }

              return r;
            }, postparsed);
          }

          return {
            postparsed: postparse(postparsed, options),
            errors: errors
          };
        },
        parse: function parse(lexed, modules, options) {
          var inPlaceHolder = false;
          var placeHolderContent = "";
          var startOffset;
          var tailParts = [];
          return lexed.reduce(function lexedToParsed(parsed, token) {
            if (token.type === "delimiter") {
              inPlaceHolder = token.position === "start";

              if (token.position === "end") {
                placeHolderContent = wordToUtf8(placeHolderContent);

                options.parse = function (placeHolderContent) {
                  return moduleParse(placeHolderContent, _objectSpread({}, options, {}, token, {
                    startOffset: startOffset,
                    modules: modules
                  }));
                };

                parsed.push(options.parse(placeHolderContent));
                Array.prototype.push.apply(parsed, tailParts);
                tailParts = [];
              }

              if (token.position === "start") {
                tailParts = [];
                startOffset = token.offset;
              }

              placeHolderContent = "";
              return parsed;
            }

            if (!inPlaceHolder) {
              parsed.push(token);
              return parsed;
            }

            if (token.type !== "content" || token.position !== "insidetag") {
              tailParts.push(token);
              return parsed;
            }

            placeHolderContent += token.value;
            return parsed;
          }, []);
        }
      };
      module.exports = parser;
    }, { "./doc-utils": 2, "./prefix-matcher": 17 }], 16: [function (require, module, exports) {
      "use strict";

      function postrender(parts, options) {
        for (var i = 0, l = options.modules.length; i < l; i++) {
          var _module = options.modules[i];
          parts = _module.postrender(parts, options);
        }

        var contains = options.fileTypeConfig.tagShouldContain || [];
        return options.joinUncorrupt(parts, contains);
      }

      module.exports = postrender;
    }, {}], 17: [function (require, module, exports) {
      "use strict";

      function match(condition, placeHolderContent) {
        if (typeof condition === "string") {
          return placeHolderContent.substr(0, condition.length) === condition;
        }

        if (condition instanceof RegExp) {
          return condition.test(placeHolderContent);
        }
      }

      function getValue(condition, placeHolderContent) {
        if (typeof condition === "string") {
          return placeHolderContent.substr(condition.length);
        }

        if (condition instanceof RegExp) {
          return placeHolderContent.match(condition)[1];
        }
      }

      function getValues(condition, placeHolderContent) {
        if (condition instanceof RegExp) {
          return placeHolderContent.match(condition);
        }
      }

      module.exports = {
        match: match,
        getValue: getValue,
        getValues: getValues
      };
    }, {}], 18: [function (require, module, exports) {
      "use strict";

      var _require = require("./doc-utils"),
        concatArrays = _require.concatArrays;

      var _require2 = require("./errors"),
        throwUnimplementedTagType = _require2.throwUnimplementedTagType;

      function moduleRender(part, options) {
        var moduleRendered;

        for (var i = 0, l = options.modules.length; i < l; i++) {
          var _module = options.modules[i];
          moduleRendered = _module.render(part, options);

          if (moduleRendered) {
            return moduleRendered;
          }
        }

        return false;
      }

      function render(options) {
        var baseNullGetter = options.baseNullGetter;
        var compiled = options.compiled,
          scopeManager = options.scopeManager;

        options.nullGetter = function (part, sm) {
          return baseNullGetter(part, sm || scopeManager);
        };

        if (!options.prefix) {
          options.prefix = "";
        }

        if (options.index) {
          options.prefix = options.prefix + options.index + "-";
        }

        var errors = [];
        var parts = compiled.map(function (part, i) {
          options.index = i;
          var moduleRendered = moduleRender(part, options);

          if (moduleRendered) {
            if (moduleRendered.errors) {
              errors = concatArrays([errors, moduleRendered.errors]);
            }

            return moduleRendered.value;
          }

          if (part.type === "content" || part.type === "tag") {
            return part.value;
          }

          throwUnimplementedTagType(part, i);
        });
        return {
          errors: errors,
          parts: parts
        };
      }

      module.exports = render;
    }, { "./doc-utils": 2, "./errors": 3 }], 19: [function (require, module, exports) {
      "use strict";

      function moduleResolve(part, options) {
        var moduleResolved;

        for (var i = 0, l = options.modules.length; i < l; i++) {
          var _module = options.modules[i];
          moduleResolved = _module.resolve(part, options);

          if (moduleResolved) {
            return moduleResolved;
          }
        }

        return false;
      }

      function resolve(options) {
        var resolved = [];
        var baseNullGetter = options.baseNullGetter;
        var compiled = options.compiled,
          scopeManager = options.scopeManager;

        options.nullGetter = function (part, sm) {
          return baseNullGetter(part, sm || scopeManager);
        };

        options.resolved = resolved;
        var errors = [];
        return Promise.all(compiled.map(function (part) {
          return Promise.resolve().then(function () {
            var moduleResolved = moduleResolve(part, options);

            if (moduleResolved) {
              return moduleResolved.then(function (value) {
                resolved.push({
                  tag: part.value,
                  value: value,
                  lIndex: part.lIndex
                });
              });
            }

            if (part.type === "placeholder") {
              return scopeManager.getValueAsync(part.value, {
                part: part
              }).then(function (value) {
                if (value == null) {
                  value = options.nullGetter(part);
                }

                resolved.push({
                  tag: part.value,
                  value: value,
                  lIndex: part.lIndex
                });
                return value;
              });
            }

            return;
          })["catch"](function (e) {
            errors.push(e);
          });
        }).filter(function (a) {
          return a;
        })).then(function () {
          return {
            errors: errors,
            resolved: resolved
          };
        });
      }

      module.exports = resolve;
    }, {}], 20: [function (require, module, exports) {
      "use strict";

      function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

      function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

      function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

      function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

      function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

      function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

      function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

      var _require = require("./errors"),
        getScopeParserExecutionError = _require.getScopeParserExecutionError;

      var _require2 = require("./utils"),
        last = _require2.last;

      function find(list, fn) {
        var length = list.length >>> 0;
        var value;

        for (var i = 0; i < length; i++) {
          value = list[i];

          if (fn.call(this, value, i, list)) {
            return value;
          }
        }

        return undefined;
      }

      function _getValue(tag, meta, num) {
        var _this = this;

        var scope = this.scopeList[num];

        if (this.resolved) {
          var w = this.resolved;
          this.scopePath.forEach(function (p, index) {
            var lIndex = _this.scopeLindex[index];
            w = find(w, function (r) {
              return r.lIndex === lIndex;
            });
            w = w.value[_this.scopePathItem[index]];
          });
          return [this.scopePath.length - 1, find(w, function (r) {
            return meta.part.lIndex === r.lIndex;
          }).value];
        } // search in the scopes (in reverse order) and keep the first defined value


        var result;
        var parser = this.parser(tag, {
          scopePath: this.scopePath
        });

        try {
          result = parser.get(scope, this.getContext(meta, num));
        } catch (error) {
          throw getScopeParserExecutionError({
            tag: tag,
            scope: scope,
            error: error,
            offset: meta.part.offset
          });
        }

        if (result == null && num > 0) {
          return _getValue.call(this, tag, meta, num - 1);
        }

        return [num, result];
      }

      function _getValueAsync(tag, meta, num) {
        var _this2 = this;

        var scope = this.scopeList[num]; // search in the scopes (in reverse order) and keep the first defined value

        var parser = this.parser(tag, {
          scopePath: this.scopePath
        });
        return Promise.resolve().then(function () {
          return parser.get(scope, _this2.getContext(meta, num));
        })["catch"](function (error) {
          throw getScopeParserExecutionError({
            tag: tag,
            scope: scope,
            error: error,
            offset: meta.part.offset
          });
        }).then(function (result) {
          if (result == null && num > 0) {
            return _getValueAsync.call(_this2, tag, meta, num - 1);
          }

          return result;
        });
      } // This class responsibility is to manage the scope


      var ScopeManager =
        /*#__PURE__*/
        function () {
          function ScopeManager(options) {
            _classCallCheck(this, ScopeManager);

            this.scopePath = options.scopePath;
            this.scopePathItem = options.scopePathItem;
            this.scopePathLength = options.scopePathLength;
            this.scopeList = options.scopeList;
            this.scopeLindex = options.scopeLindex;
            this.parser = options.parser;
            this.resolved = options.resolved;
          }

          _createClass(ScopeManager, [{
            key: "loopOver",
            value: function loopOver(tag, functor, inverted, meta) {
              return this.loopOverValue(this.getValue(tag, meta), functor, inverted);
            }
          }, {
            key: "functorIfInverted",
            value: function functorIfInverted(inverted, functor, value, i, length) {
              if (inverted) {
                functor(value, i, length);
              }

              return inverted;
            }
          }, {
            key: "isValueFalsy",
            value: function isValueFalsy(value, type) {
              return value == null || !value || type === "[object Array]" && value.length === 0;
            }
          }, {
            key: "loopOverValue",
            value: function loopOverValue(value, functor, inverted) {
              if (this.resolved) {
                inverted = false;
              }

              var type = Object.prototype.toString.call(value);

              if (this.isValueFalsy(value, type)) {
                return this.functorIfInverted(inverted, functor, last(this.scopeList), 0, 1);
              }

              if (type === "[object Array]") {
                for (var i = 0; i < value.length; i++) {
                  this.functorIfInverted(!inverted, functor, value[i], i, value.length);
                }

                return true;
              }

              if (type === "[object Object]") {
                return this.functorIfInverted(!inverted, functor, value, 0, 1);
              }

              return this.functorIfInverted(!inverted, functor, last(this.scopeList), 0, 1);
            }
          }, {
            key: "getValue",
            value: function getValue(tag, meta) {
              var _getValue$call = _getValue.call(this, tag, meta, this.scopeList.length - 1),
                _getValue$call2 = _slicedToArray(_getValue$call, 2),
                num = _getValue$call2[0],
                result = _getValue$call2[1];

              this.num = num;
              return result;
            }
          }, {
            key: "getValueAsync",
            value: function getValueAsync(tag, meta) {
              return _getValueAsync.call(this, tag, meta, this.scopeList.length - 1);
            }
          }, {
            key: "getContext",
            value: function getContext(meta, num) {
              return {
                num: num,
                meta: meta,
                scopeList: this.scopeList,
                resolved: this.resolved,
                scopePath: this.scopePath,
                scopePathItem: this.scopePathItem,
                scopePathLength: this.scopePathLength
              };
            }
          }, {
            key: "createSubScopeManager",
            value: function createSubScopeManager(scope, tag, i, part, length) {
              return new ScopeManager({
                resolved: this.resolved,
                parser: this.parser,
                scopeList: this.scopeList.concat(scope),
                scopePath: this.scopePath.concat(tag),
                scopePathItem: this.scopePathItem.concat(i),
                scopePathLength: this.scopePathLength.concat(length),
                scopeLindex: this.scopeLindex.concat(part.lIndex)
              });
            }
          }]);

          return ScopeManager;
        }();

      module.exports = function (options) {
        options.scopePath = [];
        options.scopePathItem = [];
        options.scopePathLength = [];
        options.scopeLindex = [];
        options.scopeList = [options.tags];
        return new ScopeManager(options);
      };
    }, { "./errors": 3, "./utils": 22 }], 21: [function (require, module, exports) {
      "use strict";

      function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

      function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

      function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

      function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

      var _require = require("./doc-utils"),
        getRightOrNull = _require.getRightOrNull,
        getRight = _require.getRight,
        getLeft = _require.getLeft,
        getLeftOrNull = _require.getLeftOrNull,
        concatArrays = _require.concatArrays,
        chunkBy = _require.chunkBy,
        isTagStart = _require.isTagStart,
        isTagEnd = _require.isTagEnd,
        isContent = _require.isContent,
        last = _require.last,
        first = _require.first;

      var _require2 = require("./errors"),
        XTTemplateError = _require2.XTTemplateError,
        throwExpandNotFound = _require2.throwExpandNotFound,
        getLoopPositionProducesInvalidXMLError = _require2.getLoopPositionProducesInvalidXMLError;

      function lastTagIsOpenTag(tags, tag) {
        if (tags.length === 0) {
          return false;
        }

        var innerLastTag = last(tags).tag.substr(1);
        var innerCurrentTag = tag.substr(2, tag.length - 3);
        return innerLastTag.indexOf(innerCurrentTag) === 0;
      }

      function addTag(tags, tag) {
        tags.push({
          tag: tag
        });
        return tags;
      }

      function getListXmlElements(parts) {
        /*
        get the different closing and opening tags between two texts (doesn't take into account tags that are opened then closed (those that are closed then opened are returned)):
        returns:[{"tag":"</w:r>","offset":13},{"tag":"</w:p>","offset":265},{"tag":"</w:tc>","offset":271},{"tag":"<w:tc>","offset":828},{"tag":"<w:p>","offset":883},{"tag":"<w:r>","offset":1483}]
        */
        var tags = parts.filter(function (part) {
          return part.type === "tag";
        });
        var result = [];

        for (var i = 0, tag; i < tags.length; i++) {
          tag = tags[i].value; // closing tag

          if (tag[1] === "/") {
            if (lastTagIsOpenTag(result, tag)) {
              result.pop();
            } else {
              result = addTag(result, tag);
            }
          } else if (tag[tag.length - 2] !== "/") {
            result = addTag(result, tag);
          }
        }

        return result;
      }

      function has(name, xmlElements) {
        for (var i = 0; i < xmlElements.length; i++) {
          var xmlElement = xmlElements[i];

          if (xmlElement.tag.indexOf("<".concat(name)) === 0) {
            return true;
          }
        }

        return false;
      }

      function getExpandToDefault(postparsed, pair, expandTags) {
        var parts = postparsed.slice(pair[0].offset, pair[1].offset);
        var xmlElements = getListXmlElements(parts);
        var closingTagCount = xmlElements.filter(function (xmlElement) {
          return xmlElement.tag[1] === "/";
        }).length;
        var startingTagCount = xmlElements.filter(function (xmlElement) {
          var tag = xmlElement.tag;
          return tag[1] !== "/" && tag[tag.length - 2] !== "/";
        }).length;

        if (closingTagCount !== startingTagCount) {
          return {
            error: getLoopPositionProducesInvalidXMLError({
              tag: first(pair).part.value,
              offset: [first(pair).part.offset, last(pair).part.offset]
            })
          };
        }

        var _loop = function _loop(i, len) {
          var _expandTags$i = expandTags[i],
            contains = _expandTags$i.contains,
            expand = _expandTags$i.expand,
            onlyTextInTag = _expandTags$i.onlyTextInTag;

          if (has(contains, xmlElements)) {
            if (onlyTextInTag) {
              var left = getLeftOrNull(postparsed, contains, pair[0].offset);
              var right = getRightOrNull(postparsed, contains, pair[1].offset);

              if (left === null || right === null) {
                return "continue";
              }

              var chunks = chunkBy(postparsed.slice(left, right), function (p) {
                if (isTagStart(contains, p)) {
                  return "start";
                }

                if (isTagEnd(contains, p)) {
                  return "end";
                }

                return null;
              });

              if (chunks.length <= 2) {
                return "continue";
              }

              var firstChunk = first(chunks);
              var lastChunk = last(chunks);
              var firstContent = firstChunk.filter(isContent);
              var lastContent = lastChunk.filter(isContent);

              if (firstContent.length !== 1 || lastContent.length !== 1) {
                return "continue";
              }
            }

            return {
              v: {
                value: expand
              }
            };
          }
        };

        for (var i = 0, len = expandTags.length; i < len; i++) {
          var _ret = _loop(i, len);

          switch (_ret) {
            case "continue":
              continue;

            default:
              if (_typeof(_ret) === "object") return _ret.v;
          }
        }

        return false;
      }

      function expandOne(part, postparsed, options) {
        var expandTo = part.expandTo || options.expandTo;
        var index = postparsed.indexOf(part);

        if (!expandTo) {
          return postparsed;
        }

        var right, left;

        try {
          left = getLeft(postparsed, expandTo, index);
          right = getRight(postparsed, expandTo, index);
        } catch (rootError) {
          if (rootError instanceof XTTemplateError) {
            throwExpandNotFound(_objectSpread({
              part: part,
              rootError: rootError,
              postparsed: postparsed,
              expandTo: expandTo,
              index: index
            }, options.error));
          }

          throw rootError;
        }

        var leftParts = postparsed.slice(left, index);
        var rightParts = postparsed.slice(index + 1, right + 1);
        var inner = options.getInner({
          postparse: options.postparse,
          index: index,
          part: part,
          leftParts: leftParts,
          rightParts: rightParts,
          left: left,
          right: right,
          postparsed: postparsed
        });

        if (!inner.length) {
          inner.expanded = [leftParts, rightParts];
          inner = [inner];
        }

        return concatArrays([postparsed.slice(0, left), inner, postparsed.slice(right + 1)]);
      }

      function expandToOne(postparsed, options) {
        var errors = [];

        if (postparsed.errors) {
          errors = postparsed.errors;
          postparsed = postparsed.postparsed;
        }

        var expandToElements = postparsed.reduce(function (elements, part) {
          if (part.type === "placeholder" && part.module === options.moduleName) {
            elements.push(part);
          }

          return elements;
        }, []);
        expandToElements.forEach(function (part) {
          try {
            postparsed = expandOne(part, postparsed, options);
          } catch (error) {
            if (error instanceof XTTemplateError) {
              errors.push(error);
            } else {
              throw error;
            }
          }
        });
        return {
          postparsed: postparsed,
          errors: errors
        };
      }

      module.exports = {
        expandToOne: expandToOne,
        getExpandToDefault: getExpandToDefault
      };
    }, { "./doc-utils": 2, "./errors": 3 }], 22: [function (require, module, exports) {
      "use strict";

      function last(a) {
        return a[a.length - 1];
      }

      function first(a) {
        return a[0];
      }

      module.exports = {
        last: last,
        first: first
      };
    }, {}], 23: [function (require, module, exports) {
      "use strict"; // res class responsibility is to parse the XML.

      var _require = require("./doc-utils"),
        pregMatchAll = _require.pregMatchAll;

      function handleRecursiveCase(res) {
        /*
         * Because xmlTemplater is recursive (meaning it can call it self), we need to handle special cases where the XML is not valid:
         * For example with res string "I am</w:t></w:r></w:p><w:p><w:r><w:t>sleeping",
         *   - we need to match also the string that is inside an implicit <w:t> (that's the role of replacerUnshift) (in res case 'I am')
         *   - we need to match the string that is at the right of a <w:t> (that's the role of replacerPush) (in res case 'sleeping')
         * the test: describe "scope calculation" it "should compute the scope between 2 <w:t>" makes sure that res part of code works
         * It should even work if they is no XML at all, for example if the code is just "I am sleeping", in res case however, they should only be one match
         */
        function replacerUnshift() {
          var pn = {
            array: Array.prototype.slice.call(arguments)
          };
          pn.array.shift();
          var match = pn.array[0] + pn.array[1]; // add match so that pn[0] = whole match, pn[1]= first parenthesis,...

          pn.array.unshift(match);
          pn.array.pop();
          var offset = pn.array.pop();
          pn.offset = offset;
          pn.first = true; // add at the beginning

          res.matches.unshift(pn);
        }

        if (res.content.indexOf("<") === -1 && res.content.indexOf(">") === -1) {
          res.content.replace(/^()([^<>]*)$/, replacerUnshift);
        }

        var r = new RegExp("^()([^<]+)</(?:".concat(res.tagsXmlArrayJoined, ")>"));
        res.content.replace(r, replacerUnshift);

        function replacerPush() {
          var pn = {
            array: Array.prototype.slice.call(arguments)
          };
          pn.array.pop();
          var offset = pn.array.pop();
          pn.offset = offset;
          pn.last = true;

          if (pn.array[0].indexOf("/>") !== -1) {
            return;
          } // add at the end


          res.matches.push(pn);
        }

        r = new RegExp("(<(?:".concat(res.tagsXmlArrayJoined, ")[^>]*>)([^>]+)$"));
        res.content.replace(r, replacerPush);
        return res;
      }

      module.exports = function xmlMatcher(content, tagsXmlArray) {
        var res = {};
        res.content = content;
        res.tagsXmlArray = tagsXmlArray;
        res.tagsXmlArrayJoined = res.tagsXmlArray.join("|");
        var regexp = new RegExp("(?:(<(?:".concat(res.tagsXmlArrayJoined, ")[^>]*>)([^<>]*)</(?:").concat(res.tagsXmlArrayJoined, ")>)|(<(?:").concat(res.tagsXmlArrayJoined, ")[^>]*/>)"), "g");
        res.matches = pregMatchAll(regexp, res.content);
        return handleRecursiveCase(res);
      };
    }, { "./doc-utils": 2 }], 24: [function (require, module, exports) {
      "use strict";

      function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

      function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

      function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

      function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

      var _require = require("./doc-utils"),
        wordToUtf8 = _require.wordToUtf8,
        convertSpaces = _require.convertSpaces,
        defaults = _require.defaults;

      var createScope = require("./scope-manager");

      var xmlMatcher = require("./xml-matcher");

      var _require2 = require("./errors"),
        throwMultiError = _require2.throwMultiError,
        throwContentMustBeString = _require2.throwContentMustBeString;

      var Lexer = require("./lexer");

      var Parser = require("./parser.js");

      var _render = require("./render.js");

      var postrender = require("./postrender.js");

      var resolve = require("./resolve.js");

      var joinUncorrupt = require("./join-uncorrupt");

      function _getFullText(content, tagsXmlArray) {
        var matcher = xmlMatcher(content, tagsXmlArray);
        var result = matcher.matches.map(function (match) {
          return match.array[2];
        });
        return wordToUtf8(convertSpaces(result.join("")));
      }

      module.exports =
        /*#__PURE__*/
        function () {
          function XmlTemplater(content, options) {
            _classCallCheck(this, XmlTemplater);

            this.filePath = options.filePath;
            this.modules = options.modules;
            this.fileTypeConfig = options.fileTypeConfig;
            Object.keys(defaults).map(function (key) {
              this[key] = options[key] != null ? options[key] : defaults[key];
            }, this);
            this.setModules({
              inspect: {
                filePath: this.filePath
              }
            });
            this.load(content);
          }

          _createClass(XmlTemplater, [{
            key: "load",
            value: function load(content) {
              if (typeof content !== "string") {
                throwContentMustBeString(_typeof(content));
              }

              this.content = content;
            }
          }, {
            key: "setTags",
            value: function setTags(tags) {
              this.tags = tags != null ? tags : {};
              this.scopeManager = createScope({
                tags: this.tags,
                parser: this.parser
              });
              return this;
            }
          }, {
            key: "resolveTags",
            value: function resolveTags(tags) {
              var _this = this;

              this.tags = tags != null ? tags : {};
              this.scopeManager = createScope({
                tags: this.tags,
                parser: this.parser
              });
              var options = this.getOptions();
              options.scopeManager = createScope(options);
              options.resolve = resolve;
              return resolve(options).then(function (_ref) {
                var resolved = _ref.resolved,
                  errors = _ref.errors;

                if (errors.length !== 0) {
                  throw errors;
                }

                return Promise.all(resolved.map(function (r) {
                  return Promise.resolve(r);
                })).then(function (resolved) {
                  _this.setModules({
                    inspect: {
                      resolved: resolved
                    }
                  });

                  return _this.resolved = resolved;
                });
              });
            }
          }, {
            key: "getFullText",
            value: function getFullText() {
              return _getFullText(this.content, this.fileTypeConfig.tagsXmlTextArray);
            }
          }, {
            key: "setModules",
            value: function setModules(obj) {
              this.modules.forEach(function (module) {
                module.set(obj);
              });
            }
          }, {
            key: "preparse",
            value: function preparse() {
              this.allErrors = [];
              this.xmllexed = Lexer.xmlparse(this.content, {
                text: this.fileTypeConfig.tagsXmlTextArray,
                other: this.fileTypeConfig.tagsXmlLexedArray
              });
              this.setModules({
                inspect: {
                  xmllexed: this.xmllexed
                }
              });

              var _Lexer$parse = Lexer.parse(this.xmllexed, this.delimiters),
                lexed = _Lexer$parse.lexed,
                lexerErrors = _Lexer$parse.errors;

              this.allErrors = this.allErrors.concat(lexerErrors);
              this.lexed = lexed;
              this.setModules({
                inspect: {
                  lexed: this.lexed
                }
              });
              var options = this.getOptions();
              Parser.preparse(this.lexed, this.modules, options);
            }
          }, {
            key: "parse",
            value: function parse() {
              this.setModules({
                inspect: {
                  filePath: this.filePath
                }
              });
              var options = this.getOptions();
              this.parsed = Parser.parse(this.lexed, this.modules, options);
              this.setModules({
                inspect: {
                  parsed: this.parsed
                }
              });

              var _Parser$postparse = Parser.postparse(this.parsed, this.modules, options),
                postparsed = _Parser$postparse.postparsed,
                postparsedErrors = _Parser$postparse.errors;

              this.postparsed = postparsed;
              this.setModules({
                inspect: {
                  postparsed: this.postparsed
                }
              });
              this.allErrors = this.allErrors.concat(postparsedErrors);
              this.errorChecker(this.allErrors);
              return this;
            }
          }, {
            key: "errorChecker",
            value: function errorChecker(errors) {
              var _this2 = this;

              if (errors.length) {
                this.modules.forEach(function (module) {
                  errors = module.errorsTransformer(errors);
                });
                errors.forEach(function (error) {
                  error.properties.file = _this2.filePath;
                });
                throwMultiError(errors);
              }
            }
          }, {
            key: "baseNullGetter",
            value: function baseNullGetter(part, sm) {
              var _this3 = this;

              var value = this.modules.reduce(function (value, module) {
                if (value != null) {
                  return value;
                }

                return module.nullGetter(part, sm, _this3);
              }, null);

              if (value != null) {
                return value;
              }

              return this.nullGetter(part, sm);
            }
          }, {
            key: "getOptions",
            value: function getOptions() {
              return {
                compiled: this.postparsed,
                tags: this.tags,
                modules: this.modules,
                parser: this.parser,
                baseNullGetter: this.baseNullGetter.bind(this),
                filePath: this.filePath,
                fileTypeConfig: this.fileTypeConfig,
                linebreaks: this.linebreaks
              };
            }
          }, {
            key: "render",
            value: function render(to) {
              this.filePath = to;
              var options = this.getOptions();
              options.resolved = this.resolved;
              options.scopeManager = createScope(options);
              options.render = _render;
              options.joinUncorrupt = joinUncorrupt;

              var _render2 = _render(options),
                errors = _render2.errors,
                parts = _render2.parts;


              this.errorChecker(errors);
              this.content = postrender(parts, options);
              this.setModules({
                inspect: {
                  content: this.content
                }
              });
              return this;
            }
          }]);

          return XmlTemplater;
        }();
    }, { "./doc-utils": 2, "./errors": 3, "./join-uncorrupt": 5, "./lexer": 6, "./parser.js": 15, "./postrender.js": 16, "./render.js": 18, "./resolve.js": 19, "./scope-manager": 20, "./xml-matcher": 23 }], "/src/js/docxtemplater.js": [function (require, module, exports) {
      "use strict";

      function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

      function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

      function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

      var DocUtils = require("./doc-utils");

      DocUtils.traits = require("./traits");
      DocUtils.moduleWrapper = require("./module-wrapper");

      var _require = require("./errors"),
        throwMultiError = _require.throwMultiError;

      var commonModule = require("./modules/common");

      var ctXML = "[Content_Types].xml";

      var Lexer = require("./lexer");

      var defaults = DocUtils.defaults,
        str2xml = DocUtils.str2xml,
        xml2str = DocUtils.xml2str,
        moduleWrapper = DocUtils.moduleWrapper,
        utf8ToWord = DocUtils.utf8ToWord,
        concatArrays = DocUtils.concatArrays,
        unique = DocUtils.unique;

      var _require2 = require("./errors"),
        XTInternalError = _require2.XTInternalError,
        throwFileTypeNotIdentified = _require2.throwFileTypeNotIdentified,
        throwFileTypeNotHandled = _require2.throwFileTypeNotHandled,
        throwApiVersionError = _require2.throwApiVersionError;

      var currentModuleApiVersion = [3, 21, 0];

      var Docxtemplater =
        /*#__PURE__*/
        function () {
          function Docxtemplater() {
            _classCallCheck(this, Docxtemplater);

            if (arguments.length > 0) {
              throw new Error("The constructor with parameters has been removed in docxtemplater 3, please check the upgrade guide.");
            }

            this.compiled = {};
            this.modules = [commonModule()];
            this.setOptions({});
          }

          _createClass(Docxtemplater, [{
            key: "getModuleApiVersion",
            value: function getModuleApiVersion() {
              return currentModuleApiVersion.join(".");
            }
          }, {
            key: "verifyApiVersion",
            value: function verifyApiVersion(neededVersion) {
              neededVersion = neededVersion.split(".").map(function (i) {
                return parseInt(i, 10);
              });

              if (neededVersion.length !== 3) {
                throwApiVersionError("neededVersion is not a valid version", {
                  neededVersion: neededVersion,
                  explanation: "the neededVersion must be an array of length 3"
                });
              }

              if (neededVersion[0] !== currentModuleApiVersion[0]) {
                throwApiVersionError("The major api version do not match, you probably have to update docxtemplater with npm install --save docxtemplater", {
                  neededVersion: neededVersion,
                  currentModuleApiVersion: currentModuleApiVersion,
                  explanation: "moduleAPIVersionMismatch : needed=".concat(neededVersion.join("."), ", current=").concat(currentModuleApiVersion.join("."))
                });
              }

              if (neededVersion[1] > currentModuleApiVersion[1]) {
                throwApiVersionError("The minor api version is not uptodate, you probably have to update docxtemplater with npm install --save docxtemplater", {
                  neededVersion: neededVersion,
                  currentModuleApiVersion: currentModuleApiVersion,
                  explanation: "moduleAPIVersionMismatch : needed=".concat(neededVersion.join("."), ", current=").concat(currentModuleApiVersion.join("."))
                });
              }

              return true;
            }
          }, {
            key: "setModules",
            value: function setModules(obj) {
              this.modules.forEach(function (module) {
                module.set(obj);
              });
            }
          }, {
            key: "sendEvent",
            value: function sendEvent(eventName) {
              this.modules.forEach(function (module) {
                module.on(eventName);
              });
            }
          }, {
            key: "attachModule",
            value: function attachModule(module) {
              var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

              if (module.requiredAPIVersion) {
                this.verifyApiVersion(module.requiredAPIVersion);
              }

              if (module.attached === true) {
                throw new Error("Cannot attach a module that was already attached");
              }

              module.attached = true;
              var prefix = options.prefix;

              if (prefix) {
                module.prefix = prefix;
              }

              var wrappedModule = moduleWrapper(module);
              this.modules.push(wrappedModule);
              wrappedModule.on("attached");
              return this;
            }
          }, {
            key: "setOptions",
            value: function setOptions(options) {
              var _this = this;

              if (!options) {
                throw new Error("setOptions should be called with an object as first parameter");
              }

              if (options.delimiters) {
                options.delimiters.start = utf8ToWord(options.delimiters.start);
                options.delimiters.end = utf8ToWord(options.delimiters.end);
              }

              this.options = options;
              Object.keys(defaults).forEach(function (key) {
                var defaultValue = defaults[key];
                _this.options[key] = _this.options[key] != null ? _this.options[key] : defaultValue;
                _this[key] = _this.options[key];
              });

              if (this.zip) {
                this.updateFileTypeConfig();
              }

              return this;
            }
          }, {
            key: "loadZip",
            value: function loadZip(zip) {
              if (zip.loadAsync) {
                throw new XTInternalError("Docxtemplater doesn't handle JSZip version >=3, please use pizzip");
              }

              this.zip = zip;
              this.updateFileTypeConfig();
              this.modules = concatArrays([this.fileTypeConfig.baseModules.map(function (moduleFunction) {
                return moduleFunction();
              }), this.modules]);
              return this;
            }
          }, {
            key: "compileFile",
            value: function compileFile(fileName) {
              this.compiled[fileName].parse();
            }
          }, {
            key: "precompileFile",
            value: function precompileFile(fileName) {
              var currentFile = this.createTemplateClass(fileName);
              currentFile.preparse();
              this.compiled[fileName] = currentFile;
            }
          }, {
            key: "resolveData",
            value: function resolveData(data) {
              var _this2 = this;

              var errors = [];
              return Promise.resolve(data).then(function (data) {
                return Promise.all(Object.keys(_this2.compiled).map(function (from) {
                  var currentFile = _this2.compiled[from];
                  return currentFile.resolveTags(data)["catch"](function (errs) {
                    errors = errors.concat(errs);
                  });
                }));
              }).then(function (resolved) {
                if (errors.length !== 0) {
                  throwMultiError(errors);
                }

                return concatArrays(resolved);
              });
            }
          }, {
            key: "compile",
            value: function compile() {
              var _this3 = this;

              if (Object.keys(this.compiled).length) {
                return this;
              }

              this.options = this.modules.reduce(function (options, module) {
                return module.optionsTransformer(options, _this3);
              }, this.options);
              this.options.xmlFileNames = unique(this.options.xmlFileNames);
              this.xmlDocuments = this.options.xmlFileNames.reduce(function (xmlDocuments, fileName) {
                var content = _this3.zip.files[fileName].asText();

                xmlDocuments[fileName] = str2xml(content);
                return xmlDocuments;
              }, {});
              this.setModules({
                zip: this.zip,
                xmlDocuments: this.xmlDocuments
              });
              this.getTemplatedFiles();
              this.setModules({
                compiled: this.compiled
              }); // Loop inside all templatedFiles (ie xml files with content).
              // Sometimes they don't exist (footer.xml for example)

              this.templatedFiles.forEach(function (fileName) {
                if (_this3.zip.files[fileName] != null) {
                  _this3.precompileFile(fileName);
                }
              });
              this.templatedFiles.forEach(function (fileName) {
                if (_this3.zip.files[fileName] != null) {
                  _this3.compileFile(fileName);
                }
              });
              return this;
            }
          }, {
            key: "updateFileTypeConfig",
            value: function updateFileTypeConfig() {
              var _this4 = this;

              var fileType;

              if (this.zip.files.mimetype) {
                fileType = "odt";
              }

              var contentTypes = this.zip.files[ctXML];
              this.targets = [];
              var contentTypeXml = contentTypes ? str2xml(contentTypes.asText()) : null;
              var overrides = contentTypeXml ? contentTypeXml.getElementsByTagName("Override") : null;
              var defaults = contentTypeXml ? contentTypeXml.getElementsByTagName("Default") : null;
              this.modules.forEach(function (module) {
                fileType = module.getFileType({
                  zip: _this4.zip,
                  contentTypes: contentTypes,
                  contentTypeXml: contentTypeXml,
                  overrides: overrides,
                  defaults: defaults,
                  doc: _this4
                }) || fileType;
              });

              if (fileType === "odt") {
                throwFileTypeNotHandled(fileType);
              }

              if (!fileType) {
                throwFileTypeNotIdentified();
              }

              this.fileType = fileType;
              this.fileTypeConfig = this.options.fileTypeConfig || this.fileTypeConfig || Docxtemplater.FileTypeConfig[this.fileType];
              return this;
            }
          }, {
            key: "render",
            value: function render() {
              var _this5 = this;

              this.compile();
              this.setModules({
                data: this.data,
                Lexer: Lexer
              });
              this.mapper = this.modules.reduce(function (value, module) {
                return module.getRenderedMap(value);
              }, {});
              this.fileTypeConfig.tagsXmlLexedArray = unique(this.fileTypeConfig.tagsXmlLexedArray);
              this.fileTypeConfig.tagsXmlTextArray = unique(this.fileTypeConfig.tagsXmlTextArray);
              Object.keys(this.mapper).forEach(function (to) {
                var _this5$mapper$to = _this5.mapper[to],
                  from = _this5$mapper$to.from,
                  data = _this5$mapper$to.data;
                var currentFile = _this5.compiled[from];
                currentFile.setTags(data);
                currentFile.render(to);

                _this5.zip.file(to, currentFile.content, {
                  createFolders: true
                });
              });
              this.sendEvent("syncing-zip");
              this.syncZip();
              return this;
            }
          }, {
            key: "syncZip",
            value: function syncZip() {
              var _this6 = this;

              Object.keys(this.xmlDocuments).forEach(function (fileName) {
                _this6.zip.remove(fileName);

                var content = xml2str(_this6.xmlDocuments[fileName]);
                return _this6.zip.file(fileName, content, {
                  createFolders: true
                });
              });
            }
          }, {
            key: "setData",
            value: function setData(data) {
              this.data = data;
              return this;
            }
          }, {
            key: "getZip",
            value: function getZip() {
              return this.zip;
            }
          }, {
            key: "createTemplateClass",
            value: function createTemplateClass(path) {
              var content = this.zip.files[path].asText();
              return this.createTemplateClassFromContent(content, path);
            }
          }, {
            key: "createTemplateClassFromContent",
            value: function createTemplateClassFromContent(content, filePath) {
              var _this7 = this;

              var xmltOptions = {
                filePath: filePath
              };
              Object.keys(defaults).forEach(function (key) {
                xmltOptions[key] = _this7[key];
              });
              xmltOptions.fileTypeConfig = this.fileTypeConfig;
              xmltOptions.modules = this.modules;
              return new Docxtemplater.XmlTemplater(content, xmltOptions);
            }
          }, {
            key: "getFullText",
            value: function getFullText(path) {
              return this.createTemplateClass(path || this.fileTypeConfig.textPath(this)).getFullText();
            }
          }, {
            key: "getTemplatedFiles",
            value: function getTemplatedFiles() {
              var _this8 = this;

              this.templatedFiles = this.fileTypeConfig.getTemplatedFiles(this.zip);
              this.targets.forEach(function (target) {
                _this8.templatedFiles.push(target);
              });
              return this.templatedFiles;
            }
          }]);

          return Docxtemplater;
        }();

      Docxtemplater.DocUtils = DocUtils;
      Docxtemplater.Errors = require("./errors");
      Docxtemplater.XmlTemplater = require("./xml-templater");
      Docxtemplater.FileTypeConfig = require("./file-type-config");
      Docxtemplater.XmlMatcher = require("./xml-matcher");
      module.exports = Docxtemplater;
    }, { "./doc-utils": 2, "./errors": 3, "./file-type-config": 4, "./lexer": 6, "./module-wrapper": 8, "./modules/common": 9, "./traits": 21, "./xml-matcher": 23, "./xml-templater": 24 }]
  }, {}, [])("/src/js/docxtemplater.js")
});