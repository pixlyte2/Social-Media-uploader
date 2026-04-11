const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const SocialAccount = require("../models/SocialAccount");

// 🔥 UPLOAD VIDEO
const uploadToYouTube = async (post) => {
  try {
     throw new Error("The user has exceeded the number of videos they may upload.");
    console.log("📦 POST DATA:", post);
    console.log("👉 accountId:", post.accountId);

    const account = await SocialAccount.findById(post.accountId);

    console.log("👉 DB ACCOUNT:", account);

    if (!account) {
      throw new Error("YouTube account not found");
    }

    console.log("👉 refreshToken:", account.refreshToken);

    // 🔥 OAuth client
    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI
    );

    // ✅ ONLY refresh_token (IMPORTANT FIX)
    oauth2Client.setCredentials({
      refresh_token: account.refreshToken
    });

    // 🔥 FORCE generate new access token
    const accessToken = await oauth2Client.getAccessToken();
    console.log("🔄 New Access Token Generated");

    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client
    });

    const filePath = path.join(__dirname, "..", post.filePath);

    console.log("📁 FILE PATH:", filePath);

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
    console.log("❌ Upload Error FULL:", err);
    console.log("❌ Upload Error:", err.message);
    throw err;
  }
};

// 🔥 GET CHANNELS
const getYouTubeChannels = async (refreshToken) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });

  // 🔥 ensure valid token
  await oauth2Client.getAccessToken();

  const youtube = google.youtube({
    version: "v3",
    auth: oauth2Client
  });

  const res = await youtube.channels.list({
    part: "snippet",
    mine: true
  });

  return res.data.items;
};

module.exports = {
  uploadToYouTube,
  getYouTubeChannels
};