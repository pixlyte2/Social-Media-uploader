import express from "express";
import { createCompanyWithAdmin } from "../controllers/superadminController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/create-company",
  authMiddleware(["SUPERADMIN"]),
  createCompanyWithAdmin
);

export default router;