const { db } = require("../db");
const { products, productVariants } = require("../db/scema");
const { eq, and, ilike } = require("drizzle-orm");

/**
 * Check product availability by name + color + size
 * Uses ilike (case-insensitive) for all string comparisons
 */
async function checkAvailability({ productName, color, size, quantity }) {
  try {
    console.log("🔍 Checking availability:", { productName, color, size, quantity });

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
          ilike(products.name, `%${productName}%`),  // ✅ fuzzy + case-insensitive
          ilike(productVariants.color, color),        // ✅ case-insensitive color
          ilike(productVariants.size, size)           // ✅ case-insensitive size
        )
      )
      .limit(1);

    console.log("📊 DB result:", result);

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
    console.error("❌ DB Error in checkAvailability:", err);
    return {
      found: false,
      inStock: false,
      reason: "ERROR",
    };
  }
}

module.exports = { checkAvailability };