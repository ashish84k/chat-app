const express = require("express");
const jwt = require("jsonwebtoken");
const Chats = require("../models/chatmodel");
const authenticate = require("../Middleware/authenticate");
const massageRouter = express.Router();

massageRouter.get("/messages/:partnerId", authenticate, async (req, res) => {
    const partnerId = req.params.partnerId;
    const token = req.cookies.token;

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
      const decoded = jwt.verify(token, "ashish84k");
      const userId = decoded.id; // current logged in user

      const messages = await Chats.find({
        $or: [
          { sender: userId, receiver: partnerId },
          { sender: partnerId, receiver: userId },
        ],
      })
        .sort({ createdAt: 1 })
        .populate("sender") 
        .populate("receiver")
        .limit(50)
        .exec();

      return res.json({ success: true, data: messages });
    } catch (err) {
      console.error("Error fetching messages:", err);
      return res.status(500).json({ success: false, error: "Server error" });
    }
  });



module.exports = massageRouter;