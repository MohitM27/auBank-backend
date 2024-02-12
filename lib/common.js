const getTotalSalesByKey = (json, key) => {
  return Object.entries(
    json.reduce((acc, { [key]: segment, Sales: sales }) => {
      acc[segment] = Number(((acc[segment] || 0) + sales).toFixed(2));
      return acc;
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.name.localeCompare(b.name));
};
module.exports = {
  getTotalSalesByKey,
};
