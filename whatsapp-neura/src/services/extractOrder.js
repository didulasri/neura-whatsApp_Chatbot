const Groq = require("groq-sdk");
const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

module.exports.extractOrder = async (englishText) => {
  const prompt = `
Extract order details from this message. Return JSON ONLY.

Fields:
- intent: "order" | "inquiry" | "unknown"
- item: product name or null
- quantity: number or null
- size: optional
- address: optional
- phone: optional
- note: other important info

If no order detected, return intent = "unknown".
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

    return JSON.parse(res.choices[0].message.content);
  } catch (e) {
    console.log("Extract error:", e.message);
    return { intent: "unknown" };
  }
};
