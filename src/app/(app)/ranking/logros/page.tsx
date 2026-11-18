import { requireUser } from "@/lib/auth/session";
import { getAchievements } from "@/lib/leaderboard";
import { Icon } from "@/components/Icon";
import type { Tier } from "@/lib/domain/achievements";

export const dynamic = "force-dynamic";

const TIER: Record<Tier, { bg: string; label: string }> = {
  bronce: { bg: "#B45309", label: "Bronce" },
  plata: { bg: "#64748B", label: "Plata" },
  oro: { bg: "#CA8A04", label: "Oro" },
  diamante: { bg: "#7C3AED", label: "Diamante" },
};

export default async function AchievementsPage() {
  const me = await requireUser();
  const players = await getAchievements(me);
  const [mine, theirs] = players;
  const unlocked = mine.achievements.filter((a) => a.unlocked).length;
  const theirUnlocked = new Set(theirs?.achievements.filter((a) => a.unlocked).map((a) => a.def.id));

  return (
    <div className="space-y-4">
      <div className="press flex items-center justify-between rounded-[28px] bg-surface p-4">
        <div>
          <p className="font-display text-xl font-extrabold">
            {unlocked} de {mine.achievements.length} logros
          </p>
          {theirs && (
            <p className="text-sm font-bold text-muted">
              {theirs.name} lleva {theirUnlocked.size}
            </p>
          )}
        </div>
        <div className="text-right text-sm font-bold text-muted">
          <p>Mejor racha: {mine.stats.bestStreak} días</p>
          <p>Días perfectos: {mine.stats.perfectDays}</p>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {mine.achievements
          .slice()
          .sort((a, b) => Number(b.unlocked) - Number(a.unlocked) || b.current / b.def.target - a.current / a.def.target)
          .map(({ def, current, unlocked }) => (
            <li
              key={def.id}
              className={`press flex flex-col items-center rounded-3xl bg-surface p-3 text-center ${unlocked ? "" : "opacity-80"}`}
            >
              <span
                className={`relative flex size-16 items-center justify-center rounded-full ${unlocked ? "text-white pop-in" : "bg-surface-2 text-muted"}`}
                style={unlocked ? { background: TIER[def.tier].bg } : undefined}
              >
                <Icon name={unlocked ? def.icon : "lock"} size={30} stroke={2.2} />
              </span>
              <h3 className="mt-2 text-[15px] font-extrabold leading-tight">{def.title}</h3>
              <p className="mt-0.5 text-xs font-bold text-muted">{def.description}</p>
              <p className="mt-1 text-[11px] font-extrabold uppercase tracking-wide text-muted">{TIER[def.tier].label}</p>
              {!unlocked && (
                <div className="mt-2 w-full">
                  <div
                    className="h-2 overflow-hidden rounded-full bg-surface-2"
                    role="progressbar"
                    aria-label={`Progreso de ${def.title}`}
                    aria-valuemin={0}
                    aria-valuemax={def.target}
                    aria-valuenow={current}
                  >
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(current / def.target) * 100}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] font-bold tabular-nums text-muted">
                    {current.toLocaleString("es-ES")} / {def.target.toLocaleString("es-ES")}
                  </p>
                </div>
              )}
              {theirs && theirUnlocked.has(def.id) && (
                <p className="mt-1 text-[11px] font-bold text-rival">{theirs.name} también lo tiene</p>
              )}
            </li>
          ))}
      </ul>
    </div>
  );
}
