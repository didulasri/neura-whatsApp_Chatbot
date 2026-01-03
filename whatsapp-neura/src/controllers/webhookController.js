const whatsappService = require("../services/whatsappService");
const { languageService } = require("../services/languageService");
const { singlishToEnglish } = require("../services/normalizeSinglish");
const { sinhalaToEnglish } = require("../services/translateSinhala");
const { extractOrder } = require("../services/extractOrder");
const { checkAvailability } = require("../services/availabilityService");
const { generateSmartReply } = require("../services/aiReplyService");

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

  console.log("Webhook verification failed");
  res.sendStatus(403);
};

const receiveMessage = async (req, res) => {
  res.sendStatus(200);

  try {
    const entry = req.body.entry?.[0]?.changes?.[0]?.value;
    const message = entry?.messages?.[0];

    if (!message) return;

    const messageId = message.id;
    const from = message.from;
    const text = message.text?.body || "";

    // Prevent duplicate replies
    if (processedMessages.has(messageId)) return;
    processedMessages.add(messageId);

    if (processedMessages.size > 200) processedMessages.clear();

    console.log("📩 From:", from);
    console.log("💬 Text:", text);

    // 1️⃣ Detect language
    const lang = await languageService(text);
    console.log("🌍 Language:", lang);

    // 2️⃣ Normalize to English
    let englishText = text;

    if (lang === "sl") {
      englishText = await singlishToEnglish(text);
    } else if (lang === "si") {
      englishText = await sinhalaToEnglish(text);
    }

    console.log("📝 Normalized:", englishText);

    // 3️⃣ AI Order Extraction
    const order = await extractOrder(englishText);
    console.log("📦 Order:", order);

    // 4️⃣ Availability check (only if order intent exists)
    let availabilityResult = null;

    if (order?.intent === "order" && order.productName) {
      availabilityResult = await checkAvailability({
        productName: order.productName,
        color: order.color,
        size: order.size,
        quantity: order.quantity || 1,
      });
    }

    // 5️⃣ AI generates friendly human-like reply
    const reply = await generateSmartReply({
      userMessage: text,
      normalizedText: englishText,
      order,
      availabilityResult,
    });

    // 5️⃣ Send WhatsApp reply
    await whatsappService.sendText(from, reply);
    console.log("✅ Reply sent:", reply);
  } catch (err) {
    console.error("❌ Webhook Error:", err);
  }
};

module.exports = {
  verifyWebhook,
  receiveMessage,
};
