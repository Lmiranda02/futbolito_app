import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Solo POST, a propósito: cerrar sesión con un simple GET (un link, o una
 * imagen) permitiría que cualquier página deslogueara a un capitán sin que
 * lo haya pedido. Se invoca desde un <form method="post"> en el dashboard.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/login", request.url));
}
