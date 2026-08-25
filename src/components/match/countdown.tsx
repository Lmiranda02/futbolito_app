"use client";

import { useMemo, useSyncExternalStore } from "react";

type Restante = {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
} | null;

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
 * devolver el mismo objeto — si devolviera uno nuevo cada vez, React
 * pensaría que el valor cambió en cada render y avisaría por consola.
 */
function crearAlmacenDeCuentaRegresiva(objetivo: number) {
  let ultimoBucket: number | null | undefined;
  let ultimoSnapshot: Restante;

  function getSnapshot(): Restante {
    const diff = objetivo - Date.now();
    const bucket = diff <= 0 ? null : Math.floor(diff / 1000);

    if (bucket === ultimoBucket) {
      return ultimoSnapshot;
    }

    ultimoBucket = bucket;
    ultimoSnapshot =
      bucket === null
        ? null
        : {
            dias: Math.floor(bucket / 86_400),
            horas: Math.floor((bucket % 86_400) / 3_600),
            minutos: Math.floor((bucket % 3_600) / 60),
            segundos: bucket % 60,
          };
    return ultimoSnapshot;
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

export function Countdown({ hastaIso }: { hastaIso: string }) {
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

  if (restante === undefined) {
    return <p className="text-sm opacity-60">Calculando el tiempo restante…</p>;
  }

  if (restante === null) {
    return (
      <p className="text-sm font-medium text-red-700 dark:text-red-400">
        El plazo para confirmar ya venció.
      </p>
    );
  }

  const partes: string[] = [];
  if (restante.dias > 0) partes.push(`${restante.dias} d`);
  if (restante.dias > 0 || restante.horas > 0) partes.push(`${restante.horas} h`);
  partes.push(`${restante.minutos} min`);
  if (restante.dias === 0 && restante.horas === 0) {
    partes.push(`${restante.segundos} s`);
  }

  return (
    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
      Quedan {partes.join(" ")} para confirmar
    </p>
  );
}
