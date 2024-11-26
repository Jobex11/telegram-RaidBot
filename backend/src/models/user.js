const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  twitterHandle: { type: String, required: true },
  walletAddress: { type: String, required: false },
  points: { type: Number, default: 0 },
  badges: [String],
});

module.exports = mongoose.model("User", userSchema);
