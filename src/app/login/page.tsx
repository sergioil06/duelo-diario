import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/session";
import { LoginForm } from "./LoginForm";
import { Avatar2D } from "@/components/Avatar2D";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await currentUser()) redirect("/");
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="flex items-end gap-2" aria-hidden="true">
        <Avatar2D side="me" label="" size={84} />
        <span className="pb-6 font-display text-xl font-extrabold text-primary">VS</span>
        <Avatar2D side="rival" label="" size={84} />
      </div>
      <h1 className="mt-2 font-display text-4xl font-extrabold">Duelo diario</h1>
      <p className="mt-1 font-bold text-muted">Misiones, puntos y algo de pique sano.</p>
      <LoginForm />
    </main>
  );
}
