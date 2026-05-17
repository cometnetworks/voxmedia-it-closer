import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ─── CAMPAIGNS ────────────────────────────────────────────────

export const createCampaign = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("campaigns", {
      name: args.name,
      status: "draft",
      createdAt: Date.now(),
    });
  },
});

export const getCampaigns = query({
  handler: async (ctx) => {
    return await ctx.db.query("campaigns").order("desc").collect();
  },
});

export const getCampaignById = query({
  args: { id: v.id("campaigns") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const updateCampaignStatus = mutation({
  args: { id: v.id("campaigns"), status: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

// ─── PROSPECTS (BATCH) ────────────────────────────────────────

export const addProspectsBatch = mutation({
  args: {
    campaignId: v.id("campaigns"),
    prospects: v.array(
      v.object({
        name: v.string(),
        company: v.string(),
        position: v.string(),
        phone: v.string(),
        email: v.optional(v.string()),
        linkedinUrl: v.optional(v.string()),
        trigger: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    let count = 0;
    for (const p of args.prospects) {
      await ctx.db.insert("prospects", {
        ...p,
        campaignId: args.campaignId,
        status: "new",
      });
      count++;
    }
    // Update campaign with total
    await ctx.db.patch(args.campaignId, { 
      totalProspects: count,
      status: "active",
    });

    // Log activity
    await ctx.db.insert("activities", {
      campaignId: args.campaignId,
      type: "note",
      title: `${count} prospectos cargados`,
      description: `Se cargaron ${count} prospectos a la campaña`,
      createdAt: Date.now(),
    });

    return count;
  },
});

// ─── PROSPECTS (QUERIES) ──────────────────────────────────────

export const getProspectsByCampaign = query({
  args: { campaignId: v.id("campaigns") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("prospects")
      .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
      .collect();
  },
});

export const getProspectsByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("prospects")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();
  },
});

export const getAllProspects = query({
  handler: async (ctx) => {
    return await ctx.db.query("prospects").order("desc").collect();
  },
});

export const getProspectById = query({
  args: { id: v.id("prospects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const searchProspects = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("prospects").collect();
    const q = args.query.toLowerCase();
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.company.toLowerCase().includes(q) ||
        (p.email && p.email.toLowerCase().includes(q))
    );
  },
});

// ─── PROSPECTS (MUTATIONS) ───────────────────────────────────

export const updateProspect = mutation({
  args: {
    id: v.id("prospects"),
    name: v.optional(v.string()),
    company: v.optional(v.string()),
    position: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    trigger: v.optional(v.string()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    // Filter out undefined values
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    if (Object.keys(filtered).length > 0) {
      await ctx.db.patch(id, filtered);

      // Log status changes
      if (updates.status) {
        await ctx.db.insert("activities", {
          prospectId: id,
          type: "status_change",
          title: `Estado cambiado a "${updates.status}"`,
          createdAt: Date.now(),
        });
      }
    }
  },
});

export const deleteProspect = mutation({
  args: { id: v.id("prospects") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// ─── ACTIVITIES ──────────────────────────────────────────────

export const getRecentActivities = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    return await ctx.db
      .query("activities")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);
  },
});

export const getActivitiesByProspect = query({
  args: { prospectId: v.id("prospects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activities")
      .withIndex("by_prospect", (q) => q.eq("prospectId", args.prospectId))
      .order("desc")
      .collect();
  },
});

export const addActivity = mutation({
  args: {
    prospectId: v.optional(v.id("prospects")),
    campaignId: v.optional(v.id("campaigns")),
    type: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activities", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
