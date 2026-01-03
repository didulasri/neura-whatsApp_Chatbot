function getMissingFields(order) {
  if (!order || order.intent !== "order") return [];

  const missing = [];

  if (!order.productName) missing.push("product name");
  if (!order.color) missing.push("color");
  if (!order.size) missing.push("size");
  if (!order.quantity) missing.push("quantity");

  return missing;
}

module.exports = { getMissingFields };
