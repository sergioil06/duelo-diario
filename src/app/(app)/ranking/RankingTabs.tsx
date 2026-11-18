"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/ranking", label: "Clasificación" },
  { href: "/ranking/logros", label: "Logros" },
  { href: "/ranking/stats", label: "Estadísticas" },
];

export function RankingTabs() {
  const path = usePathname();
  return (
    <nav aria-label="Secciones del ranking" className="mt-3 grid grid-cols-3 gap-1.5 rounded-2xl bg-surface p-1.5">
      {TABS.map((t) => {
        const active = path === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 items-center justify-center rounded-xl text-sm font-extrabold ${active ? "bg-primary text-primary-ink" : "text-muted hover:bg-surface-2"}`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
