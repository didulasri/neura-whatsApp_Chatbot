const { db } = require("../db"); // make sure this exports drizzle instance
const { products, productVariants } = require("../db/schema");
const { eq, and, ilike } = require("drizzle-orm");

/**
 * Check product availability by name + color + size
 */
async function checkAvailability({ productName, color, size, quantity }) {
  try {
    const result = await db
      .select({
        name: products.name,
        color: productVariants.color,
        size: productVariants.size,
        stock: productVariants.stock,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(
        and(
          eq(products.isActive, true),
          ilike(products.name, `%${productName}%`), // fuzzy match
          eq(productVariants.color, color),
          eq(productVariants.size, size)
        )
      )
      .limit(1);

    if (!result.length) {
      return {
        found: false,
        inStock: false,
        reason: "NOT_FOUND",
      };
    }

    const variant = result[0];

    if (variant.stock < quantity) {
      return {
        found: true,
        inStock: false,
        reason: "OUT_OF_STOCK",
        stock: variant.stock,
      };
    }

    return {
      found: true,
      inStock: true,
      stock: variant.stock,
      product: variant,
    };
  } catch (err) {
    console.error("DB Error:", err);

    return {
      found: false,
      inStock: false,
      reason: "ERROR",
    };
  }
}

module.exports = {
  checkAvailability,
};