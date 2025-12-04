require("dotenv").config();
const express = require("express");
const app = express();
const webhookRoute = require("./routes/webhook");
require("dotenv").config();

app.use(express.json());

// Routes
app.use("/webhook", webhookRoute);

// Start server
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
