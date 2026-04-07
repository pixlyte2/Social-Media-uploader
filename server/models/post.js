const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    caption: String,
    filePath: String,
    scheduledAt: Date,
    status: {
      type: String,
      enum: ["SCHEDULED", "PUBLISHED", "FAILED"],
      default: "SCHEDULED"
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);