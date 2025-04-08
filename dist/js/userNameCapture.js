/******/ (() => { // webpackBootstrap
/*!***********************************!*\
  !*** ./src/js/userNameCapture.js ***!
  \***********************************/
var UserID = document.getElementById('txtLogin');
var loginButton = document.getElementById('imgbtnLogin');
window.addEventListener('beforeunload', function (event) {
  saveUserName(UserID.value);
});
function saveUserName(userName) {
  chrome.storage.local.set({
    "userName": userName
  }, function () {});
}
/******/ })()
;
//# sourceMappingURL=userNameCapture.js.map