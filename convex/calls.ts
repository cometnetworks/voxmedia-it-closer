import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const startCall = mutation({
  args: {
    prospectId: v.id("prospects"),
    vapiCallId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.prospectId, {
      status: "calling",
      lastCallId: args.vapiCallId,
    });

    // Log activity
    const prospect = await ctx.db.get(args.prospectId);
    if (prospect) {
      await ctx.db.insert("activities", {
        prospectId: args.prospectId,
        type: "call",
        title: `Llamada iniciada a ${prospect.name}`,
        description: `Llamada a ${prospect.phone}`,
        createdAt: Date.now(),
      });
    }

    return await ctx.db.insert("call_logs", {
      prospectId: args.prospectId,
      vapiCallId: args.vapiCallId,
      createdAt: Date.now(),
    });
  },
});

export const updateCallResult = mutation({
  args: {
    vapiCallId: v.string(),
    duration: v.optional(v.number()),
    transcript: v.optional(v.string()),
    summary: v.optional(v.string()),
    sentiment: v.optional(v.string()),
    calification: v.optional(v.string()),
    status: v.string(),
    rawPayload: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const log = await ctx.db
      .query("call_logs")
      .withIndex("by_vapiCallId", (q) => q.eq("vapiCallId", args.vapiCallId))
      .unique();

    if (log) {
      await ctx.db.patch(log._id, {
        duration: args.duration,
        transcript: args.transcript,
        summary: args.summary,
        sentiment: args.sentiment,
        calification: args.calification,
        rawPayload: args.rawPayload,
      });

      // Update prospect status
      await ctx.db.patch(log.prospectId, {
        status: args.status === "interested" ? "interested" : "contacted",
      });

      // Log activity
      const prospect = await ctx.db.get(log.prospectId);
      await ctx.db.insert("activities", {
        prospectId: log.prospectId,
        type: "call",
        title: `Llamada completada con ${prospect?.name || "prospecto"}`,
        description: args.summary || `Duración: ${args.duration || 0}s · Sentimiento: ${args.sentiment || "N/A"}`,
        metadata: {
          duration: args.duration,
          sentiment: args.sentiment,
          calification: args.calification,
        },
        createdAt: Date.now(),
      });
    }
  },
});

// ─── QUERIES ──────────────────────────────────────────

export const getCallLogs = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("call_logs")
      .withIndex("by_createdAt")
      .order("desc")
      .take(50);
  },
});

export const getCallsByProspect = query({
  args: { prospectId: v.id("prospects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("call_logs")
      .withIndex("by_prospect", (q) => q.eq("prospectId", args.prospectId))
      .order("desc")
      .collect();
  },
});
