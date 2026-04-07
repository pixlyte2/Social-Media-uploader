const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const oauth2Client = new google.auth.OAuth2(
  "YOUR_CLIENT_ID",
  "YOUR_CLIENT_SECRET",
  "http://localhost:5000/oauth2callback"
);

oauth2Client.setCredentials({
  access_token: "YOUR_ACCESS_TOKEN",
  refresh_token: "YOUR_REFRESH_TOKEN"
});

const youtube = google.youtube({
  version: "v3",
  auth: oauth2Client
});

const uploadToYouTube = async (post) => {
  try {
    const filePath = path.join(__dirname, "..", post.filePath);

    const res = await youtube.videos.insert({
      part: "snippet,status",
      requestBody: {
        snippet: {
          title: post.caption,
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
    console.log("❌ Error:", err.message);
    throw err;
  }
};

module.exports = { uploadToYouTube };