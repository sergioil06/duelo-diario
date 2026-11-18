import { requireUser } from "@/lib/auth/session";
import { getShop } from "@/lib/shop-server";
import { Wardrobe } from "./Wardrobe";

export const dynamic = "force-dynamic";

export default async function WardrobePage() {
  const me = await requireUser();
  return <Wardrobe data={await getShop(me)} name={me.displayName} />;
}
