const Groq = require("groq-sdk");
const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

module.exports.extractOrder = async (englishText) => {
  const prompt = `
You are an ORDER INFORMATION EXTRACTION ENGINE.

Extract ONLY what the user EXPLICITLY says.
Return JSON ONLY. No explanations.

IMPORTANT NORMALIZATION RULES:
- "one", "a", "an" → quantity = 1
- "two" → quantity = 2
- "three" → quantity = 3
- Numeric words must be converted to numbers
- If quantity is clearly mentioned → NEVER return null
- If product and quantity appear together → extract BOTH

Fields:
- intent: "order" | "inquiry" | "unknown"
- productName: string | null
- quantity: number | null
- color: string | null
- size: "XS" | "S" | "M" | "L" | "XL" | null
- address: string | null
- phone: string | null
- note: string | null

STRICT RULES:
- NEVER put size or color into productName
- NEVER invent missing data
- If message is ONLY size → fill size only
- If message is ONLY color → fill color only
`;

  try {
    const res = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: englishText },
      ],
      temperature: 0.0, // deterministic
    });

    return JSON.parse(res.choices[0].message.content);
  } catch (e) {
    console.error("❌ Extract error:", e.message);
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
};
