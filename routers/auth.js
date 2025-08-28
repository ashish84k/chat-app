const express = require("express");
const jwt = require("jsonwebtoken");
const Users = require("../models/usermodel");
const authenticate = require("../Middleware/authenticate");

const authRouter = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "ashish84k";

// 📌 Phone based login/signup
authRouter.post("/login", async (req, res) => {
  try {
    const { phone, name } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // 🔍 Check if user already exists
    let user = await Users.findOne({ phone });

    if (!user) {
      // ✅ Agar user nahi mila, naya create kar do
      user = await Users.create({
        name: name || `User`,
        phone,
        email: undefined,
        password: undefined,
        terms: true,
        img: undefined,
      });
    }

    // 🔑 JWT token generate
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    // 🍪 Cookie me store kar do
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", 
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 din
    });

    return res.status(200).json({
      success: true,
      message: user ? "Login successful" : "Account created & logged in",
      user,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});



// Get current logged-in user
authRouter.get("/me", authenticate, async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await Users.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json(user);
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
});

module.exports = authRouter;
