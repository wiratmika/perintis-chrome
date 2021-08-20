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

  let exists = $("#marker").length > 0;
  const red = "color: rgb(238, 74, 73);";
  const green = "color: rgb(0, 171, 107);";
  const black = "color: rgb(51, 51, 51);";

  $("#trading-box table:not(.ant-table-fixed)")
    .find("tr")
    .each(function () {
      let currentSymbol = $(this).find("td:first").text();

      if (!currentSymbol && !exists) {
        $(this).find("th").eq(2).after("<th id='marker'>Target Lot</th>");
        $(this).find("th").eq(3).after("<th>Lot Difference</th>");
        $(this).find("th").eq(8).after("<th>Target Value</th>");
        $(this).find("th").eq(9).after("<th>Target Percentage</th>");
      } else if (currentSymbol) {
        let currentData = result[currentSymbol];
        let lots;
        let diff;
        let color;
        let value;
        let percentage;

        if (!currentData) {
          lots = "-";
          diff = "-";
          color = black;
          value = "-";
          percentage = "-";
        } else {
          lots = currentData.lots;
          diff = currentData.diff;
          color = black;

          if (diff > 0) {
            color = red;
          } else if (diff < 0) {
            color = green;
          }
          value = currentData.value
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          percentage = Math.round(currentData.percentage * 10000) / 100; // Rounding to 2 decimals
        }

        let style = ` style="${color}"`;
        let percentageWithSuffix = `${percentage}${
          percentage === "-" ? "" : "%"
        }`;

        if (exists) {
          $(this).find("td#lots").text(lots);
          $(this).find("td#diff").text(diff).attr("style", color);
          $(this).find("td#value").text(value);
          $(this).find("td#percentage").text(percentageWithSuffix);
        } else {
          $(this).find("td").eq(2).after(`<td id="lots">${lots}</td>`);
          $(this).find("td").eq(3).after(`<td id="diff"${style}>${diff}</td>`);
          $(this).find("td").eq(8).after(`<td id="value">${value}</td>`);
          $(this)
            .find("td")
            .eq(9)
            .after(`<td id="percentage">${percentageWithSuffix}</td>`);
        }
      }
    });
}

function fetch() {
  chrome.storage.local.get(["token", "pin"], function (data) {
    headers = {
      "x-pin": data.pin,
      authorization: `Bearer ${data.token}`,
    };

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();

    const todayDate = `${yyyy}-${mm}-${dd}`;
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

          chrome.storage.local.set(
            {
              cache: {
                holding,
                price,
              },
            },
            function () {
              chrome.storage.local.get("capital", function (data) {
                calculate(holding, price, "IDX30", "2021-01", data.capital);
              });
            }
          );
        })
      )
      .catch((errors) => {
        console.log(errors);
      });
  });
}

function enhance() {
  chrome.storage.local.get(["cache", "capital"], function (data) {
    if (!data.cache) {
      fetch();
    } else {
      calculate(
        data.cache.holding,
        data.cache.price,
        "IDX30",
        "2021-01",
        data.capital
      );
    }
  });
}

enhance();
