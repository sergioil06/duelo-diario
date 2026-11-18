import { getDb, schema } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { MissionForm } from "../MissionForm";

export default async function NewMissionPage() {
  await requireUser();
  const db = await getDb();
  const people = (await db.select().from(schema.users)).map((u) => ({ id: u.id, name: u.displayName }));
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-4 font-display text-[26px] font-extrabold">Nueva misión</h1>
      <MissionForm people={people} />
    </div>
  );
}
