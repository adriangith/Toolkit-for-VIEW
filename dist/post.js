const loadingBar = new ldBar(document.getElementById("myItem1"));

var onMessageHandler = function (message) {
  // Ensure it is run only once, as we will try to message twice
  chrome.runtime.onMessage.removeListener(onMessageHandler);
  const parser = new DOMParser();
  const htmlDocument = parser.parseFromString(message.data, "text/html");

  const formElement = htmlDocument.querySelector("form");
  formElement.setAttribute("method", "post");
  formElement.setAttribute("action", message.url);
  formElement.removeAttribute("onsubmit");
  formElement.style.display = "none";
  document.body.appendChild(formElement);
  formElement.submit();
}

chrome.runtime.onMessage.addListener(onMessageHandler);

chrome.runtime.onConnect.addListener(function (port) {
  console.log('Connected');
  port.onMessage.addListener(function (msg) {
    loadingBar.set(Math.ceil((msg.addedCount / msg.obligationCount * 90 + 10)));
    console.log(Math.ceil((msg.addedCount / msg.obligationCount * 90 + 10)));
  })
})