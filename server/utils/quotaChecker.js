const Post = require("../models/post");

const getTodayUploadCount = async (companyId) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const count = await Post.countDocuments({
    companyId,
    status: "PUBLISHED",
    uploadedAt: { $gte: start, $lte: end }
  });

  return count;
};

module.exports = { getTodayUploadCount };