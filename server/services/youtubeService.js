const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const SocialAccount = require("../models/SocialAccount");

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

const uploadToYouTube = async (post) => {
  try {
    const account = await SocialAccount.findOne({
      companyId: post.companyId,
      platform: "youtube"
    });

    if (!account) {
      throw new Error("YouTube not connected");
    }

    oauth2Client.setCredentials({
      refresh_token: account.refreshToken
    });

    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client
    });

    const filePath = path.join(__dirname, "..", post.filePath);

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

    console.log("🎥 Uploaded:", res.data.id);

    return res.data.id;

  } catch (err) {
    console.log("❌ Upload Error:", err.message);
    throw err;
  }
};

module.exports = { uploadToYouTube };