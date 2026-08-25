/**
 * Normaliza un teléfono chileno al formato en el que se guarda en la base
 * (ver el comentario en Player.phone del schema): "56" + 9 dígitos, sin
 * espacios ni símbolos. Sin esto el @unique de Player.phone no sirve de
 * nada — "9 8765 4321" y "+56987654321" quedarían como dos personas
 * distintas.
 *
 * Acepta cualquier forma en que alguien lo escriba a mano: con espacios,
 * guiones, con el +56 puesto o no. Devuelve null si no calza con un
 * teléfono chileno válido (9 dígitos, con o sin el 56 adelante).
 */
export function normalizarTelefono(valor: string): string | null {
  const soloDigitos = valor.replace(/\D/g, "");

  if (soloDigitos.length === 11 && soloDigitos.startsWith("56")) {
    return soloDigitos;
  }

  if (soloDigitos.length === 9) {
    return `56${soloDigitos}`;
  }

  return null;
}

/** "56987654321" -> "+56 9 8765 4321", para mostrar en la interfaz. */
export function formatearTelefono(telefonoNormalizado: string): string {
  const sinCodigo = telefonoNormalizado.slice(2);
  return `+56 ${sinCodigo.slice(0, 1)} ${sinCodigo.slice(1, 5)} ${sinCodigo.slice(5)}`;
}
