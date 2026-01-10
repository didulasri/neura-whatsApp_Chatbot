const groq = require("./groqClient");

/**
 * AI DUTY:
 * - Handle greetings & casual talk
 * - Confirm facts AFTER DB validation
 * ❌ NEVER invent products, stock, prices
 */

async function generateSmartReply({
  intent,
  userMessage,
  order,
  availabilityResult,
}) {
  // 🧠 HUMAN CONVERSATION
  if (intent === "greeting" || intent === "small_talk") {
    return await generateHumanReply(userMessage);
  }

  // ⚙️ HARD BUSINESS LOGIC
  if (!order.productName) {
    return "Sure 😊 What product are you looking for today?";
  }

  if (!order.color) {
    return `Nice choice! What color would you like for the ${order.productName}? 🎨`;
  }

  if (!order.size) {
    return "Got it 👍 What size do you need? (S, M, L, XL)";
  }

  if (!availabilityResult) {
    return "Let me check availability for you ⏳";
  }

  if (!availabilityResult.found) {
    return "Sorry 😕 I couldn’t find that item. Could you double-check the product name?";
  }

  if (!availabilityResult.inStock) {
    return "That item is currently out of stock. Would you like another option?";
  }

  // ✅ AI ONLY CONFIRMS FACTS
  return await generateConfirmedAIReply(order, availabilityResult);
}

/**
 * 🧠 AI for natural human replies
 */
async function generateHumanReply(userMessage) {
  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: `
You are a friendly WhatsApp sales assistant.

Rules:
- Sound natural and human
- Be polite and warm
- Keep replies short (1–2 sentences)
- Do NOT push products unless user asks
`,
      },
      {
        role: "user",
        content: userMessage,
      },
    ],
    temperature: 0.8,
  });

  return response.choices[0].message.content.trim();
}

/**
 * 🧠 AI ONLY AFTER DB CONFIRMATION
 */
async function generateConfirmedAIReply(order, availabilityResult) {
  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: `
You are a WhatsApp sales assistant.

STRICT RULES:
- Use ONLY the provided data
- Do NOT invent anything
- Be friendly and short
- Ask to place the order
`,
      },
      {
        role: "user",
        content: `
Product: ${order.productName}
Color: ${order.color}
Size: ${order.size}
Available Quantity: ${availabilityResult.stock}

Confirm availability and ask to place the order.
`,
      },
    ],
    temperature: 0.4,
  });

  return response.choices[0].message.content.trim();
}

module.exports = { generateSmartReply };
