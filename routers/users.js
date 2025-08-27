const express = require("express");
const jwt = require("jsonwebtoken");
const Users = require("../models/usermodel");

const usersRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "ashish84k";

// Middleware to authenticate JWT token
const authenticate = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await Users.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    req.user = user; // attach user to request
    
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Get current user profile
usersRouter.get("/profile", authenticate, (req, res) => {
  return res.json(req.user);
});

// Alias route
usersRouter.get("/me", authenticate, (req, res) => {
  return res.json(req.user);
});

// Get all active users except self
usersRouter.get("/allLogger", authenticate, async (req, res) => {
  try {
    const myId = req.user.id; // assume authenticate middleware sets req.user
    const allUsers = await Users.find({ 
        status: "active", 
        _id: { $ne: myId } 
      })
      .select("-password"); // remove password

    return res.status(200).json({ success: true, data: allUsers });
  } catch (err) {
    console.error("Error fetching users:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

module.exports = usersRouter;
