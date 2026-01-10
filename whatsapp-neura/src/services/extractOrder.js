// services/extractOrder.js
const Groq = require("groq-sdk");
const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Extracts order details using AI
 * Returns a JSON object:
 * {
 *   intent: "order" | "inquiry" | "unknown",
 *   productName: string | null,
 *   quantity: number | null,
 *   color: string | null,
 *   size: string | null,
 *   address: string | null,
 *   phone: string | null,
 *   note: string | null
 * }
 */
async function extractOrder(englishText) {
  const prompt = `
You are a smart WhatsApp sales assistant.

Extract order details from the user's message. Return ONLY JSON with these fields:

{
  "intent": "order" | "inquiry" | "unknown",
  "productName": string | null,
  "quantity": number | null,
  "color": string | null,
  "size": string | null,
  "address": string | null,
  "phone": string | null,
  "note": string | null
}

- If the user is asking about a product or placing an order, intent = "order"
- If the user is asking questions about products, intent = "inquiry"
- If no clear order or inquiry detected, intent = "unknown"
- If any field is missing, set it to null
- Do NOT return text outside the JSON
`;

  try {
    const res = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: englishText },
      ],
      temperature: 0.0,
    });

    const aiText = res.choices[0].message.content.trim();

    // Ensure valid JSON (remove any extra text)
    const jsonStart = aiText.indexOf("{");
    const jsonEnd = aiText.lastIndexOf("}") + 1;

    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("AI did not return JSON");
    }

    const jsonString = aiText.slice(jsonStart, jsonEnd);
    const parsed = JSON.parse(jsonString);

    // Ensure all expected fields exist
    return {
      intent: parsed.intent || "unknown",
      productName: parsed.productName || null,
      quantity: parsed.quantity ?? null,
      color: parsed.color || null,
      size: parsed.size || null,
      address: parsed.address || null,
      phone: parsed.phone || null,
      note: parsed.note || null,
    };
  } catch (e) {
    console.error("ExtractOrder AI Error:", e.message);
    return {
      intent: "unknown",
      productName: null,
      quantity: null,
      color: null,
      size: null,
      address: null,
      phone: null,
      note: null,
    };
  }
}

module.exports = { extractOrder };
