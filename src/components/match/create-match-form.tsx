"use client";

import { useActionState, useState } from "react";

import { useSound } from "@/components/sound/sound-provider";
import { crearPartido, type CrearPartidoState } from "@/server/actions/match";

const ESTADO_INICIAL: CrearPartidoState = { status: "idle" };

// Estilo de campo compartido por Convocar y Unirse (ver README del
// handoff) — cada form lo declara aparte, no hay un solo lugar en el
// repo hoy que junte estilos de formulario entre pantallas distintas.
const CAMPO_LABEL =
  "font-mono text-[11px] tracking-[0.16em] text-tinta/50 uppercase";
const CAMPO_INPUT =
  "mt-1 w-full rounded-[12px] border border-tinta/16 bg-black/30 px-[15px] py-[15px] text-[16px] text-tinta outline-none focus:border-lima focus:bg-black/45";
const CAMPO_ERROR = "mt-1 text-[13px] text-rojo";

const OPCIONES_CUPO = [
  { etiqueta: "7 jugadores", valor: "7" },
  { etiqueta: "10 jugadores", valor: "10" },
  { etiqueta: "12 jugadores", valor: "12" },
  { etiqueta: "14 jugadores", valor: "14" },
  { etiqueta: "Sin límite", valor: "" },
];

export function CreateMatchForm({ teamId }: { teamId: string }) {
  const crearPartidoConEquipo = crearPartido.bind(null, teamId);
  const [state, formAction, pending] = useActionState(
    crearPartidoConEquipo,
    ESTADO_INICIAL,
  );
  // El chip escribe acá y este input hidden es lo único que ve la server
  // action — así el cupo pasa a ser chips sin tocar crearPartido().
  const [cupo, setCupo] = useState("");
  const { reproducirClick, reproducirSilbato } = useSound();

  return (
    <form
      action={formAction}
      // Optimista a propósito: crearPartido() redirige a la página del
      // partido cuando sale bien, así que nunca hay un estado "success"
      // distinto que esperar para recién ahí tocar el silbato — también
      // suena si después falla la validación, pero es solo un sonido.
      onSubmit={reproducirSilbato}
      className="animar-subir [animation-delay:.05s] mt-6 flex flex-col gap-5 rounded-[20px] border border-tinta/12 bg-[linear-gradient(165deg,rgba(255,255,255,0.045),rgba(255,255,255,0.012))] p-[26px]"
    >
      <div>
        <label htmlFor="venue" className={CAMPO_LABEL}>
          Cancha
        </label>
        <input
          id="venue"
          name="venue"
          type="text"
          required
          placeholder="Cancha Municipal de Ñuñoa"
          className={CAMPO_INPUT}
        />
        {state.fieldErrors?.venue && (
          <p className={CAMPO_ERROR}>{state.fieldErrors.venue}</p>
        )}
      </div>

      <div>
        <label htmlFor="opponent" className={CAMPO_LABEL}>
          Rival <span className="text-tinta/48">· opcional</span>
        </label>
        <input
          id="opponent"
          name="opponent"
          type="text"
          placeholder="Los Tíos del Block"
          className={CAMPO_INPUT}
        />
        {state.fieldErrors?.opponent && (
          <p className={CAMPO_ERROR}>{state.fieldErrors.opponent}</p>
        )}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4">
        <div>
          <label htmlFor="kickoffAt" className={CAMPO_LABEL}>
            Día y hora del pitazo
          </label>
          <input
            id="kickoffAt"
            name="kickoffAt"
            type="datetime-local"
            required
            className={`${CAMPO_INPUT} font-mono text-[15px]`}
          />
          {state.fieldErrors?.kickoffAt && (
            <p className={CAMPO_ERROR}>{state.fieldErrors.kickoffAt}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmDeadline" className={CAMPO_LABEL}>
            Se cierra la lista
          </label>
          <input
            id="confirmDeadline"
            name="confirmDeadline"
            type="datetime-local"
            required
            className={`${CAMPO_INPUT} font-mono text-[15px]`}
          />
          {state.fieldErrors?.confirmDeadline && (
            <p className={CAMPO_ERROR}>{state.fieldErrors.confirmDeadline}</p>
          )}
        </div>
      </div>

      <div>
        <p className={CAMPO_LABEL}>
          Cupo <span className="text-tinta/48">· opcional</span>
        </p>
        <input type="hidden" name="slots" value={cupo} />
        <div className="mt-2 flex flex-wrap gap-2">
          {OPCIONES_CUPO.map((opcion) => (
            <button
              key={opcion.etiqueta}
              type="button"
              onClick={() => {
                setCupo(opcion.valor);
                reproducirClick();
              }}
              className={
                "rounded-[10px] px-[18px] py-[13px] text-[14px] font-bold transition-colors " +
                (cupo === opcion.valor
                  ? "bg-lima text-tinta-oscura"
                  : "border border-tinta/16 bg-transparent text-tinta/60")
              }
            >
              {opcion.etiqueta}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[13px] text-tinta/45">
          {cupo
            ? `Cuando lleguen a ${cupo} confirmados te avisamos.`
            : "Van todos los que confirmen."}
        </p>
        {state.fieldErrors?.slots && (
          <p className={CAMPO_ERROR}>{state.fieldErrors.slots}</p>
        )}
      </div>

      {state.status === "error" && state.message && (
        <p className="text-[14px] text-rojo">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="boton-primario w-full px-4 py-[17px] text-[17px]"
      >
        {pending ? "Creando..." : "Convocar partido"}
      </button>
    </form>
  );
}
