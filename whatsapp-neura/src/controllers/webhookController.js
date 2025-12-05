const whatsappService = require("../services/whatsappService");
const { languageService } = require("../services/languageService");
const { singlishToEnglish } = require("../services/normalizeSinglish");
const { sinhalaToEnglish } = require("../services/translateSinhala");
const { extractOrder } = require("../services/extractOrder");

const processedMessages = new Set();

const verifyWebhook = (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    console.log("Webhook verified");
    return res.status(200).send(challenge);
  }

  console.log("❌ Webhook verification failed");
  res.sendStatus(403);
};

const receiveMessage = async (req, res) => {
  res.sendStatus(200);

  try {
    const entry = req.body.entry?.[0]?.changes?.[0]?.value;
    const message = entry?.messages?.[0];

    if (!message) {
      console.log("⏭️ Not a message");
      return;
    }

    const messageId = message.id;
    const from = message.from;
    const text = message.text?.body || "";

    // Prevent duplicated replies
    if (processedMessages.has(messageId)) {
      console.log("⏭️ Duplicate message, skipping");
      return;
    }
    processedMessages.add(messageId);

    // Cleanup memory
    if (processedMessages.size > 200) {
      processedMessages.clear();
    }

    console.log("📩 From:", from);
    console.log("💬 Text:", text);

    // Detect language
    const lang = await languageService(text);
    console.log("🌍 Detected Language:", lang);

    // Normalize
    let englishText = text;

    if (lang === "sl") {
      englishText = await singlishToEnglish(text);
    } else if (lang === "si") {
      englishText = await sinhalaToEnglish(text);
    }

    console.log("📝 Normalized English:", englishText);

    // Extract Order
    const order = await extractOrder(englishText);
    console.log("📦 Extracted Order:", order);

    // Reply in English only
    let reply = "";

    if (order?.intent === "order") {
      reply = `Here is what I understood from your order:\n${JSON.stringify(
        order,
        null,
        2
      )}`;
    } else {
      reply = `Here is what I understood:\n${JSON.stringify(order, null, 2)}`;
    }

    await whatsappService.sendText(from, reply);
    console.log("Reply sent:", reply);
  } catch (err) {
    console.error("Webhook Error:", err);
  }
};

module.exports = {
  verifyWebhook,
  receiveMessage,
};
