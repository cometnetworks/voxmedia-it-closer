"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", icon: "📊", label: "Dashboard" },
  { href: "/prospects", icon: "👥", label: "Prospectos" },
  { href: "/upload", icon: "📤", label: "Subir CSV" },
  { href: "/test-agent", icon: "🎙️", label: "Test Agent" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-zinc-950 border-r border-zinc-800/50 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-zinc-800/50">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/20">
            V
          </div>
          <div>
            <h1 className="text-white font-bold text-sm tracking-wide">IT CLOSER</h1>
            <p className="text-zinc-600 text-[10px] uppercase tracking-widest">Vox Media Agency</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-3 px-3">Menú Principal</p>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Agent Status */}
      <div className="p-4 border-t border-zinc-800/50">
        <div className="bg-zinc-900/80 rounded-xl p-3 border border-zinc-800/50">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-zinc-400 font-medium">Javier Reus</span>
          </div>
          <p className="text-[10px] text-zinc-600">Agente IA activo</p>
        </div>
      </div>
    </aside>
  );
}
