const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const AUTH_URL = `${process.env.PORT}/auth/twitter`;

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    " 👋 Welcomee to raidbot, perform task on X to earn rewards. /login to proceed"
  );
});

// Handle /login command
bot.onText(/\/login/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(
    chatId,
    `👋 Welcome!\n\n🌟 You can choose to either connect your X account or proceed directly to the main page.`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🔗 Connect X Account", callback_data: "connect_x" },
            { text: "➡️ Main Page", callback_data: "proceed_main" },
          ],
        ],
      },
    }
  );
});

// Handle Callback Queries
bot.on("callback_query", async (query) => {
  const { data, message } = query;
  const chatId = message.chat.id;

  if (data === "proceed_main") {
    const telegramUsername = message.chat.username || "User";

    bot.sendMessage(
      chatId,
      `🚀 *Welcome to the Main Page, ${telegramUsername}!* 🌟\n\nChoose a feature to get started:`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🆕 New Campaign", callback_data: "newcampaign" },
              { text: "🏆 Leaderboard", callback_data: "leaderboard" },
            ],
            [
              { text: "🎁 Claim Rewards", callback_data: "claimreward" },
              { text: "💼 Wallet Connect", callback_data: "wallet_connect" },
            ],
            [
              { text: "📩 Notification ", callback_data: "notification" },
              { text: "👤 Profile", callback_data: "profile" },
            ],
            [{ text: "📊 Activity", callback_data: "activity" }],
          ],
        },
      }
    );
  } else if (data === "connect_x") {
    const twitterAuthUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${
      process.env.TWITTER_API_KEY
    }&redirect_uri=${encodeURIComponent(
      process.env.REDIRECT_URI
    )}&scope=tweet.read%20users.read&state=${chatId}`;

    bot.sendMessage(
      chatId,
      `🔗 Click [here](${twitterAuthUrl}) to connect your X account.`,
      { parse_mode: "Markdown" }
    );
  } else {
    // Placeholder responses for other features
    const featureMessages = {
      wallet_connect: "🔒 Wallet Connect is coming soon!",
      activity: "📊 Activity details coming soon!",
      leaderboard: "🏆 Leaderboard coming soon!",
      info: "ℹ️ Info page coming soon!",
      profile: "coming soon",
      claimreward: "coming soon",
    };

    bot.sendMessage(chatId, featureMessages[data] || "❓ Unknown action.");
  }
});

module.exports = bot;

/*
const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const AUTH_URL = `${process.env.PORT}/auth/twitter`;

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `Welcome! Use /login to authenticate with Twitter.`);
});

bot.onText(/\/login/, (msg) => {
  const chatId = msg.chat.id;

  const loginUrl = `${AUTH_URL}?chat_id=${chatId}`;

  bot.sendMessage(chatId, "Click the button below to log in with Twitter:", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Log in with Twitter",
            url: loginUrl,
          },
        ],
      ],
    },
  });
});

bot.on("message", (msg) => {
  console.log(`Received message: ${msg.text}`);
});

module.exports = bot;

*/
