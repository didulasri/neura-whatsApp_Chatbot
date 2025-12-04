const whatsappService = require("../services/whatsappService");
const languageService = require("../services/languageService");

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

    // Detect language via Groq
    const { language } = await languageService.detectLanguage(text);

    let reply = "Thank you! I received your message ❤️";

    if (language === "si") {
      reply = "ස්තූතියි! මම ඔබේ පණිවිඩය ලැබුවා ❤️";
    } else if (language === "ta") {
      reply = "நன்றி! உங்கள் செய்தியை பெற்றேன் ❤️";
    }

    await whatsappService.sendText(from, reply);
  } catch (err) {
    console.error("❌ Webhook Error:", err);
  }
};

module.exports = {
  verifyWebhook,
  receiveMessage,
};
