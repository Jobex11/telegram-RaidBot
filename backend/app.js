require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
app.use(cors());
app.use(bodyParser.json());

const CLIENT_ID = process.env.TWITTER_API_TOKEN;
const CLIENT_SECRET = process.env.TWITTER_API_SECRET;
const CALLBACK_URL = "http://localhost:3000/auth/callback"; // Frontend URL

// Get Twitter OAuth 2.0 token
app.get("/auth/twitter", async (req, res) => {
  const state = "some_random_state"; // Prevent CSRF
  const twitterAuthUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${CALLBACK_URL}&scope=tweet.read%20users.read&state=${state}&code_challenge=challenge&code_challenge_method=plain`;

  res.redirect(twitterAuthUrl);
});

// Exchange the authorization code for an access token
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
