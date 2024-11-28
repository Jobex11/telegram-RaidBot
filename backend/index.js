/*
const express = require("express");
const passport = require("passport");
const TwitterStrategy = require("passport-twitter").Strategy;
const session = require("express-session");
require("dotenv").config();

const app = express();

app.use(
  session({
    secret: "your-session-secret",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_API_KEY,
      consumerSecret: process.env.TWITTER_API_SECRET,
      callbackURL: process.env.TWITTER_CALLBACK_URL,
    },
    function (token, tokenSecret, profile, done) {
      return done(null, profile);
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

app.get("/auth/twitter", passport.authenticate("twitter"));

app.get(
  "/auth/twitter/callback",
  passport.authenticate("twitter", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/");
  }
);

app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    res.send(`
      <h1>Welcome, ${req.user.displayName}</h1>
      <img src="${req.user.photos[0].value}" alt="Profile Image">
      <p><a href='/logout'>Logout</a></p>
    `);
  } else {
    res.send(`
      <h1>Home Page</h1>
      <p><a href='/auth/twitter'>Login with Twitter</a></p>
    `);
  }
});

app.get("/logout", (req, res) => {
  req.logout((err) => {
    res.redirect("/");
  });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

*/

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const TwitterStrategy = require("passport-twitter").Strategy;
const session = require("express-session");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
app.use(express.json());

app.use(
  session({
    secret: "2c1db62ed717af9236f3f72b4d2f6790d0ff501b6f19d70861fa4532c1da8544",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

const {
  PORT,
  MONGO_URI,
  TELEGRAM_BOT_TOKEN,
  TWITTER_API_KEY,
  TWITTER_API_SECRET,
  CALLBACK_URL,
} = process.env;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Database connection error:", err));

const UserSchema = new mongoose.Schema({
  telegramId: String,
  twitterUsername: String,
  points: { type: Number, default: 0 },
});
const User = mongoose.model("User", UserSchema);

passport.use(
  new TwitterStrategy(
    {
      consumerKey: TWITTER_API_KEY,
      consumerSecret: TWITTER_API_SECRET,
      callbackURL: CALLBACK_URL,
    },
    async (token, tokenSecret, profile, done) => {
      try {
        const { username } = profile;
        let user = await User.findOne({ twitterUsername: username });

        if (!user) {
          user = await User.create({
            telegramId: null,
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

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;

  let user = await User.findOne({ telegramId });

  if (!user) {
    user = await User.create({ telegramId });
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🔗 Connect X Account",
              url: `https://telegram-raidbot.onrender.com/auth/twitter`,
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
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🔗 Connect X Account",
              url: `https://telegram-raidbot.onrender.com/auth/twitter`,
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

app.get("/auth/twitter", passport.authenticate("twitter"));

app.get(
  "/auth/twitter/callback",
  passport.authenticate("twitter", { failureRedirect: "/" }),
  async (req, res) => {
    try {
      const user = req.user;
      if (req.session.telegramId) {
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
      user.points += 10;
      await user.save();
      bot.sendMessage(chatId, "🎁 You claimed your reward! +10 points");
      break;
    default:
      bot.sendMessage(chatId, "❓ Unknown command.");
  }
});

app.listen(PORT || 3000, () => {
  console.log(`Server running on port ${PORT || 3000}`);
});
