"use client";

import { useActionState, useEffect, useState } from "react";

import { useSound } from "@/components/sound/sound-provider";
import { requestMagicLink, type LoginState } from "@/server/actions/auth";

const ESTADO_INICIAL: LoginState = { status: "idle" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    requestMagicLink,
    ESTADO_INICIAL,
  );
  // useActionState no tiene forma propia de "volver atrás": esto es lo
  // que hace que "Usar otro correo" pueda tapar el estado de éxito sin
  // perder lo que ya devolvió la última respuesta del servidor.
  const [cambiandoCorreo, setCambiandoCorreo] = useState(false);
  const { reproducirSilbato } = useSound();

  // El silbato es de la respuesta real del servidor, no del click en
  // "Mandarme el link" — por eso va acá y no en el onSubmit del form.
  useEffect(() => {
    if (state.status === "success") {
      reproducirSilbato();
    }
  }, [state, reproducirSilbato]);

  if (state.status === "success" && !cambiandoCorreo) {
    return (
      <div className="animar-subir mt-8 rounded-2xl border border-lima/35 bg-lima/[0.09] px-[22px] py-[22px] text-center">
        <p className="text-[16px] font-bold text-lima-clara">
          Listo, revisa tu correo
        </p>
        <p className="mt-1 text-[14px] text-tinta/62">
          Te mandamos el link. Puede demorar un par de minutos — pega una
          mirada al spam por si acaso.
        </p>
        <button
          type="button"
          onClick={() => setCambiandoCorreo(true)}
          className="boton-fantasma mt-4 px-[18px] py-[10px] text-[13px]"
        >
          Usar otro correo
        </button>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={() => setCambiandoCorreo(false)}
      className="mt-8 flex flex-col gap-[14px]"
    >
      <div>
        <label
          htmlFor="email"
          className="font-mono text-[11px] tracking-[0.16em] text-tinta/50 uppercase"
        >
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="tu@correo.cl"
          className="mt-1 w-full rounded-[12px] border border-tinta/18 bg-white/[0.04] px-4 py-4 text-[17px] text-tinta outline-none focus:border-lima focus:bg-white/[0.07]"
        />
      </div>

      {state.status === "error" && (
        <p className="text-[14px] text-rojo">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="boton-primario w-full px-4 py-[17px] text-[16px]"
      >
        {pending ? "Enviando..." : "Mandarme el link"}
      </button>

      <p className="text-center text-[13px] text-tinta/40">
        Solo los capitanes necesitan entrar. Los jugadores se anotan con el
        link.
      </p>
    </form>
  );
}
