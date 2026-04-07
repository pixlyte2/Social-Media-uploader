const { uploadToYouTube } = require("./services/youtubeService");

uploadToYouTube({
  caption: "🔥 My Test Video",
  filePath: "uploads/test.mp4"
});