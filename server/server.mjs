import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";

dotenv.config();

console.log("Starting server..."); // DEBUG

connectDB();

app.listen(5000, () => {
  console.log("Server running on port 5000");
});