const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: {
      type: String,
      enum: ["SUPERADMIN", "ADMIN", "USER"],
      default: "USER"
    },
    // 🔥 NEW: permissions
    permissions: {
      type: [String],
      default: []
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;