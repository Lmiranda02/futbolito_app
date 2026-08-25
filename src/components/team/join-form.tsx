"use client";

import { useActionState } from "react";

import { joinTeam, type JoinState } from "@/server/actions/join";

const ESTADO_INICIAL: JoinState = { status: "idle" };

export function JoinForm({ inviteCode }: { inviteCode: string }) {
  const [state, formAction, pending] = useActionState(
    joinTeam,
    ESTADO_INICIAL,
  );

  if (state.status === "success") {
    return (
      <div className="mt-8 rounded-md border border-emerald-300 bg-emerald-50 px-4 py-4 text-center dark:border-emerald-800 dark:bg-emerald-950">
        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
          {state.message}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <input type="hidden" name="inviteCode" value={inviteCode} />

      <div>
        <label htmlFor="nombre" className="block text-sm font-medium">
          Tu nombre
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          required
          placeholder="Nombre y apellido"
          className="mt-1 w-full rounded-md border border-black/15 bg-transparent px-3 py-2.5 text-base outline-none focus:border-emerald-600 dark:border-white/20"
        />
        {state.fieldErrors?.nombre && (
          <p className="mt-1 text-sm text-red-700 dark:text-red-400">
            {state.fieldErrors.nombre}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="apodo" className="block text-sm font-medium">
          Apodo <span className="font-normal opacity-60">(opcional)</span>
        </label>
        <input
          id="apodo"
          name="apodo"
          type="text"
          placeholder="Cómo te dicen en la cancha"
          className="mt-1 w-full rounded-md border border-black/15 bg-transparent px-3 py-2.5 text-base outline-none focus:border-emerald-600 dark:border-white/20"
        />
        {state.fieldErrors?.apodo && (
          <p className="mt-1 text-sm text-red-700 dark:text-red-400">
            {state.fieldErrors.apodo}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="telefono" className="block text-sm font-medium">
          Tu teléfono
        </label>
        <input
          id="telefono"
          name="telefono"
          type="tel"
          inputMode="numeric"
          required
          placeholder="9 1234 5678"
          className="mt-1 w-full rounded-md border border-black/15 bg-transparent px-3 py-2.5 text-base outline-none focus:border-emerald-600 dark:border-white/20"
        />
        {state.fieldErrors?.telefono && (
          <p className="mt-1 text-sm text-red-700 dark:text-red-400">
            {state.fieldErrors.telefono}
          </p>
        )}
      </div>

      {state.status === "error" && state.message && (
        <p className="text-sm text-red-700 dark:text-red-400">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-emerald-600 px-4 py-3 text-base font-medium text-white disabled:opacity-60"
      >
        {pending ? "Enviando..." : "Unirme al equipo"}
      </button>
    </form>
  );
}
