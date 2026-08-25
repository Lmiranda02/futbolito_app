import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

// Sin esto, Next podría cachear la respuesta y reusarla para el próximo
// que haga click en un link de magic link distinto.
export const dynamic = "force-dynamic";

/** Evita un "open redirect": solo se acepta una ruta interna (/algo), nunca
 * una URL completa ni "//otro-host" (que el navegador trata como
 * protocolo-relativo a otro dominio). */
function rutaSegura(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/dashboard";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = rutaSegura(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Primera vez que este capitán entra: crea su fila local. Las
      // veces siguientes, esto es un no-op (el email no suele cambiar).
      await prisma.captain.upsert({
        where: { id: data.user.id },
        update: { email: data.user.email! },
        create: { id: data.user.id, email: data.user.email! },
      });

      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error(
      "[auth/callback] exchangeCodeForSession falló:",
      error?.message,
    );
  }

  // Sin código, o el canje falló: el link puede estar vencido, ya usado, o
  // ser inválido. Se avisa en /login en vez de fallar en silencio.
  return NextResponse.redirect(`${origin}/login?error=link_invalido`);
}
