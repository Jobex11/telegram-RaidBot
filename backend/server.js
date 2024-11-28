const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bot = require("./bot"); // Import the Telegram bot
const User = require("./models/User"); // Import the User model

dotenv.config();

const app = express();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Endpoint for Twitter OAuth callback
app.get("/callback", async (req, res) => {
  const code = req.query.code;
  const chatId = req.query.state; // Retrieve the Telegram chat ID

  if (!code || !chatId) {
    res.status(400).send("Invalid request");
    return;
  }

  try {
    // Exchange the authorization code for an access token
    const tokenResponse = await axios.post(
      "https://api.twitter.com/2/oauth2/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: process.env.TWITTER_API_KEY,
        client_secret: process.env.TWITTER_API_SECRET,
        redirect_uri: process.env.REDIRECT_URI,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Retrieve the user's Twitter profile
    const userProfileResponse = await axios.get(
      "https://api.twitter.com/2/users/me",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const twitterUser = userProfileResponse.data.data;

    // Save or update the user data in MongoDB
    const user = await User.findOneAndUpdate(
      { chatId },
      {
        chatId,
        twitterId: twitterUser.id,
        twitterUsername: twitterUser.username,
        accessToken,
      },
      { upsert: true, new: true }
    );

    // Notify the user of a successful login
    bot.sendMessage(
      chatId,
      `🎉 You have successfully signed in to X with the username: *${user.twitterUsername}*`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "💼 Wallet Connect", callback_data: "wallet_connect" },
              { text: "📊 Activity", callback_data: "activity" },
            ],
            [
              { text: "🏆 Leaderboard", callback_data: "leaderboard" },
              { text: "ℹ️ Info", callback_data: "info" },
            ],
            [
              { text: "🎁 Claim Rewards", callback_data: "claimreward" },
              { text: "👤 Profile", callback_data: "profile" },
            ],
          ],
        },
      }
    );

    res.send("Authentication successful! You can return to the Telegram bot.");
  } catch (error) {
    console.error(
      "Error exchanging token:",
      error.response?.data || error.message
    );
    res.status(500).send("Authentication failed. Please try again.");
  }
});

// Start the server
app.listen(process.env.LOCAL || 3000, () => {
  console.log(`Server running at http://localhost:${process.env.PORT || 3000}`);
});

/*

const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const bot = require("./bot"); 

const app = express();

app.get("/auth/twitter", (req, res) => {
  const state = req.query.chat_id; 
  const twitterAuthUrl = `https://twitter.com/i/oauth2/authorize?${
    process.env.TWITTER_API_KEY
  }&redirect_uri=${encodeURIComponent(
    process.env.REDIRECT_URI
  )}&scope=tweet.read+users.read&state=${state}`;

  res.redirect(twitterAuthUrl);
});

app.get("/callback", async (req, res) => {
  const code = req.query.code;
  const chatId = req.query.state;

  if (!code || !chatId) {
    res.status(400).send("Invalid request");
    return;
  }

  try {
    const tokenResponse = await axios.post(
      "https://api.twitter.com/2/oauth2/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: process.env.TWITTER_API_KEY,
        client_secret: process.env.TWITTER_API_SECRET,
        redirect_uri: process.env.REDIRECT_URI,
      })
    );

    const accessToken = tokenResponse.data.access_token;

    bot.sendMessage(
      chatId,
      "You have successfully authenticated with Twitter! 🎉"
    );

    console.log(`Access Token for chat ${chatId}: ${accessToken}`);

    res.send("Authentication successful! You can return to the Telegram bot.");
  } catch (error) {
    console.error(
      "Error exchanging token:",
      error.response?.data || error.message
    );
    res.status(500).send("Authentication failed. Please try again.");
  }
});

app.listen(process.env.LOCAL, () => {
  console.log(`Server running at http://localhost:${process.env.LOCAL}`);
});

*/
