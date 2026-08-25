/**
 * Dorsales de presentación (no se guardan en la base): el capitán es
 * siempre "01" y el resto sigue el orden en que llegó la lista —
 * numerada desde "02" — con cero a la izquierda. Se recalcula cada vez
 * que se muestra, así que hay que pasarle la lista ya en el orden que se
 * quiere numerar (por ejemplo, por requestedAt ascendente).
 */
export function asignarDorsales(miembros: { role: string }[]): string[] {
  let siguiente = 2;
  return miembros.map((miembro) =>
    miembro.role === "CAPTAIN" ? "01" : String(siguiente++).padStart(2, "0"),
  );
}
