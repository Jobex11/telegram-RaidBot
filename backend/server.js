const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const bot = require("./bot"); // Import the Telegram bot

const app = express();

app.get("/auth/twitter", (req, res) => {
  const state = req.query.chat_id; // Use chat_id as state for simplicity
  const twitterAuthUrl = `https://twitter.com/i/oauth2/authorize?${
    process.env.TWITTER_API_KEY
  }&redirect_uri=${encodeURIComponent(
    process.env.REDIRECT_URI
  )}&scope=tweet.read+users.read&state=${state}`;

  res.redirect(twitterAuthUrl);
});

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
      })
    );

    const accessToken = tokenResponse.data.access_token;

    // Inform the user via Telegram
    bot.sendMessage(
      chatId,
      "You have successfully authenticated with Twitter! 🎉"
    );

    // Save access token (e.g., in a database or in-memory store)
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

// Start the server
app.listen(process.env.PORT, () => {
  console.log(`Server running at http://localhost:${process.env.PORT}`);
});
