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

    try {
      // 🔥 GET POST
      const post = await Post.findById(postId).lean();

      if (!post) {
        console.log("⚠️ Post not found, skipping...");
        return;
      }

      console.log("📦 POST DATA:", post);
      console.log("👉 accountId:", post.accountId);

      // 🔥 VALIDATION
      if (!post.accountId) {
        console.log("❌ accountId missing");
        return;
      }

      // 🔥 reload mongoose doc
      const postDoc = await Post.findById(postId);
      if (!postDoc) {
        console.log("⚠️ Post not found (second check)");
        return;
      }

      // 🔥 prevent duplicate processing
      if (
        postDoc.status === "PUBLISHED" ||
        postDoc.status === "PROCESSING"
      ) {
        console.log("⚠️ Already processed, skipping...");
        return;
      }

      // 🔥 mark processing
      postDoc.status = "PROCESSING";
      await postDoc.save();

      console.log("🚀 Processing:", postDoc.caption);

      // 🔥 YouTube upload
      const videoId = await uploadToYouTube(post);

      // 🔥 success update
      postDoc.youtubeVideoId = videoId;
      postDoc.status = "PUBLISHED";
      postDoc.retryCount = 0;
      postDoc.lastError = null;

      await postDoc.save();

      console.log("🎥 Uploaded:", videoId);
      console.log("✅ Published:", postDoc.caption);

    } catch (err) {
      console.log("❌ Upload Error FULL:", err.message);

      const postDoc = await Post.findById(postId);
      if (!postDoc) {
        console.log("⚠️ Post missing during error handling");
        return;
      }

      postDoc.retryCount += 1;
      postDoc.lastError = err.message;

      console.log("❌ Failed:", postDoc.caption, "Retry:", postDoc.retryCount);

      if (postDoc.retryCount >= 3) {
        postDoc.status = "FAILED";
        await postDoc.save();

        console.log("💀 Final Failed:", postDoc.caption);
      } else {
        const delay = 5000 * postDoc.retryCount;

        await postDoc.save();

        console.log("🔁 Retrying after delay:", delay);

        await job.queue.add(
          "publish-post",
          { postId: postDoc._id },
          { delay }
        );
      }

      // ❌ IMPORTANT: DO NOT THROW AGAIN
      // throw err;  ❌ removed
    }
  },
  {
    connection: {
      host: "127.0.0.1",
      port: 6379
    }
  }
);

console.log("🔥 Worker running...");