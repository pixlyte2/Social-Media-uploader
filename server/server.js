const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// ROUTES
const authRoutes = require("./routes/authRoutes");
const superAdminRoutes = require("./routes/superadminRoutes");
const adminRoutes = require("./routes/adminRoutes");

// CONFIG
dotenv.config();

// INIT APP
const app = express();

// MIDDLEWARES
app.use(cors());
app.use(express.json());



// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/admin", adminRoutes);

// DB CONNECT
connectDB();

// START SERVER
console.log("Starting server...");
app.listen(5000, () => {
  console.log("Server running on port 5000");
});