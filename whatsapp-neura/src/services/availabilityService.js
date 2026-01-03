const db = require("../db");

/**
 * Check product availability by name + color + size
 */
async function checkAvailability({ productName, color, size, quantity }) {
  const result = await db.query(
    `
    SELECT 
      p.name,
      v.color,
      v.size,
      v.stock
    FROM products p
    JOIN product_variants v ON v.product_id = p.id
    WHERE p.is_active = true
      AND LOWER(p.name) LIKE LOWER($1)
      AND LOWER(v.color) = LOWER($2)
      AND LOWER(v.size) = LOWER($3)
    LIMIT 1
    `,
    [`%${productName}%`, color, size]
  );

  if (!result.rows.length) {
    return {
      available: false,
      reason: "NOT_FOUND",
    };
  }

  const variant = result.rows[0];

  if (variant.stock < quantity) {
    return {
      available: false,
      reason: "OUT_OF_STOCK",
      availableStock: variant.stock,
    };
  }

  return {
    available: true,
    product: variant,
  };
}

module.exports = {
  checkAvailability,
};
