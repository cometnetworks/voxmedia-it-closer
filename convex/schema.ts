import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  prospects: defineTable({
    name: v.string(),
    company: v.string(),
    position: v.string(),
    email: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    phone: v.string(),
    trigger: v.optional(v.string()),
    status: v.string(), // "new" | "calling" | "contacted" | "interested" | "meeting_set" | "proposal_sent" | "closed_won" | "closed_lost" | "rejected"
    campaignId: v.id("campaigns"),
    lastCallId: v.optional(v.string()),
    notes: v.optional(v.string()),
  })
    .index("by_campaign", ["campaignId"])
    .index("by_status", ["status"])
    .index("by_name", ["name"]),

  campaigns: defineTable({
    name: v.string(),
    status: v.string(), // "draft" | "active" | "paused" | "completed"
    createdAt: v.number(),
    totalProspects: v.optional(v.number()),
  }),

  call_logs: defineTable({
    prospectId: v.id("prospects"),
    vapiCallId: v.string(),
    duration: v.optional(v.number()),
    transcript: v.optional(v.string()),
    summary: v.optional(v.string()),
    sentiment: v.optional(v.string()),
    calification: v.optional(v.string()),
    rawPayload: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_prospect", ["prospectId"])
    .index("by_vapiCallId", ["vapiCallId"])
    .index("by_createdAt", ["createdAt"]),

  activities: defineTable({
    prospectId: v.optional(v.id("prospects")),
    campaignId: v.optional(v.id("campaigns")),
    type: v.string(), // "call" | "email" | "note" | "status_change" | "proposal" | "telegram_command"
    title: v.string(),
    description: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_prospect", ["prospectId"])
    .index("by_type", ["type"])
    .index("by_createdAt", ["createdAt"]),

  email_logs: defineTable({
    prospectId: v.id("prospects"),
    to: v.string(),
    subject: v.string(),
    body: v.string(),
    status: v.string(), // "sent" | "failed" | "pending"
    provider: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_prospect", ["prospectId"])
    .index("by_createdAt", ["createdAt"]),

  telegram_commands: defineTable({
    chatId: v.string(),
    messageText: v.string(),
    responseText: v.string(),
    commandType: v.optional(v.string()), // "call" | "query" | "email" | "campaign" | "unknown"
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),
});
