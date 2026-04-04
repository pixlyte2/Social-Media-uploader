import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: {
    type: String,
    enum: ["SUPERADMIN", "ADMIN", "USER"],
    default: "USER"
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    default: null
  }
}, { timestamps: true });




const User = mongoose.model("User", userSchema);

export default User;   // 🔥 MUST BE DEFAULT