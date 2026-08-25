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
 * date-fns en español devuelve el día de la semana en minúscula
 * ("sábado"); el diseño lo quiere como encabezado ("Sábado").
 */
function capitalizar(texto: string): string {
  return texto.length === 0 ? texto : texto[0]!.toUpperCase() + texto.slice(1);
}

/**
 * Fecha corta al estilo "marcador de cancha": "Sábado 27 de agosto · 21:00".
 * Es la que usan las pantallas del rediseño (ver design_handoff_arma_tu_partido);
 * formatearFechaChile() sigue igual para el resto.
 */
export function formatearFechaCorta(fechaUtc: Date): string {
  return capitalizar(
    formatearFechaChile(fechaUtc, "EEEE d 'de' MMMM '·' HH:mm"),
  );
}

/**
 * Versión todavía más corta, solo día de la semana y hora: "Sábado 21:00".
 * Para contextos chicos donde ya se sabe la fecha completa por otro lado
 * (por ejemplo, la tarjeta de un equipo en "Mis equipos").
 */
export function formatearDiaHora(fechaUtc: Date): string {
  return capitalizar(formatearFechaChile(fechaUtc, "EEEE HH:mm"));
}

/**
 * El camino inverso de horaLocalChileAUtc(): a partir de una fecha UTC de
 * la base, arma el string que espera un <input type="datetime-local"> para
 * precargarlo con la hora de Santiago (por ejemplo, al editar un partido).
 */
export function utcADatetimeLocalChile(fechaUtc: Date): string {
  return formatInTimeZone(fechaUtc, ZONA_CHILE, "yyyy-MM-dd'T'HH:mm");
}

/**
 * ¿Ya pasó esta fecha? Envuelto en su propia función (en vez de comparar
 * contra `Date.now()` suelto adentro de un componente) porque ESLint
 * marca `Date.now()` como una llamada "impura" dentro del cuerpo de un
 * componente de servidor. De paso, centraliza en un solo lugar esta
 * comparación, que si no quedaría repetida en cada lugar que la necesita.
 */
export function yaPaso(fechaUtc: Date): boolean {
  return fechaUtc.getTime() <= Date.now();
}
