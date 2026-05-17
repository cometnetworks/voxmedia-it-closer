"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "@/components/Sidebar";
import { StatCard } from "@/components/StatCard";
import Link from "next/link";

export default function Dashboard() {
  const stats = useQuery(api.stats.getDashboardStats);
  const campaigns = useQuery(api.leads.getCampaigns);
  const activities = useQuery(api.leads.getRecentActivities, { limit: 10 });

  const activityIcons: Record<string, string> = {
    call: "📞",
    email: "📧",
    note: "📝",
    status_change: "🔄",
    proposal: "📄",
    telegram_command: "🤖",
  };

  const timeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-zinc-500 text-sm mt-1">Monitoreo en tiempo real de tu pipeline de ventas</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/upload"
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-all border border-zinc-700/50"
            >
              📤 Subir CSV
            </Link>
            <Link
              href="/test-agent"
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-900/20"
            >
              🎙️ Test Agent
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon="👥"
            label="Total Prospectos"
            value={stats?.totalProspects ?? "—"}
            color="blue"
          />
          <StatCard
            icon="📞"
            label="Llamadas Realizadas"
            value={stats?.totalCalls ?? "—"}
            color="purple"
          />
          <StatCard
            icon="🔥"
            label="Hot Leads"
            value={stats?.hotLeads ?? "—"}
            color="orange"
          />
          <StatCard
            icon="📈"
            label="Tasa de Conversión"
            value={stats ? `${stats.conversionRate}%` : "—"}
            color="green"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campañas */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50">
                <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Campañas</h2>
                <Link href="/upload" className="text-xs text-blue-400 hover:text-blue-300 font-medium">
                  + Nueva
                </Link>
              </div>

              {!campaigns ? (
                <div className="p-8 text-center text-zinc-600">Cargando...</div>
              ) : campaigns.length === 0 ? (
                <div className="p-8 text-center text-zinc-600">
                  <p className="text-3xl mb-2">📭</p>
                  <p className="text-sm">No hay campañas. ¡Crea tu primera!</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/50">
                  {campaigns.map((campaign) => {
                    const statusColors: Record<string, string> = {
                      draft: "bg-zinc-700 text-zinc-300",
                      active: "bg-green-500/10 text-green-400 border border-green-500/20",
                      paused: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
                      completed: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
                    };
                    return (
                      <div
                        key={campaign._id}
                        className="flex items-center justify-between px-6 py-4 hover:bg-zinc-800/20 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-lg">
                            📋
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{campaign.name}</p>
                            <p className="text-xs text-zinc-500">
                              {new Date(campaign.createdAt).toLocaleDateString("es-MX")} · {campaign.totalProspects ?? 0} prospectos
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            statusColors[campaign.status] || statusColors.draft
                          }`}
                        >
                          {campaign.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-800/50">
                <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Actividad Reciente</h2>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {!activities ? (
                  <div className="p-8 text-center text-zinc-600">Cargando...</div>
                ) : activities.length === 0 ? (
                  <div className="p-8 text-center text-zinc-600">
                    <p className="text-3xl mb-2">🕐</p>
                    <p className="text-sm">Sin actividad aún</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800/30">
                    {activities.map((activity) => (
                      <div key={activity._id} className="px-5 py-3 hover:bg-zinc-800/10 transition-colors">
                        <div className="flex items-start gap-3">
                          <span className="text-base mt-0.5">
                            {activityIcons[activity.type] || "📝"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-zinc-300 font-medium truncate">
                              {activity.title}
                            </p>
                            {activity.description && (
                              <p className="text-[10px] text-zinc-600 truncate mt-0.5">
                                {activity.description}
                              </p>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-600 flex-shrink-0">
                            {timeAgo(activity.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status Distribution */}
        {stats && stats.totalProspects > 0 && (
          <div className="mt-6 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-4">
              Distribución por Estado
            </h2>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(stats.statusCounts).map(([status, count]) => {
                const colors: Record<string, string> = {
                  new: "bg-zinc-700 text-zinc-300",
                  calling: "bg-yellow-500/10 text-yellow-400",
                  contacted: "bg-blue-500/10 text-blue-400",
                  interested: "bg-green-500/10 text-green-400",
                  meeting_set: "bg-purple-500/10 text-purple-400",
                  proposal_sent: "bg-indigo-500/10 text-indigo-400",
                  closed_won: "bg-emerald-500/10 text-emerald-400",
                  closed_lost: "bg-red-500/10 text-red-400",
                  rejected: "bg-red-500/10 text-red-400",
                };
                return (
                  <span
                    key={status}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold ${colors[status] || "bg-zinc-700 text-zinc-300"}`}
                  >
                    {status}: {count}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
