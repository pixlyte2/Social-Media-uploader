const User = require("../models/user");
const Company = require("../models/company");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// 🔥 ADD THIS FUNCTION
const getRedirectUrl = (role) => {
  switch (role) {
    case "SUPERADMIN":
      return "/superadmin/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
    case "USER":
      return "/user/dashboard";
    default:
      return "/";
  }
};


// 🔥 REGISTER SUPERADMIN
const registerSuperAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ role: "SUPERADMIN" });
    if (existing) {
      return res.status(400).json({ msg: "SuperAdmin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const superadmin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "SUPERADMIN"
    });

    const token = jwt.sign(
      {
        id: superadmin._id,
        role: superadmin.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      msg: "SuperAdmin created successfully",
      token,
      superadmin
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔍 Find user (include password if hidden in model)
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // 🔐 Password check
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid password" });
    }

    // 🔥 ADMIN validity check
    if (user.role === "ADMIN") {
      const company = await Company.findById(user.companyId);

      if (!company) {
        return res.status(400).json({ msg: "Company not found" });
      }

      if (new Date() > company.validUntil) {
        return res.status(403).json({
          msg: "Your validity has expired. Please contact SuperAdmin."
        });
      }
    }

    // 🔥 ALWAYS CREATE NEW TOKEN (IMPORTANT)
    const newToken = jwt.sign(
      {
        id: user._id,
        role: user.role,
        companyId: user.companyId
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 🔍 DEBUG (remove later)
    console.log("LOGIN ROLE:", user.role);

    // ✅ CLEAN RESPONSE (no password)
    res.json({
      token: newToken,
      role: user.role,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { registerSuperAdmin, login };