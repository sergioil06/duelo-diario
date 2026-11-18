import { Icon } from "./Icon";

export function ComingSoon({ title, icon, phase, text }: { title: string; icon: string; phase: number; text: string }) {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-[26px] font-extrabold">{title}</h1>
      <div className="press mt-4 flex flex-col items-center rounded-[28px] bg-surface p-8 text-center">
        <span className="flex size-16 items-center justify-center rounded-3xl bg-surface-2 text-primary">
          <Icon name={icon} size={34} />
        </span>
        <p className="mt-3 font-display text-xl font-extrabold">Llega en la fase {phase}</p>
        <p className="mt-1 font-bold text-muted">{text}</p>
      </div>
    </div>
  );
}
