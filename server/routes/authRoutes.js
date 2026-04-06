const express = require("express");
const { login, registerSuperAdmin } = require("../controllers/authController");

const router = express.Router();

// 🔥 THIS IS SUPERADMIN CREATE
router.post("/register-superadmin", registerSuperAdmin);
router.post("/login", login);

module.exports = router;