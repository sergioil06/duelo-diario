import { ICONS, type IconKey } from "@/lib/icons";

export function Icon({
  name,
  size = 24,
  stroke = 2.2,
  className,
}: {
  name: IconKey | string;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const d = ICONS[name as IconKey] ?? ICONS.star;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={d} />
    </svg>
  );
}

export function FlameIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="var(--flame)" aria-hidden="true">
      <path d="M12 2c3 4 7 6.5 7 12a7 7 0 0 1-14 0c0-3.5 2-5.5 3.5-8 .8 2 1.8 3.2 3 3.5 0-3-.8-5 .5-7.5z" />
    </svg>
  );
}

export function CoinIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="var(--gold)" />
      <circle cx="12" cy="12" r="6.5" fill="none" stroke="#e08a00" strokeWidth="2" />
    </svg>
  );
}
