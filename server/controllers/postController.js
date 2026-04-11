const Post = require("../models/post");
const queue = require("../queues/queue");


const mongoose = require("mongoose");

const moment = require("moment-timezone");

const createPost = async (req, res) => {
  try {
    const caption = req.body.caption;
    const scheduledAt = req.body.scheduledAt;
    const accountId = req.body.accountId;

    const scheduledIST = moment.tz(scheduledAt, "Asia/Kolkata");

    // 🔥🔥🔥 ADD THIS VALIDATION
    if (scheduledIST.valueOf() <= Date.now()) {
      return res.status(400).json({
        msg: "❌ Please select a future time"
      });
    }

    const delay = scheduledIST.valueOf() - Date.now();

    console.log("🕒 Scheduled IST:", scheduledIST.format());
    console.log("⏳ Delay (ms):", delay);

    const post = await Post.create({
      caption,
      filePath: req.file.path.replace(/\\/g, "/"),
      scheduledAt: scheduledIST.toDate(),
      accountId,
      status: "PENDING",
      companyId: req.user.companyId
    });

    await queue.add(
      "publish-post",
      { postId: post._id },
      { delay }
    );

    res.json(post);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const createBulkPosts = async (req, res) => {
  try {
    console.log("📥 BULK BODY:", req.body);
    console.log("📁 FILES COUNT:", req.files?.length);

    const { caption, scheduledAt, accountId } = req.body;

    if (!req.files || req.files.length === 0) {
      console.log("❌ No files received");
      return res.status(400).json({ msg: "No files uploaded" });
    }

    if (!accountId) {
      console.log("❌ accountId missing");
      return res.status(400).json({ msg: "accountId is required" });
    }

    const scheduledIST = moment.tz(scheduledAt, "Asia/Kolkata");

    console.log("🕒 BASE SCHEDULE:", scheduledIST.format());

    if (scheduledIST.valueOf() <= Date.now()) {
      console.log("❌ Past time selected");
      return res.status(400).json({
        msg: "❌ Please select a future time"
      });
    }

    const posts = [];

    // 🔥 loop all files
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      console.log(`\n📦 Processing File ${i + 1}/${req.files.length}`);
      console.log("📁 File Name:", file.originalname);

      // 🔥 stagger (5 min gap)
      const scheduledTime = scheduledIST.clone().add(i * 5, "minutes");

      const delay = scheduledTime.valueOf() - Date.now();

      console.log("🕒 Scheduled Time:", scheduledTime.format());
      console.log("⏳ Delay (ms):", delay);

      const post = await Post.create({
        caption: caption || `Video ${i + 1}`,
        filePath: file.path.replace(/\\/g, "/"),
        scheduledAt: scheduledTime.toDate(),
        accountId,
        status: "PENDING",
        companyId: req.user.companyId
      });

      console.log("✅ Post Created ID:", post._id);

      await queue.add(
        "publish-post",
        { postId: post._id },
        { delay }
      );

      console.log("🚀 Job added to queue");

      posts.push(post);
    }

    console.log("\n🎯 BULK UPLOAD COMPLETE");
    console.log("📊 Total Posts:", posts.length);

    res.json({
      msg: "✅ Bulk upload scheduled",
      total: posts.length,
      posts
    });

  } catch (err) {
    console.log("❌ BULK ERROR FULL:", err);
    console.log("❌ ERROR MESSAGE:", err.message);

    res.status(500).json({ error: err.message });
  }
};


const createSmartBulkPosts = async (req, res) => {
  try {
    const { caption, scheduledAt, accountId } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ msg: "No files uploaded" });
    }

    if (!accountId) {
      return res.status(400).json({ msg: "accountId is required" });
    }

    const baseTime = moment.tz(scheduledAt, "Asia/Kolkata");

    if (baseTime.valueOf() <= Date.now()) {
      return res.status(400).json({
        msg: "❌ Please select future time"
      });
    }

    // 🔥 SETTINGS
    const MAX_PER_DAY = 20; // YouTube safe
    const GAP_MINUTES = 5; // delay gap

    const posts = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      // 🔥 calculate day offset
      const dayOffset = Math.floor(i / MAX_PER_DAY);

      // 🔥 position inside the day
      const positionInDay = i % MAX_PER_DAY;

      // 🔥 final schedule time
      const scheduledTime = baseTime
        .clone()
        .add(dayOffset, "days")
        .add(positionInDay * GAP_MINUTES, "minutes");

      const delay = Math.max(
        scheduledTime.valueOf() - Date.now(),
        0
      );

      console.log(`\n📦 Video ${i + 1}`);
      console.log("📁 File:", file.originalname);
      console.log("📅 Day Offset:", dayOffset);
      console.log("⏰ Scheduled:", scheduledTime.format());
      console.log("⏳ Delay:", delay);

      const post = await Post.create({
        caption: caption || `Video ${i + 1}`,
        filePath: file.path.replace(/\\/g, "/"),
        scheduledAt: scheduledTime.toDate(),
        accountId,
        status: "PENDING",
        companyId: req.user.companyId
      });

      await queue.add(
        "publish-post",
        { postId: post._id },
        { delay }
      );

      posts.push(post);
    }

    res.json({
      msg: "🔥 Smart bulk scheduled",
      total: posts.length,
      posts
    });

  } catch (err) {
    console.log("❌ SMART ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};


const getPostStatus = async (req, res) => {
  try {
    const companyId = new mongoose.Types.ObjectId(req.user.companyId);

    console.log("📊 STATUS FETCH:", companyId);

    const stats = await Post.aggregate([
      {
        $match: { companyId }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      total: 0,
      pending: 0,
      processing: 0,
      published: 0,
      failed: 0,
      progress: 0
    };

    stats.forEach(item => {
      result.total += item.count;

      if (item._id === "PENDING") result.pending = item.count;
      if (item._id === "PROCESSING") result.processing = item.count;
      if (item._id === "PUBLISHED") result.published = item.count;
      if (item._id === "FAILED") result.failed = item.count;
    });

    result.progress =
      result.total === 0
        ? 0
        : Math.round((result.published / result.total) * 100);

    console.log("📊 RESULT:", result);

    res.json(result);

  } catch (err) {
    console.log("❌ STATUS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ GET ALL POSTS
const getPosts = async (req, res) => {
  try {
    const posts = await Post.find({
      companyId: req.user.companyId
    }).sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ GET SINGLE POST
const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ msg: "Post not found" });

    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ UPDATE POST
const updatePost = async (req, res) => {
  try {
    const { caption, scheduledAt } = req.body;

    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ msg: "Post not found" });

    // 🔥 Only allow update if not published
    if (post.status === "PUBLISHED") {
      return res.status(400).json({ msg: "Cannot update published post" });
    }

    post.caption = caption || post.caption;
    post.scheduledAt = scheduledAt || post.scheduledAt;

    await post.save();

    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ DELETE POST
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ msg: "Post not found" });

    // 🔥 prevent deleting published post
    if (post.status === "PUBLISHED") {
      return res.status(400).json({ msg: "Cannot delete published post" });
    }

    await post.deleteOne();

    res.json({ msg: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const retryPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // 🔥 Only allow retry if FAILED
    if (post.status !== "FAILED") {
      return res.status(400).json({ msg: "Only failed posts can be retried" });
    }

    // 🔥 Reset values
    post.status = "PENDING";
    post.retryCount = 0;
    post.lastError = null;

    await post.save();

    // 🔥 Push again to queue
    await queue.add(
      "publish-post",
      { postId: post._id },
      {
        delay: 0, // immediate retry
        attempts: 3
      }
    );

    res.json({
      msg: "Retry started",
      post
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createPost,
  createBulkPosts,
  createSmartBulkPosts,
  getPostStatus,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  retryPost
};