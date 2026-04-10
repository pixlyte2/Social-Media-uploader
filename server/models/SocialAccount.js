const mongoose = require("mongoose");

const socialAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },
    platform: {
      type: String,
      default: "youtube"
    },

    accountEmail: String,
    channelId: {
      type: String,
      required: true
    },
    channelName: String,

    accessToken: String,
    refreshToken: {
      type: String,
      required: true
    },
    expiryDate: Number
  },
  { timestamps: true }
);

module.exports = mongoose.model("SocialAccount", socialAccountSchema);