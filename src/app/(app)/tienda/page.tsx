import { requireUser } from "@/lib/auth/session";
import { getShop } from "@/lib/shop-server";
import { ShopView } from "./ShopView";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const me = await requireUser();
  return <ShopView data={await getShop(me)} name={me.displayName} />;
}
