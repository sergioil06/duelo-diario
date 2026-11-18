import { requireUser } from "@/lib/auth/session";
import { getDashboard } from "@/lib/game";
import { TodayView } from "@/components/TodayView";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const me = await requireUser();
  const data = await getDashboard(me);
  return <TodayView data={data} />;
}
