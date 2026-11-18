"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ShopTabs() {
  const path = usePathname();
  return (
    <nav aria-label="Secciones de la tienda" className="mt-3 grid grid-cols-2 gap-1.5 rounded-2xl bg-surface p-1.5">
      {[
        { href: "/tienda", label: "Tienda" },
        { href: "/tienda/vestidor", label: "Vestidor" },
      ].map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={path === t.href ? "page" : undefined}
          className={`flex min-h-11 items-center justify-center rounded-xl text-sm font-extrabold ${path === t.href ? "bg-primary text-primary-ink" : "text-muted hover:bg-surface-2"}`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
