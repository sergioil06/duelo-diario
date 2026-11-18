import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { MissionForm } from "../MissionForm";

export default async function EditMissionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const id = z.string().uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const db = await getDb();
  const [mission] = await db.select().from(schema.missions).where(eq(schema.missions.id, id.data));
  if (!mission) notFound();
  const people = (await db.select().from(schema.users)).map((u) => ({ id: u.id, name: u.displayName }));
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 font-display text-[26px] font-extrabold">Editar misión</h1>
      <MissionForm mission={mission} people={people} />
    </div>
  );
}
