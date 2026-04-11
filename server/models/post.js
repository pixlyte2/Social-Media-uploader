const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    caption: String,
    filePath: String,
    scheduledAt: Date,

    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SocialAccount",
      required: true // 🔥 ADD THIS
    },

    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "PUBLISHED", "FAILED"],
      default: "PENDING"
    },

    retryCount: {
      type: Number,
      default: 0
    },

    lastError: {
      type: String,
      default: null
    },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company"
    },
    uploadedAt: {
  type: Date,
  default: null
},
isLocked: {
  type: Boolean,
  default: false
},
  },
  { timestamps: true }
);

// 🔥 FIX EXPORT (IMPORTANT)
module.exports = mongoose.model("Post", postSchema);