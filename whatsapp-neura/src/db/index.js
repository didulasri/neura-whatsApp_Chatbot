const { drizzle } = require("drizzle-orm/node-postgres");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});

const db = drizzle(pool);

module.exports = { db };
