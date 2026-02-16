const Message = require("../models/Message");
const Friendship = require("../models/Friendship");

const registerSocketRoutes = (io) => {
  io.on("connection", (socket) => {
    console.log(`Connected: ${socket.id}`);

    socket.on("typing", (data) => {
      console.log("Typing event:", data);
      socket.to(data.recipientId.toString()).emit("user_typing", data);
    });

    
    socket.on("join_room", async (userId) => {
      if (!userId) return;

      const roomId = userId.toString();
      socket.join(roomId);
      console.log(`User ${roomId} joined room`);

      try {
      
        const history = await Message.find({
          $or: [{ senderId: roomId }, { recipientId: roomId }]
        }).sort({ createdAt: 1 });

        socket.emit("load_history", history);
      } catch (err) {
        console.error("Error fetching history:", err);
      }
    });

 
    socket.on("send_message", async (data) => {
      try {
     
        const sId = (data.senderId?._id || data.senderId).toString();
        const rId = (data.recipientId?._id || data.recipientId).toString();

        console.log(`Validating message from ${sId} to ${rId}`);

      
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

   
        const newMessage = await Message.create({
          senderId: sId,
          recipientId: rId,
          text: data.text
        });

 
        console.log(`Delivering message to room: ${rId}`);
        io.to(rId).emit("receive_message", newMessage);
      } catch (err) {
        console.error("🔥 Socket Message Error:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

module.exports = registerSocketRoutes;
