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

  // Unique link for each user
  const loginUrl = `${AUTH_URL}?chat_id=${chatId}`;

  // Send a message with an inline button
  bot.sendMessage(chatId, "Click the button below to log in with Twitter:", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Log in with Twitter",
            url: loginUrl, // URL to the OAuth login
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
