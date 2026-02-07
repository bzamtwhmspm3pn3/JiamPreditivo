const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin", "organizacao"], default: "user" },
  status: { type: String, enum: ["pending", "active", "suspended", "inactive"], default: "pending" },
  email_confirmado: { type: Boolean, default: false },
  email_token: String,
  email_token_expires: Date,
  reset_password_token: String,
  reset_password_expires: Date,
  lastLogin: Date,
  preferences: {
    language: { type: String, enum: ["pt", "en"], default: "pt" },
    theme: { type: String, enum: ["light", "dark"], default: "light" }
  }
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
