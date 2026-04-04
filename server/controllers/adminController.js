import User from "../models/user";
import bcrypt from "bcrypt";

// CREATE USER
export const createUser = async (req, res) => {
  const { name, email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashed,
    role: "USER",
    companyId: req.user.companyId
  });

  res.json(user);
};

// GET USERS
export const getUsers = async (req, res) => {
  const users = await User.find({
    companyId: req.user.companyId
  });

  res.json(users);
};

// UPDATE USER
export const updateUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json(user);
};

// DELETE USER
export const deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);

  res.json({ msg: "User deleted" });
};