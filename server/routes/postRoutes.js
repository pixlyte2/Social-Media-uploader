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
  retryPost,
  createBulkPosts,
  createSmartBulkPosts,
  getPostStatus
} = require("../controllers/postController");

// 🔥 CREATE POST
router.post(
  "/create",
  auth(),
  checkPermission("create_post"),
  upload.single("file"),
  createPost
);

// 🔥 BULK UPLOAD
router.post(
  "/bulk-create",
  auth(),
  checkPermission("create_post"),
  upload.array("files", 10),
  createBulkPosts
);

// 🔥 SMART BULK
router.post(
  "/smart-bulk",
  auth(),
  checkPermission("create_post"),
  upload.array("files", 20),
  createSmartBulkPosts
);

// 🔥 STATUS (⚠️ BEFORE :id)
router.get(
  "/status",
  auth(),
  checkPermission("view_post"),
  getPostStatus
);

// 🔥 GET ALL POSTS
router.get(
  "/",
  auth(),
  checkPermission("view_post"),
  getPosts
);

// 🔥 GET SINGLE POST (⚠️ LAST)
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