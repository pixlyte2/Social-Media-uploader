require("dotenv").config({ path: "./.env" });  // 🔥 force load
const { google } = require("googleapis");

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

const url = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: ["https://www.googleapis.com/auth/youtube.upload"],
  prompt: "consent" // 🔥 இது add பண்ணு (VERY IMPORTANT)
});
console.log("CLIENT:", process.env.YOUTUBE_CLIENT_ID);
console.log("👉 Open this URL:\n", url);