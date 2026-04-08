const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const { google } = require("googleapis");

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

async function getToken() {
  const code = "4%2F0Aci98E-EYqF8DbqBpZ5WOzsjbd5_5SAHA67F_pNMcuQ4MyEM04qA9-lrS5phhogyYfu9Hg"; // 🔥 paste here

  const { tokens } = await oauth2Client.getToken(code);

  console.log("🔥 ACCESS TOKEN:\n", tokens.access_token);
  console.log("🔥 REFRESH TOKEN:\n", tokens.refresh_token);
}

getToken();