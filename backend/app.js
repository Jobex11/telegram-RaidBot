const express = require("express");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");
const campaignRoutes = require("./routes/campaignRoutes");
const rewardRoutes = require("./routes/rewardRoutes");

dotenv.config();

const app = express();
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/rewards", rewardRoutes);

module.exports = app;
