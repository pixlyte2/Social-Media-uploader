const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const { google } = require("googleapis");

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

async function getToken() {
  try {
    const code = "4/0Aci98E_sXe99gVf_qCGIGGAXMKbus0aUcKMal1Se3vsLJijU3jdGS13UdkGSBs5XxgLAAg";

    const { tokens } = await oauth2Client.getToken(code);

    console.log("🔥 ACCESS TOKEN:\n", tokens.access_token);
    console.log("🔥 REFRESH TOKEN:\n", tokens.refresh_token);
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

getToken();