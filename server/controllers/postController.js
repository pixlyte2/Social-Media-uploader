const Post = require("../models/post");
const queue = require("../queues/queue");

// ✅ CREATE
const createPost = async (req, res) => {
  try {
    const { caption, scheduledAt } = req.body;

    const post = await Post.create({
      caption,
      filePath: req.file.path.replace(/\\/g, "/"),
      scheduledAt,
      companyId: req.user.companyId
    });

    await queue.add(
      "publish-post",
      { postId: post._id },
      {
        delay: new Date(scheduledAt) - new Date()
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

module.exports = {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost
};