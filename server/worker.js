const { Worker } = require("bullmq");
const mongoose = require("mongoose");
require("dotenv").config();

const Post = require("./models/post");
const { uploadToYouTube } = require("./services/youtubeService");
const { getTodayUploadCount } = require("./utils/quotaChecker");

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
        console.log("⚠️ Post not found");
        return;
      }

      // ⏳ TIME GUARD
      if (post.scheduledAt && new Date(post.scheduledAt).getTime() > Date.now()) {
        console.log("⏳ Not time yet, skipping...");
        return;
      }

      if (!post.accountId) {
        console.log("❌ accountId missing");
        return;
      }

      // 🔥 LOCK SYSTEM
      const lockedPost = await Post.findOneAndUpdate(
        {
          _id: postId,
          isLocked: false,
          status: { $ne: "PUBLISHED" }
        },
        {
          $set: {
            status: "PROCESSING",
            isLocked: true
          }
        },
        { returnDocument: "after" }
      );

      if (!lockedPost) {
        console.log("⛔ Already processing / locked");
        return;
      }

      console.log("🚀 Processing:", lockedPost.caption);

      // 🔥 QUOTA CHECK
      const todayCount = await getTodayUploadCount(post.companyId);
      const DAILY_LIMIT = 8;

      console.log("📊 Today uploaded:", todayCount);

      if (todayCount >= DAILY_LIMIT) {
        console.log("🚫 Daily limit reached → retry tomorrow");

        // ✅ UPDATE DB FIRST
        await Post.updateOne(
          { _id: postId },
          {
            $set: {
              status: "PENDING",
              lastError: "Daily limit reached",
              isLocked: false
            }
          }
        );

        const updated = await Post.findById(postId);
        console.log("🔥 AFTER UPDATE STATUS:", updated.status);

        // ✅ THEN ADD RETRY
        await job.queue.add(
          "publish-post",
          { postId },
          {
            delay: 24 * 60 * 60 * 1000,
            jobId: `retry-${postId}-${Date.now()}`
          }
        );

        return;
      }

      // 🔥 SMALL DELAY
      await new Promise(r => setTimeout(r, 2000));

      // 🔥 UPLOAD
      const videoId = await uploadToYouTube(post);

      // 🔥 SUCCESS
      await Post.updateOne(
        { _id: postId },
        {
          $set: {
            youtubeVideoId: videoId,
            status: "PUBLISHED",
            uploadedAt: new Date(),
            retryCount: 0,
            lastError: null,
            isLocked: false
          }
        }
      );

      console.log("🎥 Uploaded:", videoId);
      console.log("✅ Published:", lockedPost.caption);

    } catch (err) {
      console.log("❌ Upload Error:", err.message);

      const postDoc = await Post.findById(postId);
      if (!postDoc) return;

      console.log("🔥 BEFORE UPDATE STATUS:", postDoc.status);

      const errorMsg =
        err?.response?.data?.error?.message || err.message;

      console.log("❌ REAL ERROR:", errorMsg);

      // 🔥 YOUTUBE LIMIT ERROR
      if (errorMsg.toLowerCase().includes("exceeded")) {
        console.log("🚫 YouTube limit → retry tomorrow");

        // ✅ UPDATE FIRST
        await Post.updateOne(
          { _id: postId },
          {
            $set: {
              status: "PENDING",
              lastError: "Daily limit reached",
              isLocked: false
            }
          }
        );

        const updated = await Post.findById(postId);
        console.log("🔥 AFTER UPDATE STATUS:", updated.status);

        // ✅ RETRY
        await job.queue.add(
          "publish-post",
          { postId },
          {
            delay: 24 * 60 * 60 * 1000,
            jobId: `retry-${postId}-${Date.now()}`
          }
        );

        return;
      }

      // 🔁 NORMAL RETRY
      const retryCount = (postDoc.retryCount || 0) + 1;

      if (retryCount >= 3) {
        await Post.updateOne(
          { _id: postId },
          {
            $set: {
              status: "FAILED",
              retryCount,
              lastError: errorMsg,
              isLocked: false
            }
          }
        );

        console.log("💀 Final Failed:", postDoc.caption);
      } else {
        const delay = 5000 * retryCount;

        await Post.updateOne(
          { _id: postId },
          {
            $set: {
              retryCount,
              lastError: errorMsg,
              isLocked: false
            }
          }
        );

        await job.queue.add(
          "publish-post",
          { postId },
          {
            delay,
            jobId: `retry-${postId}-${retryCount}`
          }
        );

        console.log("🔁 Retrying in:", delay);
      }
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