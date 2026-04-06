const express = require("express");

const {
  createUser,
  getUsers,
  updateUser,
  deleteUser
} = require("../controllers/adminController");

const authMiddleware = require("../middlewares/authMiddleware");
const checkValidity = require("../middlewares/checkValidity");

const router = express.Router();

// 🔥 Apply middlewares globally for this router
router.use(authMiddleware(["ADMIN"]));  // role + token check
router.use(checkValidity);              // company validity check

// ROUTES
router.post("/users", createUser);
router.get("/users", getUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

module.exports = router;