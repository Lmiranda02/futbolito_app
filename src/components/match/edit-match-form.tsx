"use client";

import { useActionState } from "react";

import { updateMatch, type PartidoFormState } from "@/server/actions/match";

const ESTADO_INICIAL: PartidoFormState = { status: "idle" };

export function EditMatchForm({
  teamId,
  matchId,
  valoresIniciales,
}: {
  teamId: string;
  matchId: string;
  valoresIniciales: {
    venue: string;
    opponent: string;
    slots: string;
    kickoffAt: string;
    confirmDeadline: string;
  };
}) {
  const actualizarPartido = updateMatch.bind(null, teamId, matchId);
  const [state, formAction, pending] = useActionState(
    actualizarPartido,
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
          defaultValue={valoresIniciales.venue}
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
          defaultValue={valoresIniciales.opponent}
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
          defaultValue={valoresIniciales.kickoffAt}
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
          defaultValue={valoresIniciales.confirmDeadline}
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
          defaultValue={valoresIniciales.slots}
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
        {pending ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
