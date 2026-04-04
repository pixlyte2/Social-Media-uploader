import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
  name: String,
  companyId: String,
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  validityDays: Number,
  validUntil: Date
}, { timestamps: true });

const Company = mongoose.model("Company", companySchema);

export default Company;   // 🔥 MUST BE DEFAULT