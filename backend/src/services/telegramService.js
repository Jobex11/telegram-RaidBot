const TelegramBot = require("node-telegram-bot-api");
const User = require("../models/user");

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Handle /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const text = "Welcome to the Raid Bot! Please link your Twitter account.";
  bot.sendMessage(chatId, text);
});

// Register Twitter handle
bot.onText(/\/link (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const twitterHandle = match[1];

  let user = await User.findOne({ telegramId: chatId });
  if (!user) {
    user = new User({ telegramId: chatId, twitterHandle });
    await user.save();
  }

  bot.sendMessage(chatId, `Your Twitter handle @${twitterHandle} is linked!`);
});

// Other commands...
module.exports = bot;
