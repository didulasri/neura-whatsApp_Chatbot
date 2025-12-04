const axios = require("axios");

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
console.log("TOKEN FROM ENV:", WHATSAPP_TOKEN);
console.log("TOKEN LENGTH:", WHATSAPP_TOKEN?.length);

module.exports.sendText = async (to, message) => {
  try {
    await axios({
      method: "POST",
      url: `https://graph.facebook.com/v24.0/${PHONE_NUMBER_ID}/messages`,
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      data: {
        messaging_product: "whatsapp",
        to: to,
        text: { body: message },
      },
    });

    console.log("Message sent to:", to);
  } catch (err) {
    console.error(
      "Failed to send WhatsApp message:",
      err?.response?.data || err
    );
  }
};
