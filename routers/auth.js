const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Users = require("../models/usermodel");
const authRouter = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "ashish84k";

// Simple email regex
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Signup
authRouter.post("/signup", async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword, terms } = req.body;
    console.log(req.body);

    if (!name || !email || !phone || !password || !confirmPassword)
      return res.status(400).json({ message: "All fields are required" });

    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    if (!terms) return res.status(400).json({ message: "You must accept the terms" });

    if (!isValidEmail(email))
      return res.status(400).json({ message: "Invalid email" });

    const userExists = await Users.findOne({ $or: [{ email }, { phone }] });
    if (userExists) return res.status(409).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await Users.create({
      name,
      email,
      phone,
      password: hashedPassword,
      terms,
      img: undefined
    });

    return res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Login
authRouter.post("/login", async (req, res) => {
  try {
    const { phone } = req.body;
    const password  = '11991911'
    if (!phone)
      return res.status(400).json({ message: "Phone is required" });

    const user = await Users.findOne({ phone });
    if (!user) return res.status(401).json({ message: "User not found please create an account" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    // JWT generate
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    // HTTP-only cookie me token set
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // production me true
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 din
    });

    return res.status(200).json({ message: "Login successful", user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Logout
authRouter.get("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ message: "Logged out successfully" });
});

// Get current logged-in user
authRouter.get("/me", async (req, res) => {
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
