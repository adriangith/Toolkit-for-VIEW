import { ChromeMessageListenerCallback } from './types';

const loadingBar = new ldBar(document.getElementById("myItem1"));

// Handle the bulk page from the background script to submit the form
const onMessageHandler: ChromeMessageListenerCallback = function (message) {
    if (message.type !== "loadPage") return;
    // Ensure it is run only once, as we will try to message twice
    chrome.runtime.onMessage.removeListener(onMessageHandler);
    const parser = new DOMParser();
    const htmlDocument = parser.parseFromString(message.data, "text/html");

    const formElement = htmlDocument.querySelector("form");
    if (!formElement) {
        throw new Error("No form found in the HTML document.");
    }

    formElement.setAttribute("method", "post");
    formElement.setAttribute("action", message.url);
    formElement.removeAttribute("onsubmit");
    formElement.style.display = "none";
    document.body.appendChild(formElement);
    formElement.submit();
}

chrome.runtime.onMessage.addListener(onMessageHandler);

chrome.runtime.onConnect.addListener(function (port) {
    if (process.env.IS_DEV) console.log('Connected');
    port.onMessage.addListener(function (msg) {
        loadingBar.set(Math.ceil((msg.addedCount / msg.obligationCount * 90 + 10)));
        if (process.env.IS_DEV) console.log(Math.ceil((msg.addedCount / msg.obligationCount * 90 + 10)));
    })
})