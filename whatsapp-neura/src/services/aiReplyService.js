const groq = require("./groqClient");

/**
 * AI DUTY:
 * - Handle greetings & casual talk ONLY when no active order session
 * - Always prioritize order flow if session has product data
 * ❌ NEVER invent products, stock, prices
 */
async function generateSmartReply({ intent, userMessage, order, availabilityResult }) {

  // ✅ KEY FIX: If there is an active order in progress, ALWAYS follow order flow
  // regardless of what intent was detected for short replies like "S", "Black", etc.
  const hasActiveOrder = order.productName || order.color || order.size;

  // 🧠 HUMAN CONVERSATION — ONLY when no active order session
  if (!hasActiveOrder && (intent === "greeting" || intent === "small_talk")) {
    return await generateHumanReply(userMessage);
  }

  // ⚙️ ORDER FLOW — step by step collection

  if (!order.productName) {
    return "Sure 😊 What product are you looking for today?";
  }

  if (!order.color) {
    return `Nice choice! What color would you like for the *${order.productName}*? 🎨`;
  }

  if (!order.size) {
    return `Got it 👍 What size do you need for the *${order.productName}*? (S, M, L, XL)`;
  }

  // ✅ All 3 collected — check availability
  if (!availabilityResult) {
    return "Let me check availability for you ⏳";
  }

  if (availabilityResult.reason === "ERROR") {
    return "Sorry 😕 Something went wrong on our end. Please try again in a moment.";
  }

  if (!availabilityResult.found) {
    return `Sorry 😕 I couldn't find *${order.productName}* in *${order.color}* / size *${order.size}*. Could you double-check the details?`;
  }

  if (!availabilityResult.inStock) {
    return `That item is currently out of stock (only ${availabilityResult.stock} units left). Would you like a different color or size?`;
  }

  // ✅ In stock — show availability + price, then collect customer details
  if (!order.confirmedAvailability) {
    const price = availabilityResult.price
      ? `\n💰 Price: Rs. ${availabilityResult.price}`
      : "";

    return (
      `✅ Great news! *${order.productName}* in *${order.color}* / size *${order.size}* is available!` +
      `${price}\n📦 Stock: ${availabilityResult.stock} units\n\n` +
      `Would you like to place an order? If yes, may I have your *name*? 😊`
    );
  }

  // ✅ Customer details collection
  if (!order.name) return "May I have your full name please? 😊";
  if (!order.address) return "Thanks! Please share your delivery address 📦";
  if (!order.phone) return "Almost done! May I have your phone number? 📞";

  // ✅ All details collected — AI confirms and closes the order
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
You are a friendly WhatsApp sales assistant for a clothing store.

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
 * 🧠 AI reply ONLY after DB confirms availability and all details collected
 */
async function generateConfirmedAIReply(order, availabilityResult) {
  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: `
You are a WhatsApp sales assistant closing an order for a clothing store.

STRICT RULES:
- Use ONLY the data provided below
- Do NOT invent anything
- Be friendly, warm, and concise
- Summarize the order clearly and ask customer to confirm with YES
        `.trim(),
      },
      {
        role: "user",
        content: `
Order summary:
- Product: ${order.productName}
- Color: ${order.color}
- Size: ${order.size}
- Quantity: ${order.quantity || 1}
- Price: Rs. ${availabilityResult.price}
- Name: ${order.name}
- Address: ${order.address}
- Phone: ${order.phone}

Write a friendly order confirmation message and ask them to reply YES to confirm.
        `.trim(),
      },
    ],
    temperature: 0.4,
  });

  return response.choices[0].message.content.trim();
}

module.exports = { generateSmartReply };