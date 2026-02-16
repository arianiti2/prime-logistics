const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./src/config/db");
const morgan = require("morgan");
const path = require('path'); 
const http = require('http');
const { Server } = require("socket.io");

// Models
const User = require("./src/models/User");
const Message = require("./src/models/Message");
const Friendship = require("./src/models/Friendship");

// Routes
const authRoutes = require("./src/routes/authRoutes");
const inventoryRoutes = require("./src/routes/inventoryRoutes");
const salesRoutes = require("./src/routes/salesRoutes");
const customerRoutes = require("./src/routes/customerRoutes");
const errorHandler = require('./src/middlewares/errorMiddleware');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const corsOrigin = process.env.CORS_ORIGIN;
console.log("CORS Origin set to:", corsOrigin);
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"]
  }
});

app.use(cors({ origin: corsOrigin }));
app.use(express.json());
app.use(morgan("dev")); 

/**
 * 1. FRIENDSHIP API PROCESS
 */

// Route to send a friend request via email
app.post("/api/friends/request", async (req, res) => {
  const { senderId, recipientEmail } = req.body;
  try {
    const recipient = await User.findOne({ email: recipientEmail });
    if (!recipient) return res.status(404).json({ message: "User with this email not found" });
    
    if (senderId === recipient._id.toString()) {
      return res.status(400).json({ message: "You cannot add yourself" });
    }

    const newRequest = await Friendship.create({
      requester: senderId,
      recipient: recipient._id,
      status: "pending"
    });
    res.status(201).json(newRequest);
  } catch (err) {
    res.status(400).json({ message: "Request already sent or error occurred" });
  }
});

// Route to get all pending requests for a user
app.get("/api/friends/pending/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        
        const requests = await Friendship.find({ 
            status: "pending",
            $or: [
                { recipient: userId }, // Requests sent TO you
                { requester: userId }  // Requests sent BY you
            ]
        })
        .populate("requester", "name email") // Show who sent it
        .populate("recipient", "name email") // Show who is receiving it
        .exec();

        console.log("Found Requests for UI:", requests);
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: "Error" });
    }
});


app.get("/api/friends/accepted/:userId", async (req, res) => {
  const { userId } = req.params;
  console.log("Reqparams", req.params);
  try {
    const friendships = await Friendship.find({
      status: "accepted",
      $or: [{ requester: userId }, { recipient: userId }]
    }).populate("requester recipient", "name email role");

    const friends = friendships.map(f => {
      // Convert everything to String to be 100% sure the comparison works
      const requesterId = f.requester._id.toString();
      const currentLoggedInId = userId.toString();

      // If I am the requester, give me the recipient. 
      // If I am the recipient, give me the requester.
      return requesterId === currentLoggedInId ? f.recipient : f.requester;
    });

    console.log(`User ${userId} has ${friends.length} active contacts.`);
    res.json(friends);
  } catch (err) {
    res.status(500).json({ message: "Error fetching friends" });
  }
});


// Route to accept a request
app.put("/api/friends/accept", async (req, res) => {
  const { requestId } = req.body;
  try {
    const friendship = await Friendship.findByIdAndUpdate(
      requestId, 
      { status: "accepted" }, 
      { new: true }
    );
    res.json(friendship);
  } catch (err) {
    res.status(500).json({ message: "Error accepting request" });
  }
});

/**
 * 2. WEBSOCKET LOGIC (REVISED FOR LOGISTICS FRIENDSHIP)
 */
io.on("connection", (socket) => {
  console.log(`Connected: ${socket.id}`);
  socket.on("typing", (data) => {
    // data = { senderId: "...", recipientId: "...", isTyping: true }
    console.log("Typ", data);
    socket.to(data.recipientId.toString()).emit("user_typing", data);
  });
  // 1. JOIN ROOM
  socket.on("join_room", async (userId) => {
    if (!userId) return;
    
    const roomId = userId.toString();
    socket.join(roomId);
    console.log(`User ${roomId} joined room`);
    
    try {
      // Find history involving this user
      const history = await Message.find({
        $or: [
          { senderId: roomId },
          { recipientId: roomId }
        ]
      }).sort({ createdAt: 1 });
      
      socket.emit("load_history", history);
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  });

  // 2. SEND MESSAGE
  socket.on("send_message", async (data) => {
    try {
      // Extract clean string IDs
      const sId = (data.senderId?._id || data.senderId).toString();
      const rId = (data.recipientId?._id || data.recipientId).toString();

      console.log(`Validating message from ${sId} to ${rId}`);

      // Check friendship status
      const areFriends = await Friendship.findOne({
        status: "accepted",
        $or: [
          { requester: sId, recipient: rId },
          { requester: rId, recipient: sId }
        ]
      });

      if (!areFriends) {
        console.log("❌ Blocked: Users are not accepted friends.");
        return;
      }

      // Save message to MongoDB
      const newMessage = await Message.create({
        senderId: sId,
        recipientId: rId,
        text: data.text
      });

      // Emit to the RECIPIENT'S room
      console.log(`✅ Delivering message to room: ${rId}`);
      io.to(rId).emit("receive_message", newMessage);
      
    } catch (err) {
      console.error("🔥 Socket Message Error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});


// Existing Routes
app.use("/api/auth", authRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/customers", customerRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
