const Groq = require("groq-sdk");
require("dotenv").config();

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

module.exports = client;
