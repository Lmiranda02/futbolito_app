"use client";

import { useActionState, useEffect } from "react";

import { useSound } from "@/components/sound/sound-provider";
import { joinTeam, type JoinState } from "@/server/actions/join";

const ESTADO_INICIAL: JoinState = { status: "idle" };

// Mismo estilo de campo que Convocar (ver create-match-form.tsx).
const CAMPO_LABEL =
  "font-mono text-[11px] tracking-[0.16em] text-tinta/50 uppercase";
const CAMPO_INPUT =
  "mt-1 w-full rounded-[12px] border border-tinta/16 bg-black/30 px-[15px] py-[15px] text-[16px] text-tinta outline-none focus:border-lima focus:bg-black/45";
const CAMPO_ERROR = "mt-1 text-[13px] text-rojo";

export function JoinForm({ inviteCode }: { inviteCode: string }) {
  const [state, formAction, pending] = useActionState(
    joinTeam,
    ESTADO_INICIAL,
  );
  const { reproducirSilbato } = useSound();

  // El silbato es de la respuesta real del servidor, no del click en
  // "Unirme al equipo".
  useEffect(() => {
    if (state.status === "success") {
      reproducirSilbato();
    }
  }, [state, reproducirSilbato]);

  if (state.status === "success") {
    return (
      <div className="animar-subir mt-7 rounded-2xl border border-lima/35 bg-lima/[0.09] px-6 py-6 text-center">
        <p className="text-[17px] font-bold text-lima-clara">
          Quedaste en la lista
        </p>
        <p className="mt-1 text-[14px] text-tinta/62">
          El capitán tiene que darte el visto bueno. Cuando lo haga te va a
          llegar el link de los partidos.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-7 flex flex-col gap-[18px]">
      <input type="hidden" name="inviteCode" value={inviteCode} />

      <div>
        <label htmlFor="nombre" className={CAMPO_LABEL}>
          Tu nombre
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          required
          placeholder="Nombre y apellido"
          className={CAMPO_INPUT}
        />
        {state.fieldErrors?.nombre && (
          <p className={CAMPO_ERROR}>{state.fieldErrors.nombre}</p>
        )}
      </div>

      <div>
        <label htmlFor="apodo" className={CAMPO_LABEL}>
          Apodo <span className="text-tinta/48">· opcional</span>
        </label>
        <input
          id="apodo"
          name="apodo"
          type="text"
          placeholder="Cómo te dicen en la cancha"
          className={CAMPO_INPUT}
        />
        {state.fieldErrors?.apodo && (
          <p className={CAMPO_ERROR}>{state.fieldErrors.apodo}</p>
        )}
      </div>

      <div>
        <label htmlFor="telefono" className={CAMPO_LABEL}>
          Tu teléfono
        </label>
        <div className="mt-1 flex overflow-hidden rounded-[12px] border border-tinta/16 bg-black/30 focus-within:border-lima focus-within:bg-black/45">
          {/* Decorativo: el input sigue mandando solo los dígitos. */}
          <span className="flex items-center border-r border-tinta/12 px-[14px] font-mono text-[15px] text-tinta/45">
            +56
          </span>
          <input
            id="telefono"
            name="telefono"
            type="tel"
            inputMode="numeric"
            required
            placeholder="9 1234 5678"
            className="min-w-0 flex-1 bg-transparent px-[15px] py-[15px] font-mono text-[16px] text-tinta outline-none"
          />
        </div>
        {state.fieldErrors?.telefono && (
          <p className={CAMPO_ERROR}>{state.fieldErrors.telefono}</p>
        )}
      </div>

      {state.status === "error" && state.message && (
        <p className="text-[14px] text-rojo">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="boton-primario w-full px-4 py-[17px] text-[16px]"
      >
        {pending ? "Enviando..." : "Unirme al equipo"}
      </button>
    </form>
  );
}
