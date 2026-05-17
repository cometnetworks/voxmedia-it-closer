import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// ─── EMAIL TEMPLATES ──────────────────────────────────

const TEMPLATES = {
  follow_up: (prospectName: string, company: string, summary?: string) => ({
    subject: `Seguimiento — Vox Media Agency x ${company}`,
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 16px; padding: 32px; color: white;">
          <h2 style="margin: 0 0 8px; font-size: 20px;">Vox Media Agency</h2>
          <p style="margin: 0; color: #94a3b8; font-size: 12px;">Pipeline Generation & Enterprise Sales</p>
        </div>
        <div style="padding: 24px 0;">
          <p>Hola ${prospectName},</p>
          <p>Fue un gusto hablar contigo. Como comentamos, en <strong>Vox Media Agency</strong> nos especializamos en generar pipeline calificado para empresas de tecnología y ciberseguridad.</p>
          ${summary ? `<p style="background: #f1f5f9; padding: 16px; border-radius: 8px; border-left: 3px solid #3b82f6; font-size: 14px;"><strong>Resumen de nuestra conversación:</strong><br>${summary}</p>` : ""}
          <p>Me encantaría agendar una breve reunión de 15 minutos para profundizar en cómo podemos ayudar a <strong>${company}</strong>.</p>
          <p>¿Qué día y hora te funcionarían mejor esta semana?</p>
          <p style="margin-top: 32px;">
            Saludos cordiales,<br>
            <strong>Javier Reus</strong><br>
            <span style="color: #64748b; font-size: 13px;">Desarrollo de Negocios · Vox Media Agency</span><br>
            <a href="https://voxmedia.agency" style="color: #3b82f6; text-decoration: none; font-size: 13px;">voxmedia.agency</a>
          </p>
        </div>
      </div>
    `,
  }),

  proposal: (prospectName: string, company: string) => ({
    subject: `Propuesta de Servicios — Vox Media Agency para ${company}`,
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 16px; padding: 32px; color: white;">
          <h2 style="margin: 0 0 8px; font-size: 20px;">Propuesta de Servicios</h2>
          <p style="margin: 0; color: #94a3b8; font-size: 12px;">Vox Media Agency × ${company}</p>
        </div>
        <div style="padding: 24px 0;">
          <p>Estimado ${prospectName},</p>
          <p>Adjunto encontrarás nuestra propuesta de servicios diseñada específicamente para <strong>${company}</strong>.</p>
          
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 16px 0;">
            <h3 style="margin: 0 0 12px; font-size: 16px; color: #1e293b;">Nuestros Servicios Incluyen:</h3>
            <ul style="color: #475569; font-size: 14px; line-height: 1.8;">
              <li>Generación de Pipeline Enterprise Calificado</li>
              <li>Estrategias de Account-Based Marketing (ABM)</li>
              <li>Penetración de Cuentas Clave</li>
              <li>Outreach Ejecutivo Multi-canal</li>
              <li>Inteligencia Comercial y Triggers de Negocio</li>
            </ul>
          </div>
          
          <p>Quedo a tus órdenes para resolver cualquier duda.</p>
          <p style="margin-top: 32px;">
            Saludos cordiales,<br>
            <strong>Javier Reus</strong><br>
            <span style="color: #64748b; font-size: 13px;">Desarrollo de Negocios · Vox Media Agency</span><br>
            <a href="https://voxmedia.agency" style="color: #3b82f6; text-decoration: none; font-size: 13px;">voxmedia.agency</a>
          </p>
        </div>
      </div>
    `,
  }),

  meeting: (prospectName: string, company: string, dateTime: string) => ({
    subject: `Reunión confirmada — ${dateTime} · Vox Media Agency`,
    html: `
      <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #059669, #047857); border-radius: 16px; padding: 32px; color: white;">
          <h2 style="margin: 0 0 8px; font-size: 20px;">✅ Reunión Confirmada</h2>
          <p style="margin: 0; color: #a7f3d0; font-size: 14px;">${dateTime}</p>
        </div>
        <div style="padding: 24px 0;">
          <p>Hola ${prospectName},</p>
          <p>Confirmo nuestra reunión para el <strong>${dateTime}</strong>.</p>
          <p>Nos enfocaremos en analizar cómo podemos ayudar a <strong>${company}</strong> a generar más pipeline calificado en su mercado.</p>
          <p>La reunión será breve (15 minutos) y muy puntual.</p>
          <p style="margin-top: 32px;">
            Nos vemos pronto,<br>
            <strong>Javier Reus</strong><br>
            <span style="color: #64748b; font-size: 13px;">Vox Media Agency</span>
          </p>
        </div>
      </div>
    `,
  }),
};

// ─── SEND EMAIL ───────────────────────────────────────

export const sendEmail = action({
  args: {
    prospectId: v.id("prospects"),
    to: v.string(),
    template: v.string(), // "follow_up" | "proposal" | "meeting"
    prospectName: v.string(),
    company: v.string(),
    summary: v.optional(v.string()),
    dateTime: v.optional(v.string()),
    customSubject: v.optional(v.string()),
    customBody: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error("RESEND_API_KEY no configurada");
      return { success: false, error: "RESEND_API_KEY no configurada" };
    }

    let emailContent: { subject: string; html: string };

    if (args.customSubject && args.customBody) {
      emailContent = { subject: args.customSubject, html: args.customBody };
    } else if (args.template === "follow_up") {
      emailContent = TEMPLATES.follow_up(args.prospectName, args.company, args.summary);
    } else if (args.template === "proposal") {
      emailContent = TEMPLATES.proposal(args.prospectName, args.company);
    } else if (args.template === "meeting" && args.dateTime) {
      emailContent = TEMPLATES.meeting(args.prospectName, args.company, args.dateTime);
    } else {
      emailContent = TEMPLATES.follow_up(args.prospectName, args.company);
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Javier Reus <javier@voxmedia.agency>",
          to: [args.to],
          subject: emailContent.subject,
          html: emailContent.html,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Log email attempt
        await ctx.runMutation(api.leads.addActivity, {
          prospectId: args.prospectId,
          type: "email",
          title: `❌ Error enviando email a ${args.prospectName}`,
          description: data.message || "Error desconocido",
        });
        return { success: false, error: data.message };
      }

      // Log success
      await ctx.runMutation(api.leads.addActivity, {
        prospectId: args.prospectId,
        type: "email",
        title: `📧 Email enviado a ${args.prospectName}`,
        description: `Template: ${args.template} · Para: ${args.to}`,
      });

      return { success: true, emailId: data.id };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
});
