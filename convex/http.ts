import { httpRouter } from "convex/server";
import { handleVapiWebhook } from "./vapiWebhook";
import { handleTelegramWebhook } from "./telegramWebhook";

const http = httpRouter();

// Vapi end-of-call webhook
http.route({
  path: "/vapi",
  method: "POST",
  handler: handleVapiWebhook,
});

// Telegram bot webhook (bidirectional)
http.route({
  path: "/telegram-webhook",
  method: "POST",
  handler: handleTelegramWebhook,
});

export default http;
