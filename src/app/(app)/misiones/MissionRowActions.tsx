"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteMissionAction, toggleMissionAction } from "@/app/actions";
import { Icon } from "@/components/Icon";

export function MissionRowActions({ id, active, title }: { id: string; active: boolean; title: string }) {
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);
  if (confirming)
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => start(async () => void (await deleteMissionAction(id)))}
          disabled={pending}
          className="min-h-11 rounded-xl bg-danger px-3 text-sm font-extrabold text-white"
        >
          Borrar
        </button>
        <button onClick={() => setConfirming(false)} className="min-h-11 rounded-xl px-2 text-sm font-extrabold text-muted">
          No
        </button>
      </div>
    );
  return (
    <div className="flex items-center">
      <button
        onClick={() => start(async () => void (await toggleMissionAction(id, !active)))}
        disabled={pending}
        className="min-h-11 rounded-xl px-2 text-sm font-extrabold text-muted hover:bg-surface-2"
      >
        {active ? "Pausar" : "Activar"}
      </button>
      <Link href={`/misiones/${id}`} aria-label={`Editar ${title}`} className="flex size-11 items-center justify-center rounded-xl text-muted hover:bg-surface-2">
        <Icon name="edit" size={20} />
      </Link>
      <button
        onClick={() => setConfirming(true)}
        aria-label={`Borrar ${title}`}
        title="Borrar (también borra su historial; pausar la conserva)"
        className="flex size-11 items-center justify-center rounded-xl text-muted hover:bg-surface-2"
      >
        <Icon name="trash" size={20} />
      </button>
    </div>
  );
}
