const axios = require("axios");

module.exports.sendText = async (to, message) => {
  try {
    await axios({
      method: "POST",
      url: `https://graph.facebook.com/v24.0/${process.env.PHONE_NUMBER_ID}/messages`,
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      data: {
        messaging_product: "whatsapp",
        to,
        text: { body: message },
      },
    });

    console.log("Reply sent to:", to);
  } catch (err) {
    console.error("WhatsApp Send Error:", err.response?.data || err);
  }
};
