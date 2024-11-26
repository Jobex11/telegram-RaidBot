require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const TwitterStrategy = require("passport-twitter").Strategy;
const session = require("express-session");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
app.use(express.json());

// Session setup
app.use(
  session({
    secret: "your-session-secret",
    resave: false,
    saveUninitialized: true,
  })
);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Environment Variables
const {
  PORT,
  MONGO_URI,
  TELEGRAM_BOT_TOKEN,
  TWITTER_API_KEY,
  TWITTER_API_SECRET,
  CALLBACK_URL,
} = process.env;

// Telegram Bot Initialization
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Database Connection
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Database connection error:", err));

// User Schema
const UserSchema = new mongoose.Schema({
  telegramId: String,
  twitterUsername: String,
  points: { type: Number, default: 0 },
});
const User = mongoose.model("User", UserSchema);

// Configure Twitter OAuth
passport.use(
  new TwitterStrategy(
    {
      consumerKey: TWITTER_API_KEY,
      consumerSecret: TWITTER_API_SECRET,
      callbackURL: CALLBACK_URL, // Redirect URL after successful login
    },
    async (token, tokenSecret, profile, done) => {
      // Save Twitter profile data in the database
      const { id, username } = profile;
      let user = await User.findOne({ twitterUsername: username });

      if (!user) {
        user = await User.create({
          telegramId: profile.id,
          twitterUsername: username,
        });
      }

      done(null, user);
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// Telegram Bot Commands
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  // Check if user exists
  let user = await User.findOne({ telegramId });
  if (!user) {
    // If the user doesn't exist, create one and send the authentication button
    user = await User.create({ telegramId });
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Connect X Account",
              url: `http://localhost:3000/auth/twitter`, // Redirect to Twitter OAuth
            },
          ],
        ],
      },
    };
    bot.sendMessage(
      chatId,
      "Welcome! Please connect your X account by clicking the button below.",
      keyboard
    );
  } else {
    bot.sendMessage(chatId, "Welcome back!");
  }
});

// Twitter OAuth Routes
app.get("/auth/twitter", passport.authenticate("twitter"));

app.get(
  "/auth/twitter/callback",
  passport.authenticate("twitter", { failureRedirect: "/" }),
  (req, res) => {
    const user = req.user;

    // Redirect to Telegram bot (or any confirmation page)
    res.send(`Twitter account connected: ${user.twitterUsername}`);
  }
);

// Start the Server
app.listen(PORT || 3000, () => {
  console.log(`Server running on port ${PORT || 3000}`);
});
