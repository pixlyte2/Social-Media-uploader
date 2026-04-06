const Company = require("../models/company");

const checkValidity = async (req, res, next) => {
  try {
    const company = await Company.findById(req.user.companyId);

    if (!company) {
      return res.status(400).json({ msg: "Company not found" });
    }

    const currentDate = new Date();

    if (currentDate > company.validUntil) {
      return res.status(403).json({
        msg: "Company validity expired"
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = checkValidity;