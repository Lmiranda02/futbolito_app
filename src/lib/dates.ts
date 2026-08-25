import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";

/**
 * Todo el proyecto es de Santiago de Chile. Se guarda siempre en UTC y se
 * muestra siempre en esta zona — nunca restando horas a mano, porque Chile
 * tiene horario de verano (cambia dos veces al año) y una resta fija se
 * desfasa apenas cruza ese cambio.
 */
export const ZONA_CHILE = "America/Santiago";

/**
 * Convierte el valor de un <input type="datetime-local"> (una hora "de
 * pared", sin huso horario) a un Date en UTC, interpretándolo como hora de
 * Santiago. Esto es lo que se guarda en la base.
 */
export function horaLocalChileAUtc(valorDatetimeLocal: string): Date {
  return fromZonedTime(valorDatetimeLocal, ZONA_CHILE);
}

/** Fecha UTC de la base, mostrada en hora de Santiago y en español. */
export function formatearFechaChile(
  fechaUtc: Date,
  patron = "EEEE d 'de' MMMM, HH:mm 'hrs'",
): string {
  return formatInTimeZone(fechaUtc, ZONA_CHILE, patron, { locale: es });
}

/**
 * El camino inverso de horaLocalChileAUtc(): a partir de una fecha UTC de
 * la base, arma el string que espera un <input type="datetime-local"> para
 * precargarlo con la hora de Santiago (por ejemplo, al editar un partido).
 */
export function utcADatetimeLocalChile(fechaUtc: Date): string {
  return formatInTimeZone(fechaUtc, ZONA_CHILE, "yyyy-MM-dd'T'HH:mm");
}
