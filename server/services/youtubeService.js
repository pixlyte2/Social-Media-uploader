const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// 🔥 OAuth setup
const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

// 🔥 ONLY refresh token use (BEST PRACTICE)
oauth2Client.setCredentials({
  refresh_token: process.env.YOUTUBE_REFRESH_TOKEN
});

// 🔥 AUTO TOKEN REFRESH (IMPORTANT)
oauth2Client.on("tokens", (tokens) => {
  if (tokens.access_token) {
    console.log("🔄 New Access Token Generated");
  }
});

// 🔥 YouTube API
const youtube = google.youtube({
  version: "v3",
  auth: oauth2Client
});

// 🔥 Upload function
const uploadToYouTube = async (post) => {
  try {
    const filePath = path.join(__dirname, "..", post.filePath);

    // ✅ File check
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found: " + filePath);
    }

    console.log("📤 Uploading to YouTube:", post.caption);

    const res = await youtube.videos.insert({
      part: "snippet,status",
      requestBody: {
        snippet: {
          title: post.caption || "No Title",
          description: "Uploaded via SaaS"
        },
        status: {
          privacyStatus: "public"
        }
      },
      media: {
        body: fs.createReadStream(filePath)
      }
    });

    console.log("🎥 YouTube Uploaded:", res.data.id);

    return res.data.id;

  } catch (err) {
    console.log("❌ YouTube Upload Error:", err.message);
    throw err;
  }
};

module.exports = { uploadToYouTube };