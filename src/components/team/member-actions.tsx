"use client";

import { useState, useTransition } from "react";

import { useSound } from "@/components/sound/sound-provider";
import { approveMember, rejectMember } from "@/server/actions/member";

/**
 * La fila completa de un jugador pendiente (no solo los botones): así
 * puede animar su propia salida al aprobar/rechazar, antes de que el
 * servidor vuelva a traer la lista sin esa fila.
 */
export function MemberActions({
  teamMemberId,
  nombre,
  telefono,
}: {
  teamMemberId: string;
  nombre: string;
  telefono: string;
}) {
  const [pending, startTransition] = useTransition();
  const [enCurso, setEnCurso] = useState<"aprobar" | "rechazar" | null>(null);
  const [saliendo, setSaliendo] = useState(false);
  const { reproducirClick, reproducirSilbato } = useSound();

  function aprobar() {
    setEnCurso("aprobar");
    setSaliendo(true);
    reproducirSilbato();
    startTransition(async () => {
      await approveMember(teamMemberId);
    });
  }

  function rechazar() {
    const confirma = window.confirm(
      "¿Rechazar a este jugador? Va a poder volver a pedir entrar más adelante.",
    );
    if (!confirma) return;
    setEnCurso("rechazar");
    setSaliendo(true);
    reproducirClick();
    startTransition(async () => {
      await rejectMember(teamMemberId);
    });
  }

  return (
    <li
      className={
        "flex flex-wrap items-center gap-3 rounded-xl border border-tinta/12 bg-black/[0.28] px-[14px] py-3 transition-all duration-300 " +
        (saliendo ? "scale-95 opacity-0" : "scale-100 opacity-100")
      }
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-tinta">{nombre}</p>
        <p className="font-mono text-[11px] text-tinta/55">{telefono}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        {/* Copy final del diseño: "Va" / "No", no "Aprobar" / "Rechazar" —
            botones chicos, mínimo 44px de alto igual. */}
        <button
          type="button"
          disabled={pending}
          onClick={aprobar}
          className="boton-primario px-[19px] py-[13px] text-[14px]"
        >
          {enCurso === "aprobar" ? "Va…" : "Va"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={rechazar}
          className="boton-fantasma px-[19px] py-[13px] text-[14px]"
        >
          {enCurso === "rechazar" ? "No…" : "No"}
        </button>
      </div>
    </li>
  );
}
