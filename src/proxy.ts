import { type NextRequest } from "next/server";

import { applySecurityHeaders } from "@/lib/security-headers";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Corre en cada request (salvo assets estáticos, ver `matcher` abajo):
 *
 * 1. Refresca la sesión de Supabase, para que no se corte sola. La
 *    protección real de /dashboard (redirigir a /login si no hay sesión)
 *    se agrega en la tarea 2.2, junto con requireCaptain() — un proxy
 *    nunca alcanza como única defensa, cada server action también tiene
 *    que revisar la sesión por su cuenta.
 * 2. Agrega las cabeceras de seguridad (CSP con nonce, X-Frame-Options,
 *    etc.), ver src/lib/security-headers.ts.
 *
 * El nonce se agrega a la request ANTES de llamar a updateSession, para
 * que sus dos `NextResponse.next({ request })` internos (que arman la
 * respuesta que ven los Server Components) ya lo incluyan sin tener que
 * tocar ese archivo.
 */
export async function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  request.headers.set("x-nonce", nonce);

  const { supabaseResponse } = await updateSession(request);
  applySecurityHeaders(supabaseResponse.headers, nonce);

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Todo menos los archivos estáticos de Next y los assets con extensión
    // conocida: no tiene sentido gastar una consulta a Supabase por cada
    // imagen o cada chunk de JS.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
