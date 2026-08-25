"use client";

import { useOptimistic, useState, useTransition } from "react";

import { useSound } from "@/components/sound/sound-provider";
import { responderAsistencia } from "@/server/actions/attendance";

type EstadoAsistencia = "CONFIRMED" | "DECLINED" | "PENDING";

export type FilaAsistencia = {
  id: string;
  teamMemberId: string;
  dorsal: string;
  nombre: string;
  estado: EstadoAsistencia;
};

const ETIQUETA: Record<EstadoAsistencia, string> = {
  CONFIRMED: "Va",
  DECLINED: "No va",
  PENDING: "Sin responder",
};

const BOTON_BASE =
  "flex-1 rounded-[10px] px-[18px] py-[13px] text-sm font-bold transition-[background-color,color] duration-150 disabled:opacity-60 sm:flex-none";
const BOTON_INACTIVO =
  "border border-tinta/16 bg-transparent text-tinta/60";

export function AttendanceList({
  matchId,
  filasIniciales,
  cupo,
  puedeResponder,
}: {
  matchId: string;
  filasIniciales: FilaAsistencia[];
  cupo: number | null;
  puedeResponder: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { reproducirClick, reproducirSilbato } = useSound();
  // Estado optimista: el marcador "{n}/{cupo} van" y el resaltado del
  // botón suben al instante al tocar, sin esperar la vuelta del servidor
  // (ver README del handoff, sección "State Management").
  const [filas, marcarOptimista] = useOptimistic(
    filasIniciales,
    (actual, cambio: { teamMemberId: string; estado: EstadoAsistencia }) =>
      actual.map((fila) =>
        fila.teamMemberId === cambio.teamMemberId
          ? { ...fila, estado: cambio.estado }
          : fila,
      ),
  );

  const confirmados = filas.filter((f) => f.estado === "CONFIRMED").length;

  function responder(fila: FilaAsistencia, estadoTocado: "CONFIRMED" | "DECLINED") {
    // Tocar el botón ya activo lo deselecciona y vuelve a "sin responder".
    const nuevoEstado: EstadoAsistencia =
      fila.estado === estadoTocado ? "PENDING" : estadoTocado;
    // Silbato solo para decir "Voy" — confirmar es la acción positiva;
    // deselegir o decir "No voy" usan el click, igual que rechazar.
    if (nuevoEstado === "CONFIRMED") {
      reproducirSilbato();
    } else {
      reproducirClick();
    }
    setError(null);
    startTransition(async () => {
      marcarOptimista({ teamMemberId: fila.teamMemberId, estado: nuevoEstado });
      const resultado = await responderAsistencia(
        matchId,
        fila.teamMemberId,
        nuevoEstado,
      );
      if (resultado.status === "error") {
        setError(resultado.message ?? "No se pudo guardar tu respuesta.");
      }
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-[11px] tracking-[0.16em] text-tinta/50 uppercase">
          Plantel · {filas.length}
        </p>
        {cupo !== null && (
          <p className="font-mono text-[12px] text-lima-clara">
            {confirmados}/{cupo} van
          </p>
        )}
      </div>
      {puedeResponder && (
        <p className="mt-1 text-[13px] text-tinta/60">
          Toca Voy o No voy al lado de tu nombre.
        </p>
      )}
      {error && <p className="mt-2 text-[13px] text-rojo">{error}</p>}

      {filas.length === 0 ? (
        <p className="mt-4 text-sm text-tinta/50">
          Todavía no hay nadie en el plantel.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {filas.map((fila) => (
            <li
              key={fila.id}
              className={
                "flex flex-wrap items-center gap-[10px] rounded-[14px] px-[14px] py-3 " +
                (fila.estado === "CONFIRMED"
                  ? "border border-lima/35 bg-lima/[0.07]"
                  : "border border-tinta/12 bg-white/[0.022]")
              }
            >
              <span className="w-[22px] shrink-0 font-mono text-[13px] text-tinta/55">
                {fila.dorsal}
              </span>
              <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-tinta">
                {fila.nombre}
              </span>
              {puedeResponder ? (
                <div className="flex w-full gap-2 sm:w-auto">
                  {/* Botones grandes a propósito: esta es la pantalla que
                      abre un jugador cualquiera desde su celular, a veces
                      parado en la calle antes de entrar a la cancha —
                      mínimo 44px de alto, sin negociar. */}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => responder(fila, "CONFIRMED")}
                    className={
                      BOTON_BASE +
                      " " +
                      (fila.estado === "CONFIRMED"
                        ? "bg-lima text-tinta-oscura"
                        : BOTON_INACTIVO)
                    }
                  >
                    Voy
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => responder(fila, "DECLINED")}
                    className={
                      BOTON_BASE +
                      " " +
                      (fila.estado === "DECLINED"
                        ? "bg-tinta/85 text-noche"
                        : BOTON_INACTIVO)
                    }
                  >
                    No voy
                  </button>
                </div>
              ) : (
                <span
                  className={
                    fila.estado === "CONFIRMED"
                      ? "text-sm font-medium text-lima-clara"
                      : fila.estado === "DECLINED"
                        ? "text-sm text-tinta/50"
                        : "text-sm text-tinta/45"
                  }
                >
                  {ETIQUETA[fila.estado]}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
