const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema({
  postId: { type: String, required: true },
  description: { type: String },
  pointsPerAction: {
    like: { type: Number, default: 1 },
    retweet: { type: Number, default: 2 },
    comment: { type: Number, default: 3 },
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  participants: [String],
});

module.exports = mongoose.model("Campaign", campaignSchema);
