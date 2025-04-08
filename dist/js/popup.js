/******/ (() => { // webpackBootstrap
/*!****************************!*\
  !*** ./src/popup/index.js ***!
  \****************************/
document.getElementById("Utilities").addEventListener("click", function () {
  return openUtilities();
});
function openUtilities() {
  chrome.tabs.create({
    url: chrome.extension.getURL("popup/Utilities.html")
  });
}
/******/ })()
;
//# sourceMappingURL=popup.js.map