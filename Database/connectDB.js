const mongoose = require("mongoose");
async function connectDB() {
    try {
        await mongoose.connect("mongodb://localhost:27017/ChatApp");
        console.log("Database connected successfully");
    } catch (error) {
        console.error("Database connection error:", error);
    }
}


module.exports = connectDB;
