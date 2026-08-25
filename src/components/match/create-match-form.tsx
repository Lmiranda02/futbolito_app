"use client";

import { useActionState } from "react";

import { crearPartido, type CrearPartidoState } from "@/server/actions/match";

const ESTADO_INICIAL: CrearPartidoState = { status: "idle" };

export function CreateMatchForm({ teamId }: { teamId: string }) {
  const crearPartidoConEquipo = crearPartido.bind(null, teamId);
  const [state, formAction, pending] = useActionState(
    crearPartidoConEquipo,
    ESTADO_INICIAL,
  );

  return (
    <form action={formAction} className="mt-6 space-y-5">
      <div>
        <label htmlFor="venue" className="block text-sm font-medium">
          Cancha
        </label>
        <input
          id="venue"
          name="venue"
          type="text"
          required
          placeholder="Cancha Municipal Ñuñoa"
          className="mt-1 w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-base outline-none focus:border-emerald-600 dark:border-white/20"
        />
        {state.fieldErrors?.venue && (
          <p className="mt-1 text-sm text-red-700 dark:text-red-400">
            {state.fieldErrors.venue}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="opponent" className="block text-sm font-medium">
          Rival <span className="font-normal opacity-60">(opcional)</span>
        </label>
        <input
          id="opponent"
          name="opponent"
          type="text"
          placeholder="Los Tigres"
          className="mt-1 w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-base outline-none focus:border-emerald-600 dark:border-white/20"
        />
        {state.fieldErrors?.opponent && (
          <p className="mt-1 text-sm text-red-700 dark:text-red-400">
            {state.fieldErrors.opponent}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="kickoffAt" className="block text-sm font-medium">
          Fecha y hora del partido
        </label>
        <input
          id="kickoffAt"
          name="kickoffAt"
          type="datetime-local"
          required
          className="mt-1 w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-base outline-none focus:border-emerald-600 dark:border-white/20"
        />
        {state.fieldErrors?.kickoffAt && (
          <p className="mt-1 text-sm text-red-700 dark:text-red-400">
            {state.fieldErrors.kickoffAt}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="confirmDeadline" className="block text-sm font-medium">
          Hora límite para confirmar asistencia
        </label>
        <input
          id="confirmDeadline"
          name="confirmDeadline"
          type="datetime-local"
          required
          className="mt-1 w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-base outline-none focus:border-emerald-600 dark:border-white/20"
        />
        {state.fieldErrors?.confirmDeadline && (
          <p className="mt-1 text-sm text-red-700 dark:text-red-400">
            {state.fieldErrors.confirmDeadline}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="slots" className="block text-sm font-medium">
          Cupo <span className="font-normal opacity-60">(opcional)</span>
        </label>
        <input
          id="slots"
          name="slots"
          type="number"
          min="1"
          placeholder="10"
          className="mt-1 w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-base outline-none focus:border-emerald-600 dark:border-white/20"
        />
        {state.fieldErrors?.slots && (
          <p className="mt-1 text-sm text-red-700 dark:text-red-400">
            {state.fieldErrors.slots}
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
        className="w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Creando..." : "Convocar partido"}
      </button>
    </form>
  );
}
