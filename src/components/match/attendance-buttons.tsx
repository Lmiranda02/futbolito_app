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
  const [enCurso, setEnCurso] = useState<"CONFIRMED" | "DECLINED" | null>(null);
  const [error, setError] = useState<string | null>(null);

  function responder(nuevoEstado: "CONFIRMED" | "DECLINED") {
    setError(null);
    setEnCurso(nuevoEstado);
    startTransition(async () => {
      const resultado = await responderAsistencia(matchId, teamMemberId, nuevoEstado);
      if (resultado.status === "error") {
        setError(resultado.message ?? "No se pudo guardar tu respuesta.");
      }
      setEnCurso(null);
    });
  }

  return (
    <div className="flex w-full flex-col gap-1 sm:w-auto sm:items-end">
      {/* Botones grandes a propósito: esta es la pantalla que abre un
          jugador cualquiera desde su celular, a veces parado en la calle
          antes de entrar a la cancha — tienen que ser fáciles de tocar
          bien, sin apuntar con precisión. */}
      <div className="flex w-full gap-2 sm:w-auto">
        <button
          type="button"
          disabled={pending}
          onClick={() => responder("CONFIRMED")}
          className={
            estadoActual === "CONFIRMED"
              ? "flex-1 rounded-md bg-emerald-600 px-5 py-3 text-base font-semibold text-white disabled:opacity-60 sm:flex-none"
              : "flex-1 rounded-md border border-black/15 px-5 py-3 text-base font-semibold hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10 sm:flex-none"
          }
        >
          {enCurso === "CONFIRMED" ? "Guardando..." : "Voy"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => responder("DECLINED")}
          className={
            estadoActual === "DECLINED"
              ? "flex-1 rounded-md bg-black/70 px-5 py-3 text-base font-semibold text-white disabled:opacity-60 dark:bg-white/80 dark:text-black sm:flex-none"
              : "flex-1 rounded-md border border-black/15 px-5 py-3 text-base font-semibold hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10 sm:flex-none"
          }
        >
          {enCurso === "DECLINED" ? "Guardando..." : "No voy"}
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
