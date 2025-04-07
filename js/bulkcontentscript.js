

var onMessageHandler = function(message){
  // Ensure it is run only once, as we will try to message twice
  chrome.runtime.onMessage.removeListener(onMessageHandler);
	const parser = new DOMParser();
    const htmlDocument = parser.parseFromString(message.data, "text/html");
  const formElement = htmlDocument.documentElement.querySelector("form");
  formElement.setAttribute("method", "post");
  formElement.setAttribute("action", message.url);
  formElement.removeAttribute("onsubmit");
  // code from https://stackoverflow.com/a/7404033/934239
console.log(formElement);
document.body.appendChild(formElement);
  formElement.submit();
}

chrome.runtime.onMessage.addListener(onMessageHandler);