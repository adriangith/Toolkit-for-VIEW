document.getElementById("Utilities").addEventListener("click", () => openUtilities());

function openUtilities() {
  chrome.tabs.create({ url: chrome.extension.getURL("popup/Utilities.html") });
}