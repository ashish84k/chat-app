const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    terms: { type: Boolean, required: true },

    // ✅ Extra useful fields
    img: {
      type: String,
      default:
        "https://i.pinimg.com/736x/76/f3/f3/76f3f3007969fd3b6db21c744e1ef289.jpg",
    },
    bio: { type: String, default: "" },
    gender: { type: String, enum: ["male", "female", "other"], default: "other" },
    dob: { type: Date }, // Date of birth

    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      pincode: String,
    },

    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },

    isVerified: { type: Boolean, default: false }, // email/phone verification
    lastLogin: { type: Date },
    status: { type: String, enum: ["active", "inactive", "banned"], default: "active" },

    socialLinks: {
      facebook: String,
      twitter: String,
      instagram: String,
      linkedin: String,
    },
    
    isOnline: { type: Boolean, default: false },

    settings: {
      theme: { type: String, enum: ["light", "dark"], default: "light" },
      language: { type: String, default: "en" },
      notifications: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

const Users = mongoose.model("Users", userSchema);

module.exports = Users;
