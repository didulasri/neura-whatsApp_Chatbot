const groq = require("./groqClient"); // your existing Groq setup

async function generateSmartReply(context) {
  const { userMessage, normalizedText, order, availabilityResult } = context;

  const systemPrompt = `
You are a friendly WhatsApp sales assistant.

Rules:
- Always reply in English
- Be polite, friendly, and short
- If user greets → greet back and offer help
- If order info is missing → ask only for missing details
- If product not found → apologize and ask for clarification
- If product available → confirm and ask to place order
- NEVER mention databases or AI
- Sound human, not robotic
`;

  const userPrompt = `
User message: "${userMessage}"

Normalized text: "${normalizedText}"

Extracted order JSON:
${JSON.stringify(order, null, 2)}

Availability result:
${JSON.stringify(availabilityResult, null, 2)}

Generate the best possible reply to the customer.
`;

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.6,
  });

  return response.choices[0].message.content.trim();
}

module.exports = { generateSmartReply };
