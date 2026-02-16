// src/routes/friendRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Friendship = require("../models/Friendship");


router.get("/emails/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const users = await User.find({ _id: { $ne: userId } })
      .select("email")
      .sort({ email: 1 })
      .lean();

    const emails = users
      .map((user) => user.email)
      .filter(Boolean);

    res.json(emails);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user emails" });
  }
});

// SEND REQUEST BY EMAIL
router.post("/request", async (req, res) => {
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

// GET ALL PENDING REQUESTS FOR A USER
router.get("/pending/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const requests = await Friendship.find({
      status: "pending",
      $or: [
        { recipient: userId },
        { requester: userId }
      ]
    })
      .populate("requester", "name email")
      .populate("recipient", "name email")
      .exec();

    console.log("Found Requests for UI:", requests);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
});

// GET ALL ACCEPTED FRIENDS FOR A USER
router.get("/accepted/:userId", async (req, res) => {
  const { userId } = req.params;
  console.log("Reqparams", req.params);
  try {
    const friendships = await Friendship.find({
      status: "accepted",
      $or: [{ requester: userId }, { recipient: userId }]
    }).populate("requester recipient", "name email role");

    const friends = friendships.map((f) => {
      const requesterId = f.requester._id.toString();
      const currentLoggedInId = userId.toString();

      return requesterId === currentLoggedInId ? f.recipient : f.requester;
    });

    console.log(`User ${userId} has ${friends.length} active contacts.`);
    res.json(friends);
  } catch (err) {
    res.status(500).json({ message: "Error fetching friends" });
  }
});

// ACCEPT REQUEST
router.put("/accept", async (req, res) => {
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

module.exports = router;
