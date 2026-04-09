const path = require("path");

// 🔥 Load .env
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { google } = require("googleapis");
const SocialAccount = require("../models/SocialAccount");

// 🔥 DEBUG ENV
console.log("CLIENT ID:", process.env.YOUTUBE_CLIENT_ID);
console.log("CLIENT SECRET:", process.env.YOUTUBE_CLIENT_SECRET);
console.log("REDIRECT URI:", process.env.YOUTUBE_REDIRECT_URI);

// ❗ DO NOT create global oauth2Client (temporary remove)
// const oauth2Client = new google.auth.OAuth2(...);

// 🔥 STEP 1: Generate URL
const connectYouTube = (req, res) => {
    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.YOUTUBE_CLIENT_ID,
            process.env.YOUTUBE_CLIENT_SECRET,
            process.env.YOUTUBE_REDIRECT_URI
        );

        const url = oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: ["https://www.googleapis.com/auth/youtube.upload"],
            prompt: "consent"
        });

        console.log("✅ OAuth URL generated");

        res.json({ url });

    } catch (err) {
        console.log("❌ CONNECT ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};

// 🔥 STEP 2: Callback
const youtubeCallback = async (req, res) => {
    try {
        console.log("👉 CALLBACK HIT");
        console.log("QUERY:", req.query);

        const code = req.query.code;

        if (!code) {
            console.log("❌ No code received");
            return res.status(400).send("No code in query");
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.YOUTUBE_CLIENT_ID,
            process.env.YOUTUBE_CLIENT_SECRET,
            process.env.YOUTUBE_REDIRECT_URI
        );

        console.log("👉 Exchanging code...");

        const { tokens } = await oauth2Client.getToken(code);

        console.log("✅ TOKENS RECEIVED:", tokens);

        // ⚠️ TEMP FIX (since no authMiddleware)
        const userId = "tempUser";
        const companyId = "tempCompany";

       await SocialAccount.findOneAndUpdate(
  {
    platform: "youtube"
  },
  {
    platform: "youtube",
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiryDate: tokens.expiry_date
  },
  { upsert: true, new: true }
);

        console.log("✅ TOKEN SAVED TO DB");

        res.send("✅ YouTube Connected Successfully");

    } catch (err) {
        console.log("❌ CALLBACK ERROR FULL:", err);
        console.log("❌ ERROR MESSAGE:", err.message);
        console.log("❌ ERROR STACK:", err.stack);

        res.status(500).send(err.message);
    }
};

module.exports = {
    connectYouTube,
    youtubeCallback
};