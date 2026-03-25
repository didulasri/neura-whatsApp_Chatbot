const whatsappService = require("../services/whatsappService");
const { languageService } = require("../services/languageService");
const { singlishToEnglish } = require("../services/normalizeSinglish");
const { sinhalaToEnglish } = require("../services/translateSinhala");
const { extractOrder } = require("../services/extractOrder");
const { checkAvailability } = require("../services/availabilityService");
const { generateSmartReply } = require("../services/aiReplyService");
const { getSession, saveSession } = require("../services/sessionService");
const { detectIntent } = require("../services/aiIntentService");

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

    // 🛑 Prevent duplicate processing
    if (processedMessages.has(messageId)) return;
    processedMessages.add(messageId);
    if (processedMessages.size > 200) processedMessages.clear();

    console.log("📩 From:", from);
    console.log("💬 Text:", text);

    // 1️⃣ Load session
    const session = await getSession(from);

    // 2️⃣ Detect language
    const lang = await languageService(text);

    // 3️⃣ Normalize to English
    let englishText = text;
    if (lang === "sl") englishText = await singlishToEnglish(text);
    if (lang === "si") englishText = await sinhalaToEnglish(text);

    console.log("🌍 Normalized text:", englishText);

    // 4️⃣ Detect AI intent
    const aiIntent = await detectIntent(englishText);
    console.log("🧠 AI Intent:", aiIntent);

    // 5️⃣ Extract order (AI)
    const extractedOrder = await extractOrder(englishText);

    // 6️⃣ SAFE MERGE (🔥 core fix)
    const order = {
      ...session,
      aiIntent,
    };

    for (const key of Object.keys(extractedOrder)) {
      const value = extractedOrder[key];

      if (
        value !== null &&
        value !== undefined &&
        value !== "" &&
        !(key === "productName" && ["S", "M", "L", "XL"].includes(value))
      ) {
        order[key] = value;
      }
    }

    console.log("🧾 Session after merge:", order);

    // 🔒 SAFETY FIX: prevent invalid productName
    const invalidProductValues = [
      "black", "white", "red", "blue", "green",
      "s", "m", "l", "xl", "xxl"
    ];

    if (
      order.productName &&
      invalidProductValues.includes(order.productName.toLowerCase())
    ) {
      console.log("⚠️ Fixing invalid productName:", order.productName);
      order.productName = session.productName || null;
    }

    // 🔒 EXTRA FIX: extract size from wrong field like "M size"
    if (order.productName && !order.size && typeof order.productName === "string") {
      const sizeMatch = order.productName.match(/\b(S|M|L|XL|XXL)\b/i);

      if (sizeMatch) {
        order.size = sizeMatch[0].toUpperCase();
        order.productName = session.productName || null;

        console.log("✅ Extracted size from product field:", order.size);
      }
    }

    // 🔒 Normalize values (important for DB matching)
    if (order.color) order.color = order.color.toLowerCase();
    if (order.size) order.size = order.size.toUpperCase();

    // 7️⃣ Check availability
    let availabilityResult = null;

    if (order.productName && order.color && order.size) {
      availabilityResult = await checkAvailability({
        productName: order.productName,
        color: order.color,
        size: order.size,
        quantity: order.quantity || 1,
      });
    }

    // 8️⃣ Generate reply
    const reply = await generateSmartReply({
      intent: aiIntent,
      userMessage: text,
      order,
      availabilityResult,
    });

    // 9️⃣ Save session
    await saveSession(from, order);

    // 🔟 Send reply
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