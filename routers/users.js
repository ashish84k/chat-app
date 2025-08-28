const express = require("express");
const jwt = require("jsonwebtoken");
const Users = require("../models/usermodel");
const authenticate = require("../Middleware/authenticate");

const usersRouter = express.Router();


// Get current user profile
usersRouter.get("/profile", authenticate, (req, res) => {
  return res.json(req.user);
});

usersRouter.post('/profile/update', authenticate, async (req, res) => {
  const { name, description ,bio} = req.body;
  console.log("Updating profile for user:", req.body);

  try {
    const updatedUser = await Users.findByIdAndUpdate(
      req.user.id,
      { name, description , bio },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      data: updatedUser
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
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
      console.log("All active users fetched:", allUsers);
      
    return res.status(200).json({ success: true, data: allUsers });
  } catch (err) {
    console.error("Error fetching users:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

usersRouter.delete("/delete", authenticate, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id; // authenticate middleware se aayega
    
    const deletedUser = await Users.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Agar JWT cookie use kar rahe ho to logout karne ke liye clear kar do
    res.clearCookie("token");

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully.",
    });
  } catch (err) {
    console.error("Error deleting account:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});
usersRouter.post("/logout", authenticate, (req, res) => {
  try {
    // JWT cookie clear kar do (httpOnly, sameSite setup kiya hoga jab set kiya tha)
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production", // production me secure=true
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

module.exports = usersRouter;
