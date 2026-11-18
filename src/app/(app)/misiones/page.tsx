import Link from "next/link";
import { getDb, schema } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { getPartner } from "@/lib/game";
import { CATEGORY_COLORS, FALLBACK_TILE } from "@/lib/icons";
import { Icon } from "@/components/Icon";
import { MissionRowActions } from "./MissionRowActions";
import { describeFrequency } from "./describe";

export const dynamic = "force-dynamic";

export default async function MissionsPage() {
  const me = await requireUser();
  const partner = await getPartner(me.id);
  const db = await getDb();
  const all = await db.select().from(schema.missions).orderBy(schema.missions.createdAt);
  const who = (a: string) => (a === "both" ? "Los dos" : a === me.id ? me.displayName : (partner?.displayName ?? "—"));

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[26px] font-extrabold">Misiones</h1>
        <Link
          href="/misiones/nueva"
          className="press flex min-h-11 items-center gap-1.5 rounded-2xl bg-primary px-4 font-extrabold text-primary-ink [--press-shadow:var(--primary-press)]"
        >
          <Icon name="plus" size={20} stroke={3} /> Nueva
        </Link>
      </div>
      <ul className="mt-4 space-y-3">
        {all.map((m) => (
          <li key={m.id} className={`press flex items-center gap-3 rounded-3xl bg-surface p-3 ${m.active ? "" : "opacity-60"}`}>
            <span
              className="flex size-12 shrink-0 items-center justify-center rounded-2xl text-white"
              style={{ background: CATEGORY_COLORS[m.category] ?? FALLBACK_TILE }}
            >
              <Icon name={m.icon} size={26} stroke={2.4} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-extrabold">
                {m.title} {m.isChallenge && <span className="ml-1 rounded-full bg-warn-soft px-2 py-0.5 text-xs text-warn-ink">Reto</span>}
              </p>
              <p className="text-[13px] font-bold text-muted">
                +{m.points} · {describeFrequency(m.frequency)} · {who(m.assignee)}
                {m.requiresValidation && " · con validación"}
                {!m.active && " · pausada"}
              </p>
            </div>
            <MissionRowActions id={m.id} active={m.active} title={m.title} />
          </li>
        ))}
      </ul>
    </div>
  );
}
