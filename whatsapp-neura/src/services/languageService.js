const Groq = require("groq-sdk");

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

module.exports.detectLanguage = async (text) => {
  try {
    if (!text || !text.trim()) {
      return { language: "en", confidence: 0 };
    }

    const response = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            "Detect the language of the given text. Return only one code:\n- si (Sinhala)\n- ta (Tamil)\n- en (English)\nReturn ONLY the code.",
        },
        { role: "user", content: text },
      ],
      temperature: 0,
    });

    const lang = response.choices[0]?.message?.content?.trim().toLowerCase();

    console.log("🌍 Groq detected:", lang);

    return { language: lang, confidence: 1 };
  } catch (err) {
    console.error("Groq Language Error:", err.message);
    return { language: "en", confidence: 0.4 };
  }
};
