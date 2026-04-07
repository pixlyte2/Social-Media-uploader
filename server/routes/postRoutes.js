const express = require("express");
const router = express.Router();

const upload = require("../middlewares/upload");
const authMiddleware = require("../middlewares/authMiddleware");

const {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost
} = require("../controllers/postController");

// 🔥 ADMIN + USER allowed
router.post("/create", authMiddleware(["ADMIN", "USER"]), upload.single("file"), createPost);

router.get("/", authMiddleware(["ADMIN", "USER"]), getPosts);
router.get("/:id", authMiddleware(["ADMIN", "USER"]), getPostById);

router.put("/:id", authMiddleware(["ADMIN", "USER"]), updatePost);
router.delete("/:id", authMiddleware(["ADMIN", "USER"]), deletePost);

module.exports = router;