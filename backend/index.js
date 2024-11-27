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
      try {
        const { username } = profile;
        let user = await User.findOne({ twitterUsername: username });

        if (!user) {
          user = await User.create({
            telegramId: null, // Will link with Telegram ID later
            twitterUsername: username,
          });
        }

        done(null, user);
      } catch (err) {
        done(err, null);
      }
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

  let user = await User.findOne({ telegramId });

  if (!user) {
    // If user doesn't exist, create a new record
    user = await User.create({ telegramId });
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🔗 Connect X Account",
              url: `https://your-app-url.com/auth/twitter`,
            },
          ],
        ],
      },
    };
    bot.sendMessage(
      chatId,
      "👋 Welcome! Please connect your X (Twitter) account by clicking the button below:",
      keyboard
    );
  } else if (!user.twitterUsername) {
    // User exists but hasn't connected X account
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🔗 Connect X Account",
              url: `https://your-app-url.com/auth/twitter`,
            },
          ],
        ],
      },
    };
    bot.sendMessage(
      chatId,
      "👋 Welcome back! Please connect your X account to proceed:",
      keyboard
    );
  } else {
    // User is already connected
    bot.sendMessage(chatId, `🎉 Welcome back, ${user.twitterUsername}!`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "📊 Leaderboard", callback_data: "leaderboard" }],
          [{ text: "📜 Activity", callback_data: "activity" }],
          [{ text: "💰 Wallet", callback_data: "wallet" }],
          [{ text: "🎁 Claim Reward", callback_data: "claim_reward" }],
        ],
      },
    });
  }
});

// Twitter OAuth Routes
app.get("/auth/twitter", passport.authenticate("twitter"));

app.get(
  "/auth/twitter/callback",
  passport.authenticate("twitter", { failureRedirect: "/" }),
  async (req, res) => {
    try {
      const user = req.user;
      if (req.session.telegramId) {
        // Link Telegram ID with the authenticated Twitter user
        await User.findByIdAndUpdate(user._id, {
          telegramId: req.session.telegramId,
        });
      }
      res.send(
        "🎉 Your X account has been successfully connected! You can now return to the Telegram bot."
      );
    } catch (err) {
      console.error("Error during callback:", err);
      res.status(500).send("Internal Server Error");
    }
  }
);

// Telegram Bot Button Handlers
bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const user = await User.findOne({ telegramId: query.from.id });

  if (!user) {
    bot.sendMessage(chatId, "⚠️ Please start by connecting your X account!");
    return;
  }

  switch (query.data) {
    case "leaderboard":
      bot.sendMessage(chatId, "📊 Leaderboard feature is under development.");
      break;
    case "activity":
      bot.sendMessage(chatId, "📜 Activity feature is under development.");
      break;
    case "wallet":
      bot.sendMessage(chatId, "💰 Wallet feature is under development.");
      break;
    case "claim_reward":
      user.points += 10; // Example reward
      await user.save();
      bot.sendMessage(chatId, "🎁 You claimed your reward! +10 points");
      break;
    default:
      bot.sendMessage(chatId, "❓ Unknown command.");
  }
});

// Start the Server
app.listen(PORT || 3000, () => {
  console.log(`Server running on port ${PORT || 3000}`);
});
