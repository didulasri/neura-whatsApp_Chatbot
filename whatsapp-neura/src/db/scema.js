const {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  numeric,
  boolean,
} = require("drizzle-orm/pg-core");

/* USERS */
const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow(),
});

/* PRODUCTS */
const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .references(() => products.id)
    .notNull(),
  color: text("color").notNull(),
  size: text("size").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

/* ORDERS */
const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  status: text("status").default("pending"),
  totalAmount: numeric("total_amount", {
    precision: 10,
    scale: 2,
  }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

/* ORDER ITEMS */
const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .references(() => orders.id)
    .notNull(),
  productId: integer("product_id")
    .references(() => products.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
});

// /* MESSAGES */
// const messages = pgTable("messages", {
//   id: serial("id").primaryKey(),
//   userId: integer("user_id").references(() => users.id),
//   rawText: text("raw_text"),
//   normalizedText: text("normalized_text"),
//   language: text("language"),
//   createdAt: timestamp("created_at").defaultNow(),
// });

module.exports = {
  users,
  products,
  productVariants,
  orders,
  orderItems,
  messages,
};
