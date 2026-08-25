"use client";

import { useState, useTransition } from "react";

import { approveMember, rejectMember } from "@/server/actions/member";

export function MemberActions({ teamMemberId }: { teamMemberId: string }) {
  const [pending, startTransition] = useTransition();
  const [enCurso, setEnCurso] = useState<"aprobar" | "rechazar" | null>(null);

  function aprobar() {
    setEnCurso("aprobar");
    startTransition(async () => {
      await approveMember(teamMemberId);
      setEnCurso(null);
    });
  }

  function rechazar() {
    const confirma = window.confirm(
      "¿Rechazar a este jugador? Va a poder volver a pedir entrar más adelante.",
    );
    if (!confirma) return;
    setEnCurso("rechazar");
    startTransition(async () => {
      await rejectMember(teamMemberId);
      setEnCurso(null);
    });
  }

  return (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={aprobar}
        className="rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {enCurso === "aprobar" ? "Aprobando..." : "Aprobar"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={rechazar}
        className="rounded-md border border-black/15 px-4 py-2.5 text-sm font-medium hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10"
      >
        {enCurso === "rechazar" ? "Rechazando..." : "Rechazar"}
      </button>
    </div>
  );
}
