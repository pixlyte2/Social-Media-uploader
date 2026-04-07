const worker = new Worker(
  "postQueue",
  async job => {
    const { postId } = job.data;

    const post = await Post.findById(postId);
    if (!post) return;

    if (post.status === "PUBLISHED" || post.status === "PROCESSING") return;

    try {
      post.status = "PROCESSING";
      await post.save();

      console.log("Processing:", post.caption);

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

        await post.save(); // 🔥 save first

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