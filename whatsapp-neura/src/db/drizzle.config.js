require("dotenv").config();

module.exports = {
  schema: "./src/db/schema.js",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
};
