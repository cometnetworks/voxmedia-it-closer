import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

export const handleVapiWebhook = httpAction(async (ctx, request) => {
  const payload = await request.json();
  const type = payload.message?.type;

  if (type === "end-of-call-report") {
    const callData = payload.message.call;
    const analysis = payload.message.analysis;
    
    // Lógica básica para determinar interés: sentimientos positivos o palabras clave en el resumen
    const isInterested = 
      analysis.sentiment === "positive" || 
      analysis.summary.toLowerCase().includes("reunión") ||
      analysis.summary.toLowerCase().includes("interesado");

    const status = isInterested ? "interested" : "completed";

    await ctx.runMutation(api.calls.updateCallResult, {
      vapiCallId: callData.id,
      duration: callData.duration,
      transcript: callData.transcript,
      summary: analysis.summary,
      sentiment: analysis.sentiment,
      status: status,
      rawPayload: payload,
    });

    if (isInterested) {
      const message = `
🔥 *¡Nuevo Lead Calificado!*
👤 *Nombre:* ${callData.customer?.name || "N/A"}
🏢 *Empresa:* ${callData.customer?.number || "N/A"}
📊 *Sentimiento:* ${analysis.sentiment}
📝 *Resumen:* ${analysis.summary}
      `.trim();

      await ctx.runAction(api.telegram.sendMessage, { text: message });
    }
  }

  return new Response(null, { status: 200 });
});
