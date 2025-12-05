const Groq = require("groq-sdk");
const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

module.exports.sinhalaToEnglish = async (text) => {
  const prompt = `
Translate this Sinhala text to English. 
Keep meaning accurate. NO explanations. 
Only output English.
`;

  try {
    const res = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: text },
      ],
      temperature: 0.1,
    });

    return res.choices[0].message.content.trim();
  } catch (e) {
    console.log("Sinhala translate error:", e.message);
    return text;
  }
};
