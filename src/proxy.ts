import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * Por ahora este middleware solo refresca la sesión en cada request, para
 * que no se corte sola. La protección real de /dashboard (redirigir a
 * /login si no hay sesión) se agrega en la tarea 2.2, junto con
 * requireCaptain() — un middleware nunca alcanza como única defensa, cada
 * server action también tiene que revisar la sesión por su cuenta.
 */
export async function proxy(request: NextRequest) {
  const { supabaseResponse } = await updateSession(request);
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
