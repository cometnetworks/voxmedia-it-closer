"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Sidebar } from "@/components/Sidebar";
import Link from "next/link";
import type { Id } from "../../../convex/_generated/dataModel";

const STATUS_TABS = [
  { key: "all", label: "Todos", icon: "👥" },
  { key: "new", label: "Nuevos", icon: "⚪" },
  { key: "contacted", label: "Contactados", icon: "🔵" },
  { key: "interested", label: "Interesados", icon: "🟢" },
  { key: "meeting_set", label: "Reunión", icon: "📅" },
  { key: "rejected", label: "Rechazados", icon: "🔴" },
];

const STATUS_COLORS: Record<string, string> = {
  new: "bg-zinc-700 text-zinc-300",
  calling: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  contacted: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  interested: "bg-green-500/10 text-green-400 border border-green-500/20",
  meeting_set: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  proposal_sent: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
  closed_won: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  closed_lost: "bg-red-500/10 text-red-400 border border-red-500/20",
  rejected: "bg-red-500/10 text-red-400 border border-red-500/20",
};

export default function ProspectsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<Id<"prospects"> | null>(null);
  const [editStatus, setEditStatus] = useState("");

  const allProspects = useQuery(api.leads.getAllProspects);
  const updateProspect = useMutation(api.leads.updateProspect);
  const deleteProspect = useMutation(api.leads.deleteProspect);

  const filteredProspects = allProspects?.filter((p) => {
    const matchesTab = activeTab === "all" || p.status === activeTab;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.company.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleStatusChange = async (id: Id<"prospects">, newStatus: string) => {
    await updateProspect({ id, status: newStatus });
    setEditingId(null);
  };

  const handleDelete = async (id: Id<"prospects">, name: string) => {
    if (confirm(`¿Eliminar a ${name}?`)) {
      await deleteProspect({ id });
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Prospectos</h1>
            <p className="text-zinc-500 text-sm mt-1">
              {allProspects?.length ?? 0} prospectos en total
            </p>
          </div>
          <Link
            href="/upload"
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl text-sm font-bold transition-all"
          >
            + Agregar Prospectos
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="🔍 Buscar por nombre o empresa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {STATUS_TABS.map((tab) => {
            const count = tab.key === "all"
              ? allProspects?.length ?? 0
              : allProspects?.filter((p) => p.status === tab.key).length ?? 0;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                    : "bg-zinc-900 text-zinc-500 hover:text-zinc-300 border border-zinc-800/50"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span className="bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-md text-[10px]">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-800/30 text-zinc-500 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Prospecto</th>
                <th className="px-5 py-3">Empresa</th>
                <th className="px-5 py-3">Cargo</th>
                <th className="px-5 py-3">Teléfono</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/30">
              {!filteredProspects ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-zinc-600">
                    Cargando...
                  </td>
                </tr>
              ) : filteredProspects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-zinc-600">
                    <p className="text-3xl mb-2">🔍</p>
                    <p className="text-sm">No se encontraron prospectos</p>
                  </td>
                </tr>
              ) : (
                filteredProspects.map((prospect) => (
                  <tr
                    key={prospect._id}
                    className="hover:bg-zinc-800/20 transition-colors text-sm"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
                          {prospect.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm">{prospect.name}</p>
                          {prospect.email && (
                            <p className="text-[10px] text-zinc-600">{prospect.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-zinc-400">{prospect.company}</td>
                    <td className="px-5 py-3 text-zinc-500 text-xs">{prospect.position}</td>
                    <td className="px-5 py-3 text-zinc-400 font-mono text-xs">{prospect.phone}</td>
                    <td className="px-5 py-3">
                      {editingId === prospect._id ? (
                        <select
                          value={editStatus}
                          onChange={(e) => {
                            handleStatusChange(prospect._id, e.target.value);
                          }}
                          onBlur={() => setEditingId(null)}
                          autoFocus
                          className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white outline-none"
                        >
                          {["new", "contacted", "interested", "meeting_set", "proposal_sent", "closed_won", "closed_lost", "rejected"].map(
                            (s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            )
                          )}
                        </select>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(prospect._id);
                            setEditStatus(prospect.status);
                          }}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:opacity-80 ${
                            STATUS_COLORS[prospect.status] || STATUS_COLORS.new
                          }`}
                        >
                          {prospect.status}
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleDelete(prospect._id, prospect.name)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors text-xs"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
