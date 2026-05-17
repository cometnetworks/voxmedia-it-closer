import { action } from "./_generated/server";
import { v } from "convex/values";

export const sendMessage = action({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.error("TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no configurados.");
      return;
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: args.text,
          parse_mode: "Markdown",
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Error enviando mensaje a Telegram:", error);
      }
    } catch (e) {
      console.error("Error de red enviando a Telegram:", e);
    }
  },
});
