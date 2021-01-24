function updateToken() {
  if (window.location.href === "https://stockbit.com/#/trade/portfolio") {
    const token = atob(localStorage.getItem("at"));
    const pin = window.localStorage.tpt;

    chrome.storage.local.set({ token: token, pin: pin }, function () {
      console.log("Perintis is now configured! You're ready to be rich.");
    });
  }
}

updateToken();

window.onpopstate = function (event) {
  updateToken();
};
