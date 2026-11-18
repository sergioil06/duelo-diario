import { requireUser } from "@/lib/auth/session";
import { getStats } from "@/lib/leaderboard";
import { StatsView } from "./StatsView";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const me = await requireUser();
  return <StatsView data={await getStats(me)} meId={me.id} />;
}
