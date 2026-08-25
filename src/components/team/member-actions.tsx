"use client";

import { useTransition } from "react";

import { approveMember, rejectMember } from "@/server/actions/member";

export function MemberActions({ teamMemberId }: { teamMemberId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => approveMember(teamMemberId))}
        className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
      >
        Aprobar
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          const confirma = window.confirm(
            "¿Rechazar a este jugador? Va a poder volver a pedir entrar más adelante.",
          );
          if (!confirma) return;
          startTransition(() => rejectMember(teamMemberId));
        }}
        className="rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10"
      >
        Rechazar
      </button>
    </div>
  );
}
