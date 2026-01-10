const groq = require("./groqClient");

async function detectIntent(userMessage) {
  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: `
You are an intent classifier for a WhatsApp sales chatbot.

Classify the message into ONLY one intent:
- greeting
- small_talk
- product_inquiry
- order
- unclear

Return ONLY the intent name.
`,
      },
      {
        role: "user",
        content: userMessage,
      },
    ],
    temperature: 0,
  });

  return response.choices[0].message.content.trim().toLowerCase();
}

module.exports = { detectIntent };
