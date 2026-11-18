import { requireUser } from "@/lib/auth/session";
import { getLeaderboard } from "@/lib/leaderboard";
import { Standings } from "./Standings";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const me = await requireUser();
  return <Standings data={await getLeaderboard(me)} />;
}
