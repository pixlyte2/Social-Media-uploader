const express = require("express");
const router = express.Router();

const upload = require("../middlewares/upload");
const auth = require("../middlewares/authMiddleware");
const checkPermission = require("../middlewares/checkPermission");

const {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  retryPost
} = require("../controllers/postController");

/*
🧠 FLOW:
auth() → user verify
checkPermission() → access control
controller → execute logic
*/

// 🔥 CREATE POST
router.post(
  "/create",
  auth(),
  checkPermission("create_post"),
  upload.single("file"),
  createPost
);

// 🔥 GET ALL POSTS
router.get(
  "/",
  auth(),
  checkPermission("view_post"),
  getPosts
);

// 🔥 GET SINGLE POST
router.get(
  "/:id",
  auth(),
  checkPermission("view_post"),
  getPostById
);

// 🔥 UPDATE POST
router.put(
  "/:id",
  auth(),
  checkPermission("edit_post"),
  updatePost
);

// 🔥 DELETE POST
router.delete(
  "/:id",
  auth(),
  checkPermission("delete_post"),
  deletePost
);

// 🔥 RETRY FAILED POST
router.post(
  "/:id/retry",
  auth(),
  checkPermission("retry_post"),
  retryPost
);

module.exports = router;