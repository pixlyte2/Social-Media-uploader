const express = require("express");

const {
  createCompanyWithAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin
} = require("../controllers/superadminController");

const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// 🔥 Only SUPERADMIN access
router.use(authMiddleware(["SUPERADMIN"]));

// ROUTES
router.post("/create-company", createCompanyWithAdmin);

// ADMIN CRUD
router.get("/admins", getAllAdmins);
router.get("/admins/:id", getAdminById);
router.put("/admins/:id", updateAdmin);
router.delete("/admins/:id", deleteAdmin);

module.exports = router;