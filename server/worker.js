const { Worker } = require("bullmq");
const mongoose = require("mongoose");
require("dotenv").config();

const Post = require("./models/post");
const { uploadToYouTube } = require("./services/youtubeService");

// 🔥 DB connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected (Worker)"))
  .catch(err => console.log("DB Error:", err));

// 🔥 Worker
const worker = new Worker(
  "postQueue",
  async (job) => {
    const { postId } = job.data;

    const post = await Post.findById(postId);
    if (!post) return;

    // 🔥 prevent duplicate
    if (post.status === "PUBLISHED" || post.status === "PROCESSING") return;

    try {
      post.status = "PROCESSING";
      await post.save();

      console.log("Processing:", post.caption);

      // 🔥 YouTube upload
      const videoId = await uploadToYouTube(post);

      post.youtubeVideoId = videoId;
      post.status = "PUBLISHED";
      post.retryCount = 0;
      post.lastError = null;

      await post.save();

      console.log("Published:", post.caption);

    } catch (err) {
      post.retryCount += 1;
      post.lastError = err.message;

      console.log("❌ Failed:", post.caption, "Retry:", post.retryCount);
      console.log("❌ Error:", err.message);

      if (post.retryCount >= 3) {
        post.status = "FAILED";
        await post.save();

        console.log("Final Failed:", post.caption);
      } else {
        const delay = 5000 * post.retryCount;

        await post.save();

        await job.queue.add("publish-post", {
          postId: post._id
        }, { delay });
      }

      throw err;
    }
  },
  {
    connection: {
      host: "127.0.0.1",
      port: 6379
    }
  }
);

console.log("Worker running...");