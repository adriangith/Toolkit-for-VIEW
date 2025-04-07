/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/js/contentScriptFetch.js":
/*!**************************************!*\
  !*** ./src/js/contentScriptFetch.js ***!
  \**************************************/
/***/ (() => {

eval("chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {\r\n    (async () => {\r\n        await fetchRetry(msg.url, msg.fetchOptions)\r\n        sendResponse(\"done\");\r\n    })();\r\n    return true;\r\n});\r\n\r\nconst fetchTimeout = (url, options = {}) => {\r\n    let { timeout = 5000, ...rest } = options;\r\n    if (rest.signal) throw new Error(\"Signal not supported in timeoutable fetch\");\r\n    const controller = new AbortController();\r\n    const { signal } = controller;\r\n    return new Promise((resolve, reject) => {\r\n        const timer = setTimeout(() => {\r\n            reject(new Error(\"Timeout for Promise\"));\r\n            controller.abort();\r\n        }, timeout);\r\n        fetch(url, { signal, ...rest })\r\n            .finally(() => clearTimeout(timer))\r\n            .then(resolve, reject);\r\n    });\r\n};\r\n\r\nconst fetchRetry = (url, options, n = 2) => fetchTimeout(url, options).catch(function (error) {\r\n    if (n === 1) throw error;\r\n    return fetchRetry(url, options, n - 1);\r\n});\r\n\r\nchrome.runtime.sendMessage({function: \"sameSiteCookieMaker\"}, function(response) {\r\n    console.log(response.message);\r\n  });\r\n\r\n\n\n//# sourceURL=webpack://Toolkit-for-VIEW/./src/js/contentScriptFetch.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/js/contentScriptFetch.js"]();
/******/ 	
/******/ })()
;