const whatsappService = require("../services/whatsappService");

module.exports.verifyWebhook = (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    console.log("Webhook verified");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
};

module.exports.receiveMessage = async (req, res) => {
  try {
    console.log("=== DEBUG INFO ===");
    console.log("WHATSAPP_TOKEN exists:", !!process.env.WHATSAPP_TOKEN);
    console.log("WHATSAPP_TOKEN length:", process.env.WHATSAPP_TOKEN?.length);
    console.log("PHONE_NUMBER_ID:", process.env.PHONE_NUMBER_ID);
    console.log("==================");
    const entry = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (entry) {
      const from = entry.from;
      const text = entry.text?.body;

      console.log("Message from:", from);
      console.log("Message text:", text);

      // Auto reply
      await whatsappService.sendText(
        from,
        "Thank you! I received your message ❤️"
      );
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Error:", error);
    res.sendStatus(500);
  }
};
