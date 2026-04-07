const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    caption: String,
    filePath: String,
    scheduledAt: Date,
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
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);