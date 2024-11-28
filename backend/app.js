const express = require("express");
const axios = require("axios");
const bot = require("./bot"); // Import the Telegram bot
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const app = express();

dotenv.config(); // Load environment variables from .env

// MongoDB connection using MONGO_URI
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error: ", err));

// Middleware
app.use(cors());
app.use(express.json());

// Mongoose model for saving user data
const User = require("./models/User");

// Twitter OAuth route
app.get("/auth/twitter", (req, res) => {
  const clientId = process.env.TWITTER_API_KEY;
  const redirectUri = "https://telegramxraid.vercel.app/";

  const twitterAuthUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=tweet.read%20users.read&state=state&code_challenge=challenge&code_challenge_method=plain`;
  res.redirect(twitterAuthUrl);
});

// OAuth Callback route to handle the response and save to MongoDB
app.get("/auth/callback", async (req, res) => {
  const { code, telegramUsername } = req.query; // Telegram username passed in query
  try {
    // Exchange OAuth code for access token
    const response = await axios.post(
      "https://api.twitter.com/2/oauth2/token",
      new URLSearchParams({
        code,
        grant_type: "authorization_code",
        client_id: process.env.TWITTER_API_KEY,
        client_secret: process.env.TWITTER_API_SECRET,
        redirect_uri: "https://telegramxraid.vercel.app/",
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const { access_token } = response.data;

    // Get Twitter user details
    const userResponse = await axios.get("https://api.twitter.com/2/users/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const twitterUsername = userResponse.data.data.username;

    // Save Telegram username and Twitter username to MongoDB
    const newUser = new User({
      telegramUsername,
      twitterUsername,
      accessToken: access_token,
    });
    await newUser.save();

    // Redirect the user back to frontend with token
    res.redirect(`https://telegramxraid.vercel.app/?token=${access_token}`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.status(500).send("Authentication failed");
  }
});

// Start the backend server
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

/*
 require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");

const bot = require("./bot"); 
const app = express(); 
app.use(cors());
app.use(bodyParser.json());

const CLIENT_ID = process.env.TWITTER_API_TOKEN;
const CLIENT_SECRET = process.env.TWITTER_API_SECRET;
const CALLBACK_URL = "https://telegramxraid.vercel.app//auth/callback"; 

app.get("/auth/twitter", async (req, res) => {
  const state = "some_random_state"; 
  const twitterAuthUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${CALLBACK_URL}&scope=tweet.read%20users.read&state=${state}&code_challenge=challenge&code_challenge_method=plain`;

  res.redirect(twitterAuthUrl);
});

app.get("/auth/callback", async (req, res) => {
  const { code } = req.query;

  try {
    const response = await axios.post(
      "https://api.twitter.com/2/oauth2/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: CALLBACK_URL,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    res.json({ access_token: response.data.access_token });
  } catch (error) {
    console.error("Error exchanging code for token:", error.response.data);
    res.status(500).json({ error: "Failed to authenticate" });
  }
});
app.listen(4000, () => console.log("Server running on port 4000"));
 
*/
