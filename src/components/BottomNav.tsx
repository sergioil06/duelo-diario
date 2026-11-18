"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

const ITEMS = [
  { href: "/", label: "Hoy", icon: "home" },
  { href: "/ranking", label: "Ranking", icon: "trophy" },
  { href: "/tienda", label: "Tienda", icon: "bag" },
  { href: "/misiones", label: "Misiones", icon: "list" },
  { href: "/ajustes", label: "Ajustes", icon: "settings" },
] as const;

export function BottomNav() {
  const path = usePathname();
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-line bg-surface pb-[env(safe-area-inset-bottom)] md:static md:border-0 md:bg-transparent md:pb-0"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5 md:max-w-none md:grid-cols-1 md:gap-1">
        {ITEMS.map((it) => {
          const active = it.href === "/" ? path === "/" : path.startsWith(it.href);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11.5px] font-extrabold md:flex-row md:justify-start md:gap-3 md:px-4 md:text-base ${
                  active ? "text-primary md:bg-surface-2" : "text-muted hover:text-ink"
                }`}
              >
                <Icon name={it.icon} size={24} />
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
