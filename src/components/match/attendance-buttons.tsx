"use client";

import { useState, useTransition } from "react";

import { responderAsistencia } from "@/server/actions/attendance";

export function AttendanceButtons({
  matchId,
  teamMemberId,
  estadoActual,
}: {
  matchId: string;
  teamMemberId: string;
  estadoActual: "CONFIRMED" | "DECLINED" | "PENDING";
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function responder(nuevoEstado: "CONFIRMED" | "DECLINED") {
    setError(null);
    startTransition(async () => {
      const resultado = await responderAsistencia(matchId, teamMemberId, nuevoEstado);
      if (resultado.status === "error") {
        setError(resultado.message ?? "No se pudo guardar tu respuesta.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => responder("CONFIRMED")}
          className={
            estadoActual === "CONFIRMED"
              ? "rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
              : "rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10"
          }
        >
          Voy
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => responder("DECLINED")}
          className={
            estadoActual === "DECLINED"
              ? "rounded-md bg-black/70 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60 dark:bg-white/80 dark:text-black"
              : "rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10"
          }
        >
          No voy
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
