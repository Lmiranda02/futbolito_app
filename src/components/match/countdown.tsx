"use client";

import { useMemo, useSyncExternalStore } from "react";

/** Segundos restantes, o null si ya venció. */
type Restante = number | null;

/**
 * Arma la "tienda" externa que useSyncExternalStore necesita: algo con
 * subscribe() (avisa cuando hay que revisar de nuevo) y getSnapshot()
 * (el valor actual). Es la forma que React recomienda para un valor que
 * cambia solo, por fuera de un evento de la UI (acá, el paso del tiempo) —
 * en vez de un useState+useEffect que llama setState apenas monta, lo cual
 * fuerza una renderización de más en cada carga.
 *
 * getSnapshot() está memoizado a propósito: si lo llaman dos veces en el
 * mismo segundo (React lo hace para chequear consistencia), tiene que
 * devolver el mismo valor — si devolviera un número recién calculado cada
 * vez daría lo mismo (son primitivos), pero para null sí importa mantener
 * la misma referencia lógica de "ya venció".
 */
function crearAlmacenDeCuentaRegresiva(objetivo: number) {
  let ultimoBucket: Restante | undefined;

  function getSnapshot(): Restante {
    const diff = objetivo - Date.now();
    const bucket = diff <= 0 ? null : Math.floor(diff / 1000);
    ultimoBucket = bucket;
    return ultimoBucket;
  }

  function subscribe(avisar: () => void) {
    const id = setInterval(avisar, 1000);
    return () => clearInterval(id);
  }

  return { getSnapshot, subscribe };
}

/** Nunca calcula la hora real: el servidor y el cliente arrancan de reloj
 * distinto, así que directamente no se intenta — se resuelve recién en el
 * cliente, después de hidratar. */
function getServerSnapshot(): undefined {
  return undefined;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

// Clases completas (no interpoladas): Tailwind solo genera la utilidad
// cuyo texto literal encuentra en el código.
const TAMANOS = {
  36: "text-[36px]", // vista pública — la pantalla del jugador
  34: "text-[34px]", // vista del capitán — cabecera de cartel
} as const;

export function Countdown({
  hastaIso,
  mensajeVencido = "El plazo para confirmar ya venció.",
  tamano = 36,
}: {
  hastaIso: string;
  mensajeVencido?: string;
  tamano?: keyof typeof TAMANOS;
}) {
  const objetivo = new Date(hastaIso).getTime();
  const almacen = useMemo(
    () => crearAlmacenDeCuentaRegresiva(objetivo),
    [objetivo],
  );

  const restante = useSyncExternalStore(
    almacen.subscribe,
    almacen.getSnapshot,
    getServerSnapshot,
  );

  const claseTamano = TAMANOS[tamano];

  if (restante === undefined) {
    return (
      <p
        className={`animar-respirar font-mono ${claseTamano} leading-none font-semibold tracking-[-0.02em] text-tinta/40`}
      >
        --:--:--
      </p>
    );
  }

  if (restante === null) {
    return <p className="text-sm font-medium text-rojo">{mensajeVencido}</p>;
  }

  const horas = Math.floor(restante / 3600);
  const minutos = Math.floor((restante % 3600) / 60);
  const segundos = restante % 60;

  return (
    <p
      className={`animar-respirar font-mono ${claseTamano} leading-none font-semibold tracking-[-0.02em] text-lima`}
    >
      {pad(horas)}:{pad(minutos)}:{pad(segundos)}
    </p>
  );
}
