const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { google } = require("googleapis");
const SocialAccount = require("../models/SocialAccount");


// 🔥 STEP 1: Generate OAuth URL
const connectYouTube = (req, res) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI
    );

    // 🔥 pass user info safely
    const state = Buffer.from(
      JSON.stringify({
        userId: req.user.id,
        companyId: req.user.companyId
      })
    ).toString("base64");

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/youtube",
        "https://www.googleapis.com/auth/youtube.upload"
      ],
      prompt: "consent",
      state
    });

    console.log("✅ OAuth URL generated");

    res.json({ url });

  } catch (err) {
    console.log("❌ CONNECT ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
};


// 🔥 STEP 2: CALLBACK
const youtubeCallback = async (req, res) => {
  try {
    console.log("👉 CALLBACK HIT");

    const code = req.query.code;
    const stateRaw = req.query.state;

    if (!code || !stateRaw) {
      return res.status(400).send("Missing code/state");
    }

    // 🔥 decode state
    const state = JSON.parse(Buffer.from(stateRaw, "base64").toString());

    const { userId, companyId } = state;

    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);

    // 🔥 IMPORTANT
    oauth2Client.setCredentials(tokens);

    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client
    });

    // 🔥 GET CHANNEL
    const channelRes = await youtube.channels.list({
      part: "snippet",
      mine: true
    });

    if (!channelRes.data.items.length) {
      return res.status(400).send("No YouTube channel found");
    }

    const channel = channelRes.data.items[0];

    console.log("🎯 CHANNEL:", channel.snippet.title);

    // 🔥 SAVE ACCOUNT
    await SocialAccount.findOneAndUpdate(
      {
        platform: "youtube",
        channelId: channel.id,
        companyId
      },
      {
        userId,
        companyId,
        platform: "youtube",
        channelId: channel.id,
        channelName: channel.snippet.title,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date
      },
      {
        upsert: true,
        returnDocument: "after"
      }
    );

    console.log("✅ CHANNEL SAVED");

    res.send("✅ YouTube Connected Successfully");

  } catch (err) {
    console.log("❌ CALLBACK ERROR:", err.message);
    res.status(500).send(err.message);
  }
};


// 🔥 GET CONNECTED ACCOUNTS
const getChannels = async (req, res) => {
  try {
    const accounts = await SocialAccount.find({
      companyId: req.user.companyId,
      platform: "youtube"
    }).select("_id channelName channelId");

    res.json(accounts);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


module.exports = {
  connectYouTube,
  youtubeCallback,
  getChannels
};