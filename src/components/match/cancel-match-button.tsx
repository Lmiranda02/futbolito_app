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
      className="boton-peligro px-[18px] py-[12px] text-[14px]"
    >
      {pending ? "Cancelando..." : "Cancelar partido"}
    </button>
  );
}
