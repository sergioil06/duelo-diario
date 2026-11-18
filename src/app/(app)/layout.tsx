import { BottomNav } from "@/components/BottomNav";
import { requireUser } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return (
    <div className="mx-auto min-h-dvh max-w-6xl md:grid md:grid-cols-[220px_1fr] md:gap-8 md:px-6 md:py-8">
      <aside className="hidden md:block">
        <p className="mb-6 px-4 font-display text-2xl font-extrabold text-primary">Duelo diario</p>
        <BottomNav />
      </aside>
      <main className="px-4 pb-28 pt-[max(16px,env(safe-area-inset-top))] md:px-0 md:pb-8 md:pt-0">{children}</main>
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
