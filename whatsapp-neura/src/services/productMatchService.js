export function fuzzyMatchProduct(userText, products) {
  const text = userText.toLowerCase();

  return products.find(
    (p) =>
      text.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(text)
  );
}
