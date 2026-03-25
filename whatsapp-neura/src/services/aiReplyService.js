const groq = require("./groqClient");

/**
 * AI DUTY:
 * - Handle greetings & casual talk naturally
 * - Confirm facts AFTER DB validation
 * ❌ NEVER invent products, stock, prices
 */
async function generateSmartReply({ intent, userMessage, order, availabilityResult }) {

  // 🧠 HUMAN CONVERSATION — greetings & small talk
  if (intent === "greeting" || intent === "small_talk") {
    return await generateHumanReply(userMessage);
  }

  // ⚙️ HARD BUSINESS LOGIC — step-by-step order collection

  if (!order.productName) {
    return "Sure 😊 What product are you looking for today?";
  }

  if (!order.color) {
    return `Nice choice! What color would you like for the ${order.productName}? 🎨`;
  }

  if (!order.size) {
    return `Got it 👍 What size do you need for the ${order.productName}? (S, M, L, XL)`;
  }

  // ✅ All 3 collected — check availability result
  if (!availabilityResult) {
    return "Let me check availability for you ⏳";
  }

  if (availabilityResult.reason === "ERROR") {
    return "Sorry 😕 Something went wrong on our end. Please try again in a moment.";
  }

  if (!availabilityResult.found) {
    return `Sorry 😕 I couldn't find *${order.productName}* in *${order.color}* / *${order.size}*. Could you double-check the details?`;
  }

  if (!availabilityResult.inStock) {
    return `That item is currently out of stock (only ${availabilityResult.stock} left). Would you like a different color or size?`;
  }

  // ✅ In stock — collect customer details
  if (!order.name) return "Great news, it's available! 🎉 May I have your name to place the order?";
  if (!order.address) return "Thanks! Please share your delivery address 📦";
  if (!order.phone) return "Almost done! May I have your phone number? 📞";

  // ✅ All details collected — AI confirms and closes
  return await generateConfirmedAIReply(order, availabilityResult);
}

/**
 * 🧠 AI for natural human replies (greetings, small talk)
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
        `.trim(),
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
 * 🧠 AI reply ONLY after DB confirms availability and all details are collected
 */
async function generateConfirmedAIReply(order, availabilityResult) {
  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: `
You are a WhatsApp sales assistant closing an order.

STRICT RULES:
- Use ONLY the data provided below
- Do NOT invent anything
- Be friendly, warm, and concise
- Summarize the order and ask customer to confirm
        `.trim(),
      },
      {
        role: "user",
        content: `
Customer order summary:
- Product: ${order.productName}
- Color: ${order.color}
- Size: ${order.size}
- Quantity: ${order.quantity || 1}
- Name: ${order.name}
- Address: ${order.address}
- Phone: ${order.phone}
- Stock available: ${availabilityResult.stock}

Write a friendly order confirmation message and ask them to confirm with YES to place the order.
        `.trim(),
      },
    ],
    temperature: 0.4,
  });

  return response.choices[0].message.content.trim();
}

module.exports = { generateSmartReply };