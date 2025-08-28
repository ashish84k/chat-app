const express = require("express");
const multer = require("multer");
const path = require("path");
const Users = require("../models/usermodel");
authenticate = require("../Middleware/authenticate");

const profileRouter = express.Router();

// ✅ Multer storage config (save inside public/uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ✅ Route for profile upload (protected)
profileRouter.post(
  "/profile/upload-profile",
  authenticate,
  upload.single("profile"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Public URL generate karo
      const fileUrl = `/uploads/${req.file.filename}`;

      // ✅ userId JWT middleware se aagaya
      const userId = req.user._id;

      // User model update karo
      const updatedUser = await Users.findByIdAndUpdate(
        userId,
        { img: fileUrl },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: "Profile uploaded successfully!",
        profileUrl: fileUrl,
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

module.exports = profileRouter;