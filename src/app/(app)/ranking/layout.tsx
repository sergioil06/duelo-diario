import { RankingTabs } from "./RankingTabs";

export default function RankingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-[26px] font-extrabold">Ranking</h1>
      <RankingTabs />
      <div className="mt-4">{children}</div>
    </div>
  );
}
