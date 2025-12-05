const Groq = require("groq-sdk");
const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

module.exports.singlishToEnglish = async (text) => {
  const prompt = `
Convert Sri Lankan Singlish into correct English.
Do NOT translate Sinhala. Only rewrite Singlish to clean English.
Output only the corrected English sentence.
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
    console.log("Singlish normalize error:", e.message);
    return text;
  }
};
