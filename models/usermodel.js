const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: "user" },

    email: {
      type: String,
      unique: true,
      sparse: true, // allow null/multiple empty
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      default: `${Date.now().toLocaleString()}@gmail.com`,
    },

    phone: { type: String, required: true, unique: true },

    password: { type: String, default: null }, // ab required nahi
    terms: { type: Boolean, default: true }, // by default accepted

    // ✅ Extra useful fields
    img: {
      type: String,
      default:
        "https://i.pinimg.com/736x/76/f3/f3/76f3f3007969fd3b6db21c744e1ef289.jpg",
    },
    bio: { type: String, default: "Chat user" },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
    },

    dob: { type: Date, default: null },

    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      country: { type: String, default: "" },
      pincode: { type: String, default: "" },
    },

    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },

    isVerified: { type: Boolean, default: false },
    lastLogin: { type: Date, default: null },

    status: {
      type: String,
      enum: ["active", "inactive", "banned"],
      default: "active",
    },

    socialLinks: {
      facebook: { type: String, default: "" },
      twitter: { type: String, default: "" },
      instagram: { type: String, default: "" },
      linkedin: { type: String, default: "" },
    },

    isOnline: { type: Boolean, default: true },

    settings: {
      theme: { type: String, enum: ["light", "dark"], default: "light" },
      language: { type: String, default: "en" },
      notifications: { type: Boolean, default: true },
    },

    skills: {
      type: [String],
      default: ['chatter'],
    },

    description: {
      type: String,
      default: "User description",
    },
  },
  { timestamps: true }
);

const Users = mongoose.model("Users", userSchema);

module.exports = Users;
