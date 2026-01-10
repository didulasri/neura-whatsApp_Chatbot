const whatsappService = require("../services/whatsappService");
const { languageService } = require("../services/languageService");
const { singlishToEnglish } = require("../services/normalizeSinglish");
const { sinhalaToEnglish } = require("../services/translateSinhala");
const { extractOrder } = require("../services/extractOrder");
const { checkAvailability } = require("../services/availabilityService");
const { generateSmartReply } = require("../services/aiReplyService");
const { getSession, saveSession } = require("../services/sessionService");
const { detectIntent } = require("../services/aiIntentService"); // AI intent

const processedMessages = new Set();

const verifyWebhook = (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    console.log("Webhook verified ✅");
    return res.status(200).send(challenge);
  }

  console.log("Webhook verification failed ❌");
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

    // Prevent duplicate processing
    if (processedMessages.has(messageId)) return;
    processedMessages.add(messageId);
    if (processedMessages.size > 200) processedMessages.clear();

    console.log("📩 From:", from);
    console.log("💬 Text:", text);

    // 1️⃣ Load session from Redis
    const session = await getSession(from);

    // 2️⃣ Detect language
    const lang = await languageService(text);

    // 3️⃣ Normalize text to English
    let englishText = text;
    if (lang === "sl") englishText = await singlishToEnglish(text);
    if (lang === "si") englishText = await sinhalaToEnglish(text);

    console.log("🌍 Normalized text:", englishText);

    // 4️⃣ Detect AI intent
    const aiIntent = await detectIntent(englishText);
    console.log("🧠 AI Intent:", aiIntent);

    // 5️⃣ Extract order (partial info allowed)
    const extractedOrder = await extractOrder(englishText);

    // 6️⃣ Merge session + extracted order + AI intent
    const order = {
      ...session,
      ...extractedOrder,
      aiIntent, // store intent for smarter replies
    };

    // 7️⃣ Check product availability only if full info is present
    let availabilityResult = null;
    if (order.productName && order.color && order.size) {
      availabilityResult = await checkAvailability({
        productName: order.productName,
        color: order.color,
        size: order.size,
        quantity: order.quantity || 1,
      });
    }

    // 8️⃣ Generate reply (AI + rules + intent)
    const reply = await generateSmartReply({
      intent: aiIntent, // ✅ Pass AI intent
      userMessage: text,
      order,
      availabilityResult,
    });

    // 9️⃣ Save updated session back to Redis
    await saveSession(from, order);

    // 🔟 Send WhatsApp reply
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
