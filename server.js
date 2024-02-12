const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const salesData = require("./sales.json");
const moment = require("moment");
const { getTotalSalesByKey } = require("./lib/common");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(cors());

app.get("/api/states", (req, res) => {
  const states = [...new Set(salesData.map(sale => sale.State))].sort();
  res.status(200).json({ status: 200, data: states });
});

app.get("/api/dates/:state", (req, res) => {
  const state = req.params.state;
  const stateSales = salesData.filter(sale => sale.State === state);
  const minDate = new Date(Math.min(...stateSales.map(sale => new Date(sale["Order Date"]))));
  const maxDate = new Date(Math.max(...stateSales.map(sale => new Date(sale["Order Date"]))));
  res.status(200).json({ status: 200, data: { minDate, maxDate } });
});

app.get("/api/dashboard", (req, res) => {
  const { customerId, state, startDate, endDate } = req.query;
  if (![customerId, state, startDate, endDate].every(param => typeof param === "string")) {
    res.status(400).json({ status: 400, data: { message: "Invalid parameters." } });
    return;
  }
  const startMoment = moment(startDate, "YYYY-MM-DD", true);
  const endMoment = moment(endDate, "YYYY-MM-DD", true);
  if (!startMoment.isValid() || !endMoment.isValid()) {
    res.status(400).json({ status: 400, data: { message: "Invalid date format. Please use YYYY-MM-DD format." } });
    return;
  }
  const customerData = salesData.find(sale => sale["Customer ID"] === customerId);
  const customerName = customerData ? customerData["Customer Name"] : "";
  const allSalesByCustomerId = salesData.filter(sale => 
   sale["Customer ID"] === customerId &&
   sale.State === state);
  const filteredSales = allSalesByCustomerId.reduce((totals, sale) => {
    const orderDate = moment(sale["Order Date"], "YYYY-MM-DD");
    if (orderDate.isBetween(startMoment, endMoment, "day", "[]")) {
      totals.totalSales += sale.Sales;
      totals.totalQuantity += sale.Quantity;
      totals.totalDiscount += sale.Discount;
      totals.totalProfit += sale.Profit;
    }
    return totals;
  }, { totalSales: 0, totalQuantity: 0, totalDiscount: 0, totalProfit: 0 });
  const totalSalesByProductName = Object.values(allSalesByCustomerId.reduce((acc, { "Product ID": productId, "Product Name": name, Sales: sales }) => {
    acc[productId] = acc[productId] || { name, value: 0 };
    acc[productId].value += sales;
    return acc;
  }, {})).sort((a, b) => a.name.localeCompare(b.name));
  const totalSalesByCity = getTotalSalesByKey(allSalesByCustomerId, "City");
  const totalSalesBySubCategory = getTotalSalesByKey(allSalesByCustomerId, "Sub-Category");
  const totalSalesByCategory = getTotalSalesByKey(allSalesByCustomerId, "Category");
  const totalSalesBySegment = getTotalSalesByKey(allSalesByCustomerId, "Segment");
  res.status(200).json({
    status: 200,
    data: {
      filteredSales,
      customerName,
      totalSalesByCity,
      totalSalesByProductName,
      totalSalesBySubCategory,
      totalSalesByCategory,
      totalSalesBySegment,
    },
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
