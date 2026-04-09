const mongoose = require("mongoose");

const socialAccountSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company"
        },
        platform: {
            type: String,
            default: "youtube"
        },
        accessToken: String,
        refreshToken: String,
        expiryDate: Number
    },
    { timestamps: true }
);

module.exports = mongoose.model("SocialAccount", socialAccountSchema);