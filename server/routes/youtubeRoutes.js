const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");

const {
    connectYouTube,
    youtubeCallback
} = require("../controllers/youtubeController");

// 🔥 OAuth connect
router.get("/connect", connectYouTube);

// 🔥 OAuth callback
router.get("/callback", youtubeCallback);

module.exports = router;