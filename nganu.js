const tradingBalance = $(
  ".trading-wrap.trading-equity.equity-top div:first-child b"
)
  .text()
  .replace(/\D/g, "");

const totalEquity = $(
  ".trading-wrap.trading-equity.equity-top div:last-child b"
)
  .text()
  .replace(/\D/g, "");

const capital = parseInt(tradingBalance, 10) + parseInt(totalEquity, 10);
chrome.storage.local.set({ capital });

await new Promise((r) => setTimeout(r, 2000));

alert("aaa");
