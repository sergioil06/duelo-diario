import { ShopTabs } from "./ShopTabs";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-[26px] font-extrabold">Tienda</h1>
      <ShopTabs />
      <div className="mt-4">{children}</div>
    </div>
  );
}
