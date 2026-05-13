import { Telegraf } from "telegraf";

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.warn("⚠️ [Telegram] TELEGRAM_BOT_TOKEN is not set. Telegram bot features will be disabled.");
}

// Instantiate Bot with explicit type assertions if needed
export const bot = token ? new Telegraf(token) : null;

export async function startTelegramBot() {
  if (!bot) {
    console.warn("⚠️ [Telegram] Cannot start bot, token missing.");
    return;
  }

  try {
    console.log("🤖 [Telegram] Bootstrapping Telegram Bot listener...");
    
    // Register basic command
    bot.start((ctx) => ctx.reply("Welcome to Memo! Use `/link <api_key>` to link your telegram account with Memo application."));
    bot.help((ctx) => ctx.reply("Send me text, audio, images or documents and I will store them or perform requested tasks!"));
    
    const { registerTelegramHandlers } = await import("./handlers.js");
    await registerTelegramHandlers();

    bot.launch();
    console.log("🎉 [Telegram] Bot launched successfully in long-polling mode.");
  } catch (err) {
    console.error("❌ [Telegram] Startup failed:", err);
  }
}

// Enable graceful stop
process.once("SIGINT", () => bot?.stop("SIGINT"));
process.once("SIGTERM", () => bot?.stop("SIGTERM"));
