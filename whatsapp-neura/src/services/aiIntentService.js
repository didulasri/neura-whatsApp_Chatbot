const groq = require("./groqClient");

async function detectIntent(userMessage) {
  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: `
You are an intent classifier for a WhatsApp sales chatbot.

Classify the message into ONLY one of these intents:
- greeting
- small_talk
- product_inquiry
- order
- unclear

Rules:
- If the user mentions a product name → product_inquiry or order
- If the user says a color (black, white, red...) → order
- If the user says a size (S, M, L, XL) → order
- If unsure → unclear

Return ONLY the intent name. No explanation. No punctuation.
        `.trim(),
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