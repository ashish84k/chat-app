require("dotenv").config();
const express = require("express");
const http = require("http");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

const profileRouter = require("./routers/profile");
const connectDB = require("./Database/connectDB");
const authRouter = require("./routers/auth");
const usersRouter = require("./routers/users");
const massageRouter = require("./routers/massage");
const Chats = require("./models/chatmodel");
const Users = require("./models/usermodel");

const app = express();
const server = http.createServer(app);



const JWT_SECRET = process.env.JWT_SECRET || "ashish84k";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";

// Middlewares
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public", "Frontend")));
app.use(express.static(path.join(__dirname, "public")));
// Routes
app.use(authRouter);
app.use(usersRouter);
app.use(massageRouter);
app.use(profileRouter);

// Serve frontend
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "public/Frontend/index.html"))
);
app.get("/login", (req, res) =>
  res.sendFile(path.join(__dirname, "public/Frontend/login.html"))
);
app.get("/signup", (req, res) =>
  res.sendFile(path.join(__dirname, "public/Frontend/signup.html"))
);

// Socket.io setup
const io = new Server(server, { cors: { origin: FRONTEND_ORIGIN, credentials: true } });

// Online users map: userId -> Set(socketId)
const onlineUsers = new Map();
function addOnlineUser(userId, socketId) {
  const set = onlineUsers.get(userId) || new Set();
  set.add(socketId);
  onlineUsers.set(userId, set);
}
function removeOnlineUserBySocket(socketId) {
  for (const [userId, set] of onlineUsers.entries()) {
    if (set.has(socketId)) {
      set.delete(socketId);
      if (set.size === 0) onlineUsers.delete(userId);
      return userId;
    }
  }
  return null;
}
function getSocketIds(userId) {
  const set = onlineUsers.get(userId);
  return set ? Array.from(set) : [];
}

// Authenticate socket
io.use((socket, next) => {
  try {
    let token = socket.handshake.auth?.token;
    if (!token && socket.handshake.headers?.cookie) {
      const cookies = socket.handshake.headers.cookie.split(";").map(c => c.trim());
      const tokenCookie = cookies.find(c => c.startsWith("token="));
      if (tokenCookie) token = tokenCookie.split("=")[1];
    }
    if (!token) return next(new Error("Authentication error"));
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error("Authentication error"));
  }
});

// Socket connection
io.on("connection", async (socket) => {

  const update = await Users.updateOne(
  { _id: socket.userId },
  { $set: { isOnline: true } }
);

if (update.modifiedCount > 0) {
  console.log(`User ${socket.userId} set to online`);
}

const User = await Users.findById(socket.userId).select("-password");

if (User) {
  addOnlineUser(socket.userId, socket.id);

  // sab clients ko bhejo (including jisne connect kiya hai)
  io.emit("userOnline", { userId: socket.userId, User });
}

  // Send/Receive messages
  socket.on("chat-message", async (msg) => {
    if (!msg?.to || !msg?.text) return;
    const saved = await Chats.create({
      sender: socket.userId,
      receiver: msg.to,
      message: msg.text,
      status: "sent",
    });

    const payload = {
      _id: saved._id,
      from: socket.userId,
      text: msg.text,
      timestamp: saved.createdAt,
      status: saved.status,
    };

    // Emit to receiver if online
    const receiverSockets = getSocketIds(msg.to);
    if (receiverSockets.length > 0) {
      receiverSockets.forEach(sid => io.to(sid).emit("chat-message", payload));
      await Chats.findByIdAndUpdate(saved._id, { status: "delivered" });
    }

    // Acknowledge sender
    const senderSockets = getSocketIds(socket.userId);
    senderSockets.forEach(sid => io.to(sid).emit("chat-message-saved", payload));
  });

  // Optional: mark messages as seen
  socket.on("messages-seen", async (payload) => {
    if (!payload?.messageIds?.length) return;
    const userId = socket.userId;

    await Chats.updateMany(
      { _id: { $in: payload.messageIds }, receiver: userId },
      { $set: { status: "seen" } }
    );

    const updated = await Chats.find({ _id: { $in: payload.messageIds } });
    updated.forEach(doc => {
      const senderId = String(doc.sender);
      getSocketIds(senderId).forEach(sid =>
        io.to(sid).emit("message-seen", { messageId: String(doc._id) })
      );
    });
  });

// Typing indicators
socket.on("typing", (receiverId) => {
  if (!receiverId) return;
  console.log(`User ${socket.userId} is typing to ${receiverId}`);

  // Sirf receiver ke sockets ko event bhejna
  const receiverSockets = getSocketIds(receiverId);
  receiverSockets.forEach(sid =>
    io.to(sid).emit("typing", { from: socket.userId })
  );
});

socket.on("stopTyping", (receiverId) => {
  if (!receiverId) return;
  console.log(`User ${socket.userId} stopped typing to ${receiverId}`);

  const receiverSockets = getSocketIds(receiverId);
  receiverSockets.forEach(sid =>
    io.to(sid).emit("stopTyping", { from: socket.userId })
  );
});




  socket.on("disconnect", async () =>{
    console.log('disconnected... ');
    const update = await Users.updateOne({ _id: socket.userId }, { $set: { isOnline: false } });
    if(update.modifiedCount > 0) {
      console.log(`User ${socket.userId} set to offline`);
    }
    const User = await Users.findById(socket.userId).select("-password");
    if(User) {
      removeOnlineUserBySocket(socket.id);
      io.emit("user-offline", { userId: socket.userId, User });
    }


  });
});

// Fetch conversation between users
app.get("/conversations/:otherUserId", async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const decoded = jwt.verify(token, JWT_SECRET);
    const me = decoded.id;
    const other = req.params.otherUserId;

    const messages = await Chats.find({
      $or: [
        { sender: me, receiver: other },
        { sender: other, receiver: me },
      ],
    }).sort({ createdAt: 1 });

    res.json({ success: true, data: messages });
  } catch {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  try {
    await connectDB();
    console.log("MongoDB connected");
  } catch (err) {
    console.error("DB connect error:", err);
    process.exit(1);
  }
});
