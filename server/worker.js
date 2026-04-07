const { Worker } = require("bullmq");
const mongoose = require("mongoose");
require("dotenv").config();

const Post = require("./models/post");

mongoose.connect(process.env.MONGO_URI);

const worker = new Worker(
  "postQueue",
  async job => {
    const { postId } = job.data;

    const post = await Post.findById(postId);

    if (!post) return;

    console.log("Publishing post:", post.caption);

    // 🔥 Mock publish
    post.status = "PUBLISHED";
    await post.save();
  },
  {
    connection: {
      host: "127.0.0.1",
      port: 6379
    }
  }
);

console.log("Worker running...");