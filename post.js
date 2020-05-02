var onMessageHandler = function(message){
  // Ensure it is run only once, as we will try to message twice
  console.log('test');
  chrome.runtime.onMessage.removeListener(onMessageHandler);
	const parser = new DOMParser();
  const htmlDocument = parser.parseFromString(message.data, "text/html");
  const formElement = htmlDocument.documentElement.querySelector("form");
  formElement.setAttribute("method", "post");
  formElement.setAttribute("action", message.url);
  formElement.removeAttribute("onsubmit");
  document.body.appendChild(formElement);
  formElement.submit();
}

chrome.runtime.onMessage.addListener(onMessageHandler);