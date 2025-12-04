const express = require("express");
const router = express.Router();
const {
  verifyWebhook,
  receiveMessage,
} = require("../controllers/webhookController");

// Webhook verification
router.get("/", verifyWebhook);

// Receiving messages
router.post("/", receiveMessage);

module.exports = router;
