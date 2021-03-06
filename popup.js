const $error = $("#error");
const $capital = $("#capital");
const $enhanceButton = $("button#enhance");

chrome.storage.local.get(["token", "pin"], function (data) {
  if (!data.token || !data.pin) {
    $error.text("Please open portfolio page to run Perintis");
  }
});

chrome.storage.local.remove("cache");

$enhanceButton.click(function (element) {
  const capital = $capital.val();

  chrome.storage.local.set({ capital }, function () {
    let color = element.target.value;
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentUrl = tabs[0].url;

      if (currentUrl !== "https://stockbit.com/#/trade/portfolio") {
        alert("Enhance information can only be run on portfolio page");
      } else {
        chrome.tabs.executeScript(tabs[0].id, {
          file: "enhance.js",
        });
      }
    });
  });
});
