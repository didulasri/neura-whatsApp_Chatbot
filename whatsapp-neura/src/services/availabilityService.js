const { db } = require("../db");
const { products, productVariants } = require("../db/scema");
const { eq, and, ilike, or } = require("drizzle-orm");

/**
 * Normalize product name for flexible matching
 * "Polo T shirt" → tries both "polo t shirt" and "polo-t-shirt"
 */
function normalizeProductName(name) {
  return name
    .trim()
    .replace(/[-_]+/g, " ")  // replace hyphens/underscores with space
    .replace(/\s+/g, " ")    // collapse multiple spaces
    .toLowerCase();
}

/**
 * Check product availability by name + color + size
 * Uses ilike (case-insensitive) + OR to handle hyphen vs space variations
 */
async function checkAvailability({ productName, color, size, quantity }) {
  try {
    const normalized = normalizeProductName(productName);
    const withHyphen = normalized.replace(/\s+/g, "-");  // "polo-t-shirt"
    const withSpace = normalized.replace(/[-]+/g, " "); // "polo t shirt"

    console.log("🔍 Checking availability:", { productName, normalized, color, size, quantity });

    const result = await db
      .select({
        name: products.name,
        color: productVariants.color,
        size: productVariants.size,
        stock: productVariants.stock,
        price: productVariants.price,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(
        and(
          eq(products.isActive, true),
          or(
            ilike(products.name, `%${withSpace}%`),    // matches "Polo T shirt"
            ilike(products.name, `%${withHyphen}%`),   // matches "Polo T-Shirt"
            ilike(products.name, `%${productName}%`),  // original as fallback
          ),
          ilike(productVariants.color, color),
          ilike(productVariants.size, size)
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
        price: variant.price,
      };
    }

    return {
      found: true,
      inStock: true,
      stock: variant.stock,
      price: variant.price,
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