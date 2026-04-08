const { uploadToYouTube } = require("./services/youtubeService");

uploadToYouTube({
  caption: "🔥 My Test Video",
  filePath: "uploads/1775560152126.mp4"
});