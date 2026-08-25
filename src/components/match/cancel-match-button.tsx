"use client";

import { useTransition } from "react";

import { cancelMatch } from "@/server/actions/match";

export function CancelMatchButton({
  teamId,
  matchId,
}: {
  teamId: string;
  matchId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const confirma = window.confirm(
          "¿Cancelar este partido? Va a dejar de aparecer en los próximos partidos del equipo, y no se puede deshacer.",
        );
        if (!confirma) return;
        startTransition(() => cancelMatch(teamId, matchId));
      }}
      className="rounded-md border border-red-300 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
    >
      {pending ? "Cancelando..." : "Cancelar partido"}
    </button>
  );
}
