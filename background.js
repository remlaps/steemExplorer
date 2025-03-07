// background.js
chrome.action.onClicked.addListener(function() {
    chrome.windows.create({
      url: chrome.runtime.getURL("explorer.html"),
      type: "popup",
      width: 1200,
      height: 800
    });
  });