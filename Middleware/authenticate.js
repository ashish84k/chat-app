
const jwt = require("jsonwebtoken");
const Users = require("../models/usermodel");

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

module.exports = authenticate;  