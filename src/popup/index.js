document.getElementById("Utilities").addEventListener("click", () => openUtilities());

function openUtilities() {
  chrome.tabs.create({ url: chrome.runtime.getURL("popup/utilities.html") });
}
