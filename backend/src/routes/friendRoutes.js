// src/routes/friendRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Friendship = require("../models/Friendship");

// SEND REQUEST BY EMAIL
router.post("/request", async (req, res) => {
  const { senderId, recipientEmail } = req.body;
  try {
    const recipient = await User.findOne({ email: recipientEmail });
    if (!recipient) return res.status(404).json({ message: "User not found" });

    const request = await Friendship.create({ requester: senderId, recipient: recipient._id });
    res.status(201).json(request);
  } catch (err) {
    res.status(400).json({ message: "Request already exists or error occurred" });
  }
});

// ACCEPT REQUEST
router.put("/accept", async (req, res) => {
  const { requestId } = req.body;
  const request = await Friendship.findByIdAndUpdate(requestId, { status: "accepted" }, { new: true });
  res.json(request);
});

module.exports = router;
