const Company = require("../models/company");
const User = require("../models/user");
const bcrypt = require("bcrypt");



// ✅ CREATE COMPANY + ADMIN
const createCompanyWithAdmin = async (req, res) => {
  try {
    const {
      companyName,
      adminName,
      adminEmail,
      adminPassword,
      validityDays
    } = req.body;

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN"
    });

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validityDays);

    const company = await Company.create({
      name: companyName,
      companyId: "CMP_" + Date.now(),
      adminId: admin._id,
      validityDays,
      validUntil
    });

    admin.companyId = company._id;
    await admin.save();

   res.json({
  company,
  admin: {
    _id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    companyId: admin.companyId
  }
});

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ✅ GET ALL ADMINS
const getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "ADMIN" }).populate("companyId");
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ✅ GET SINGLE ADMIN
const getAdminById = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id).populate("companyId");

    if (!admin) return res.status(404).json({ msg: "Admin not found" });

    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const updateAdmin = async (req, res) => {
  try {
    const { name, email, validityDays } = req.body;

    // 🔹 Update Admin
    const admin = await User.findByIdAndUpdate(
      req.params.id,
      { name, email },
      { new: true }
    );

    if (!admin) {
      return res.status(404).json({ msg: "Admin not found" });
    }

    let updatedCompany = null;

    // 🔥 Update validity
    if (validityDays !== undefined) {
      const company = await Company.findById(admin.companyId);

      if (!company) {
        return res.status(404).json({ msg: "Company not found" });
      }

      let newValidUntil;

      // 🔥 FIX: force expire
      if (validityDays === 0) {
        newValidUntil = new Date(Date.now() - 1000);
      } else {
        const baseDate =
          company.validUntil > new Date()
            ? company.validUntil
            : new Date();

        baseDate.setDate(baseDate.getDate() + validityDays);
        newValidUntil = baseDate;
      }

      company.validityDays = validityDays;
      company.validUntil = newValidUntil;

      updatedCompany = await company.save(); // ✅ FIX
    }

    res.json({
      msg: "Admin updated successfully",
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        companyId: admin.companyId
      },
      company: updatedCompany
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ DELETE ADMIN
const deleteAdmin = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);

    if (!admin) return res.status(404).json({ msg: "Admin not found" });

    // delete company also (optional logic)
    await Company.findOneAndDelete({ adminId: admin._id });

    await User.findByIdAndDelete(req.params.id);

    res.json({ msg: "Admin deleted successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


module.exports = {
  createCompanyWithAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin
};