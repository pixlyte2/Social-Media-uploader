const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");

const {
  connectYouTube,
  youtubeCallback,
  getChannels
} = require("../controllers/youtubeController");

// 🔥 must use auth here
router.get("/connect", authMiddleware(), connectYouTube);

// 🔥 callback DOES NOT need auth (state handles user)
router.get("/callback", youtubeCallback);

// 🔥 get accounts
router.get("/accounts", authMiddleware(), getChannels);

router.get("/channels", authMiddleware(), getChannels);

module.exports = router;