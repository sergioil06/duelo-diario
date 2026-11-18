"use client";

import dynamic from "next/dynamic";
import type { StageProps } from "./AvatarStage";

/** Three.js solo en el navegador: carga diferida y un hueco del mismo tamaño mientras llega. */
const Stage = dynamic(() => import("./AvatarStage"), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse rounded-full bg-surface-2/60" />,
});

export function Avatar(props: StageProps) {
  return <Stage {...props} />;
}
