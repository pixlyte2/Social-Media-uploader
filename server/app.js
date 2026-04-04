import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import superAdminRoutes from "./routes/superadminRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/admin", adminRoutes);

export default app;