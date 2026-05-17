import { query } from "./_generated/server";

export const getDashboardStats = query({
  handler: async (ctx) => {
    const prospects = await ctx.db.query("prospects").collect();
    const campaigns = await ctx.db.query("campaigns").collect();
    const calls = await ctx.db.query("call_logs").collect();

    const statusCounts: Record<string, number> = {};
    for (const p of prospects) {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    }

    const totalCalls = calls.length;
    const completedCalls = calls.filter((c) => c.duration && c.duration > 0).length;
    const interested = statusCounts["interested"] || 0;
    const meetingSet = statusCounts["meeting_set"] || 0;
    const closedWon = statusCounts["closed_won"] || 0;

    return {
      totalProspects: prospects.length,
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter((c) => c.status === "active").length,
      totalCalls,
      completedCalls,
      hotLeads: interested + meetingSet,
      closedWon,
      conversionRate:
        prospects.length > 0
          ? Math.round(((interested + meetingSet + closedWon) / prospects.length) * 100)
          : 0,
      statusCounts,
      newProspects: statusCounts["new"] || 0,
      contacted: statusCounts["contacted"] || 0,
      rejected: statusCounts["rejected"] || 0,
    };
  },
});

export const getCallStats = query({
  handler: async (ctx) => {
    const calls = await ctx.db
      .query("call_logs")
      .withIndex("by_createdAt")
      .order("desc")
      .take(50);

    return calls.map((c) => ({
      id: c._id,
      prospectId: c.prospectId,
      duration: c.duration,
      sentiment: c.sentiment,
      summary: c.summary,
      createdAt: c.createdAt,
    }));
  },
});
