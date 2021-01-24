let $table = $("#trading-box table:not(.ant-table-fixed)");

$table.find("tr").each(function () {
  $(this).find("th").eq(2).after("<th>Target Lot</th>");
  $(this).find("td").eq(2).after("<td>x</td>");

  $(this).find("th").eq(3).after("<th>Lot Difference</th>");
  $(this).find("td").eq(3).after("<td>y</td>");

  $(this).find("th").eq(8).after("<th>Target Value</th>");
  $(this).find("td").eq(8).after("<td>a</td>");

  $(this).find("th").eq(9).after("<th>Target Percentage</th>");
  $(this).find("td").eq(9).after("<td>b</td>");
});
