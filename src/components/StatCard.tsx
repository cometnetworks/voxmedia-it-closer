export function StatCard({
  label,
  value,
  icon,
  trend,
  color = "blue",
}: {
  label: string;
  value: string | number;
  icon: string;
  trend?: string;
  color?: "blue" | "green" | "orange" | "purple" | "red";
}) {
  const colorMap = {
    blue: "from-blue-500/10 to-blue-600/5 border-blue-500/10",
    green: "from-green-500/10 to-green-600/5 border-green-500/10",
    orange: "from-orange-500/10 to-orange-600/5 border-orange-500/10",
    purple: "from-purple-500/10 to-purple-600/5 border-purple-500/10",
    red: "from-red-500/10 to-red-600/5 border-red-500/10",
  };

  const textColor = {
    blue: "text-blue-400",
    green: "text-green-400",
    orange: "text-orange-400",
    purple: "text-purple-400",
    red: "text-red-400",
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-5 transition-all hover:scale-[1.02] duration-200`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span className={`text-xs font-bold ${textColor[color]}`}>{trend}</span>
        )}
      </div>
      <p className="text-3xl font-black text-white mb-1">{value}</p>
      <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{label}</p>
    </div>
  );
}
