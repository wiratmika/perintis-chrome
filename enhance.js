let $table = $("#trading-box table:not(.ant-table-fixed)");

function calculate(holding, price, index, date, capital) {
  result = {};
  activeIndex = indices[index][date];
  totalMarketCap = Object.values(activeIndex).reduce(function (
    accumulator,
    currentValue
  ) {
    return accumulator + currentValue[0] * currentValue[1];
  },
  0);

  Object.keys(activeIndex).forEach(function (symbol, idx) {
    let currentPrice = price[symbol];
    let constituent = activeIndex[symbol];
    let marketCap = constituent[0] * constituent[1];
    let percentage = marketCap / totalMarketCap;
    let weightedValue = percentage * capital;
    let shares = weightedValue / currentPrice;
    let lots = Math.floor(shares / 100);
    let owned = holding[symbol] || 0;
    let value = lots * 100 * currentPrice;

    result[symbol] = {
      lots: lots,
      diff: lots - owned,
      value: value,
      percentage: percentage,
    };
  });

  $table.find("tr").each(function () {
    let currentSymbol = $(this).find("td:first").text();
    if (!currentSymbol) {
      $(this).find("th").eq(2).after("<th>Target Lot</th>");
      $(this).find("th").eq(3).after("<th>Lot Difference</th>");
      $(this).find("th").eq(8).after("<th>Target Value</th>");
      $(this).find("th").eq(9).after("<th>Target Percentage</th>");
    } else {
      $(this).find("td").eq(2).after(`<td>${result[currentSymbol].lots}</td>`);
      $(this).find("td").eq(3).after(`<td>${result[currentSymbol].diff}</td>`);
      $(this).find("td").eq(8).after(`<td>${result[currentSymbol].value}</td>`);
      $(this)
        .find("td")
        .eq(9)
        .after(`<td>${result[currentSymbol].percentage}</td>`);
    }
  });
}

function enhance() {
  chrome.storage.local.get(["token", "pin"], function (data) {
    headers = {
      "x-pin": data.pin,
      authorization: `Bearer ${data.token}`,
    };

    const today = new Date();

    const todayDate = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const tradeUrl = `https://api.stockbit.com/v2.4/trade/report/trade_activity?start=1970-01-01&end=${todayDate}`;
    const tradeRequest = axios.get(tradeUrl, { headers: headers });

    const orderUrl = "https://api.stockbit.com/v2.4/trade/order?gtc=1";
    const orderRequest = axios.get(orderUrl, { headers: headers });

    const priceUrl = "https://scanner.tradingview.com/indonesia/scan";
    const pricePayload =
      '{"filter":[{"left":"market_cap_basic","operation":"nempty"},{"left":"type","operation":"in_range","right":["stock","dr","fund"]},{"left":"subtype","operation":"in_range","right":["common","","etf","unit","mutual","money","reit","trust"]}],"options":{"data_restrictions":"PREV_BAR","lang":"id_ID"},"symbols":{"query":{"types":[]},"tickers":[]},"columns":["name","close","description"],"sort":{"sortBy":"market_cap_basic","sortOrder":"desc"},"range":[0,300]}';
    const priceRequest = axios.post(priceUrl, pricePayload);

    axios
      .all([tradeRequest, orderRequest, priceRequest])
      .then(
        axios.spread((...responses) => {
          const tradeResponse = responses[0].data.data.result;
          const orderResponse = responses[1].data.data;
          const priceResponse = responses[2].data.data;

          const holding = {};
          tradeResponse.forEach(function (day, idx) {
            day.activity.forEach(function (activity, idx) {
              let symbol = activity.symbol;
              holding[symbol] =
                (holding[symbol] || 0) +
                parseInt(activity["lot"].replace(".0", ""), 10);
            });
          });

          orderResponse.forEach(function (order, idx) {
            let symbol = order.symbol;
            holding[symbol] = (holding[symbol] || 0) + order.order_total;
          });

          const price = {};
          priceResponse.forEach(function (content, idx) {
            let info = content.d;
            price[info[0]] = info[1];
          });

          calculate(holding, price, "IDX30", "2020-10", 100000000); // TODO: use dynamic values
        })
      )
      .catch((errors) => {
        console.log(errors);
      });
  });
}

enhance();
