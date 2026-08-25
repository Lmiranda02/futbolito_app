import { randomInt } from "node:crypto";

// Sin 0/O, 1/l/I: caracteres que se confunden fácil al escribir un código a
// mano si alguien lo lee en voz alta o lo copia desde una foto del cartel.
const ALFABETO = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function generarCodigo(largo: number): string {
  let codigo = "";
  for (let i = 0; i < largo; i++) {
    codigo += ALFABETO[randomInt(ALFABETO.length)];
  }
  return codigo;
}

/** Código del link de invitación de un equipo: /unirse/<inviteCode> */
export function generarInviteCode(): string {
  return generarCodigo(8);
}

/** Id del link público de un partido: /partido/<publicId> */
export function generarPublicId(): string {
  return generarCodigo(12);
}
