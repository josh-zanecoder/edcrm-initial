import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firebase_uid: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    role: { type: String, required: true },
    status: { type: String, default: "active" },
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
