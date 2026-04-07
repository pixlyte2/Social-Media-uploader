const Post = require("../models/post");
const queue = require("../queues/queue");

const createPost = async (req, res) => {
  try {
    const { caption, scheduledAt } = req.body;

    const post = await Post.create({
      caption,
      filePath: req.file.path.replace(/\\/g, "/"),
      scheduledAt,
      status: "PENDING",
      companyId: req.user.companyId
    });

    const delay = Math.max(new Date(scheduledAt) - new Date(), 0);

    await queue.add(
      "publish-post",
      { postId: post._id },
      {
        delay,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000
        }
      }
    );

    res.json(post);
  } catch (err) {
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
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  retryPost
};