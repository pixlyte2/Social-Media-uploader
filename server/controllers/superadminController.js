import Company from "../models/company.js";
import User from "../models/user.js";
import bcrypt from "bcrypt";

export const createCompanyWithAdmin = async (req, res) => {
  try {
    const {
      companyName,
      adminName,
      adminEmail,
      adminPassword,
      validityDays
    } = req.body;

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create Admin
    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN"
    });

    // Set expiry
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validityDays);

    // Create Company
    const company = await Company.create({
      name: companyName,
      companyId: "CMP_" + Date.now(),
      adminId: admin._id,
      validityDays,
      validUntil
    });

    // Link admin → company
    admin.companyId = company._id;
    await admin.save();

    res.json({
      msg: "Company & Admin created",
      company,
      admin
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};