import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

export const handleTelegramWebhook = httpAction(async (ctx, request) => {
  const payload = await request.json();
  const message = payload.message;

  if (!message) {
    return new Response(null, { status: 200 });
  }

  const chatId = String(message.chat.id);
  const allowedChatId = process.env.TELEGRAM_CHAT_ID;

  // Only respond to authorized chat
  if (allowedChatId && chatId !== allowedChatId) {
    return new Response(null, { status: 200 });
  }

  let userText = "";

  // Handle text messages
  if (message.text) {
    userText = message.text;
  }
  // Handle voice messages — for now, acknowledge and suggest text
  else if (message.voice) {
    await sendTelegramMessage(
      chatId,
      "🎤 Recibí tu mensaje de voz. Por ahora, envíame comandos por texto. Pronto podré procesar audio.\n\nEjemplos:\n• `status` — ver estado general\n• `prospectos` — listar prospectos\n• `llamar [nombre]` — iniciar llamada\n• `campaña [nombre]` — ver detalle de campaña"
    );
    return new Response(null, { status: 200 });
  } else {
    return new Response(null, { status: 200 });
  }

  // Process the command
  try {
    const response = await processCommand(ctx, userText, chatId);
    await sendTelegramMessage(chatId, response);
  } catch (error) {
    console.error("Error procesando comando:", error);
    await sendTelegramMessage(chatId, "❌ Error procesando tu mensaje. Intenta de nuevo.");
  }

  return new Response(null, { status: 200 });
});

async function processCommand(
  ctx: any,
  text: string,
  chatId: string
): Promise<string> {
  const cmd = text.toLowerCase().trim();

  // ─── STATUS / DASHBOARD ─────────────────────────────
  if (cmd === "status" || cmd === "/status" || cmd === "/start" || cmd === "hola") {
    const stats = await ctx.runQuery(api.stats.getDashboardStats);
    return `🤖 *IT Closer — Dashboard*\n\n📊 *Resumen General:*\n├ 👥 Prospectos: *${stats.totalProspects}*\n├ 📞 Llamadas: *${stats.totalCalls}*\n├ 🔥 Hot Leads: *${stats.hotLeads}*\n├ ✅ Cerrados: *${stats.closedWon}*\n└ 📈 Conversión: *${stats.conversionRate}%*\n\n📋 *Por Status:*\n├ ⚪ Nuevos: ${stats.newProspects}\n├ 🔵 Contactados: ${stats.contacted}\n├ 🟢 Interesados: ${stats.hotLeads}\n└ 🔴 Rechazados: ${stats.rejected}\n\n🎯 Campañas activas: *${stats.activeCampaigns}*\n\n_Comandos: prospectos, llamar [nombre], campaña [nombre]_`;
  }

  // ─── LIST PROSPECTS ─────────────────────────────────
  if (cmd === "prospectos" || cmd === "/prospectos" || cmd === "lista" || cmd === "contactos") {
    const prospects = await ctx.runQuery(api.leads.getAllProspects);
    if (prospects.length === 0) {
      return "📭 No hay prospectos cargados todavía. Sube un CSV desde el dashboard.";
    }

    const statusEmoji: Record<string, string> = {
      new: "⚪",
      calling: "📞",
      contacted: "🔵",
      interested: "🟢",
      meeting_set: "📅",
      proposal_sent: "📨",
      closed_won: "✅",
      closed_lost: "❌",
      rejected: "🔴",
    };

    const list = prospects
      .slice(0, 20)
      .map((p: any, i: number) => {
        const emoji = statusEmoji[p.status] || "⚪";
        return `${i + 1}. ${emoji} *${p.name}* — ${p.company} (${p.position})`;
      })
      .join("\n");

    const extra = prospects.length > 20 ? `\n\n_...y ${prospects.length - 20} más_` : "";

    return `👥 *Prospectos (${prospects.length}):*\n\n${list}${extra}\n\n_Usa "llamar [nombre]" para contactar a uno_`;
  }

  // ─── CALL A PROSPECT ────────────────────────────────
  if (cmd.startsWith("llamar ") || cmd.startsWith("/llamar ")) {
    const nameQuery = cmd.replace(/^\/?(llamar|call)\s+/i, "").trim();
    if (!nameQuery) {
      return "❓ ¿A quién quieres que llame? Ejemplo: `llamar Oscar Lazcano`";
    }

    const results = await ctx.runQuery(api.leads.searchProspects, { query: nameQuery });

    if (results.length === 0) {
      return `🔍 No encontré a nadie con "${nameQuery}". Revisa el nombre y prueba de nuevo.`;
    }

    const prospect = results[0];

    // Trigger the call via Vapi
    try {
      const vapiKey = process.env.VAPI_PRIVATE_KEY;
      const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;

      if (!vapiKey) {
        return "⚠️ VAPI_PRIVATE_KEY no configurada. No puedo hacer llamadas.";
      }

      const body: any = {
        customer: {
          number: prospect.phone,
          name: prospect.name,
        },
        assistant: {
          name: "Javier Reus",
          firstMessage: `Hola ${prospect.name}, ¿qué tal? Habla Javier Reus de Vox Media Agency. Estuve revisando el perfil de ${prospect.company} y me llamó la atención ${prospect.trigger || "su trabajo en el sector"}. ¿Tienes un par de minutos?`,
          model: {
            provider: "openai",
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: `Eres Javier Reus de Vox Media Agency. DATOS DEL PROSPECTO: Nombre: ${prospect.name}, Empresa: ${prospect.company}, Cargo: ${prospect.position}, Contexto: ${prospect.trigger || "N/A"}. Habla en español mexicano profesional. Los términos técnicos IT pronúncialos en inglés. Sé breve y consultivo.`,
              },
            ],
          },
          voice: {
            provider: "11labs",
            voiceId: process.env.ELEVENLABS_VOICE_ID || "VR6AewLTigWG4xSOukaG",
            model: "eleven_multilingual_v2",
          },
        },
      };

      if (phoneNumberId) {
        body.phoneNumberId = phoneNumberId;
      }

      const response = await fetch("https://api.vapi.ai/call/phone", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${vapiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        return `❌ Error al llamar: ${data.message || data.endedMessage || "Error desconocido"}`;
      }

      // Log the call
      await ctx.runMutation(api.calls.startCall, {
        prospectId: prospect._id,
        vapiCallId: data.id,
      });

      // Log activity
      await ctx.runMutation(api.leads.addActivity, {
        prospectId: prospect._id,
        type: "call",
        title: `Llamada iniciada a ${prospect.name}`,
        description: `Llamada telefónica disparada vía Telegram`,
      });

      return `📞 *Llamada iniciada*\n\n👤 ${prospect.name}\n🏢 ${prospect.company}\n📱 ${prospect.phone}\n🆔 Call ID: \`${data.id}\`\n\n_Te notificaré cuando termine la llamada._`;
    } catch (err: any) {
      return `❌ Error de red al contactar Vapi: ${err.message}`;
    }
  }

  // ─── CAMPAIGNS ──────────────────────────────────────
  if (cmd.startsWith("campaña ") || cmd.startsWith("/campaña ") || cmd === "campañas" || cmd === "/campañas") {
    if (cmd === "campañas" || cmd === "/campañas") {
      const campaigns = await ctx.runQuery(api.leads.getCampaigns);
      if (campaigns.length === 0) {
        return "📭 No hay campañas. Crea una desde el dashboard.";
      }
      const list = campaigns
        .map((c: any, i: number) => `${i + 1}. *${c.name}* — ${c.status} (${c.totalProspects || "?"} prospectos)`)
        .join("\n");
      return `📋 *Campañas:*\n\n${list}`;
    }
  }

  // ─── HELP ───────────────────────────────────────────
  if (cmd === "help" || cmd === "/help" || cmd === "ayuda" || cmd === "?") {
    return `🤖 *IT Closer — Comandos:*\n\n📊 \`status\` — Ver dashboard\n👥 \`prospectos\` — Listar prospectos\n📞 \`llamar [nombre]\` — Llamar a un prospecto\n📋 \`campañas\` — Ver campañas\n❓ \`ayuda\` — Este menú\n\n_También puedes escribirme de forma natural y trataré de entenderte._`;
  }

  // ─── FALLBACK (Natural language) ────────────────────
  // For now, show help. In the future, this will be processed by AI
  return `🤔 No entendí "${text}".\n\nUsa \`ayuda\` para ver comandos disponibles.\n\n_Próximamente: procesamiento de lenguaje natural con IA._`;
}

// ─── HELPERS ──────────────────────────────────────────

async function sendTelegramMessage(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("TELEGRAM_BOT_TOKEN no configurado");
    return;
  }

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    }),
  });
}
