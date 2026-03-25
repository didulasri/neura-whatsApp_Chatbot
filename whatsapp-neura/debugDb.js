// debugDb.js — run with: node debugDb.js
// Place this in your project root temporarily

require("dotenv").config();
const { db } = require("./src/db");
const { products, productVariants } = require("./src/db/scema");
const { eq } = require("drizzle-orm");

async function debugDb() {
    try {
        console.log("\n==============================");
        console.log("📦 ALL PRODUCTS:");
        console.log("==============================");
        const allProducts = await db.select().from(products);
        console.log(JSON.stringify(allProducts, null, 2));

        console.log("\n==============================");
        console.log("🎨 ALL PRODUCT VARIANTS:");
        console.log("==============================");
        const allVariants = await db.select().from(productVariants);
        console.log(JSON.stringify(allVariants, null, 2));

        console.log("\n==============================");
        console.log("🔗 JOINED (products + variants):");
        console.log("==============================");
        const joined = await db
            .select({
                productId: products.id,
                productName: products.name,
                isActive: products.isActive,
                variantId: productVariants.id,
                color: productVariants.color,
                size: productVariants.size,
                stock: productVariants.stock,
            })
            .from(productVariants)
            .innerJoin(products, eq(productVariants.productId, products.id));

        console.log(JSON.stringify(joined, null, 2));

    } catch (err) {
        console.error("❌ Debug error:", err);
    } finally {
        process.exit(0);
    }
}

debugDb();