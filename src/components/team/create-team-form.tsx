"use client";

import { useActionState } from "react";

import { crearEquipo, type CrearEquipoState } from "@/server/actions/team";

const ESTADO_INICIAL: CrearEquipoState = { status: "idle" };

export function CreateTeamForm() {
  const [state, formAction, pending] = useActionState(
    crearEquipo,
    ESTADO_INICIAL,
  );

  return (
    <form action={formAction} className="mt-6 space-y-5">
      <div>
        <label htmlFor="nombreEquipo" className="block text-sm font-medium">
          Nombre del equipo
        </label>
        <input
          id="nombreEquipo"
          name="nombreEquipo"
          type="text"
          required
          placeholder="Deportivo Ñuñoa"
          className="mt-1 w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-base outline-none focus:border-emerald-600 dark:border-white/20"
        />
        {state.fieldErrors?.nombreEquipo && (
          <p className="mt-1 text-sm text-red-700 dark:text-red-400">
            {state.fieldErrors.nombreEquipo}
          </p>
        )}
      </div>

      <fieldset className="rounded-md border border-black/10 p-4 dark:border-white/10">
        <legend className="px-1 text-sm font-medium">Tú, como jugador</legend>

        <div className="mt-2">
          <label htmlFor="nombreJugador" className="block text-sm font-medium">
            Tu nombre
          </label>
          <input
            id="nombreJugador"
            name="nombreJugador"
            type="text"
            required
            placeholder="Como quieras que te vean en el plantel"
            className="mt-1 w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-base outline-none focus:border-emerald-600 dark:border-white/20"
          />
          {state.fieldErrors?.nombreJugador && (
            <p className="mt-1 text-sm text-red-700 dark:text-red-400">
              {state.fieldErrors.nombreJugador}
            </p>
          )}
        </div>

        <div className="mt-4">
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
            className="mt-1 w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-base outline-none focus:border-emerald-600 dark:border-white/20"
          />
          {state.fieldErrors?.telefono && (
            <p className="mt-1 text-sm text-red-700 dark:text-red-400">
              {state.fieldErrors.telefono}
            </p>
          )}
        </div>
      </fieldset>

      {state.status === "error" && state.message && (
        <p className="text-sm text-red-700 dark:text-red-400">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Creando..." : "Crear equipo"}
      </button>
    </form>
  );
}
