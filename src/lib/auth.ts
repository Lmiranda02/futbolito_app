import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import type { Captain } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

/**
 * Devuelve el capitán logueado (o null si no hay sesión).
 *
 * Envuelto en `cache()` de React: dentro de un mismo request se puede llamar
 * desde el layout del dashboard (para el guard) y de nuevo desde la página
 * (para mostrar sus datos) sin pagar dos veces la consulta a Supabase y a
 * la base — React memoiza el resultado por request.
 */
export const getCaptain = cache(async (): Promise<Captain | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const captain = await prisma.captain.findUnique({ where: { id: user.id } });
  if (captain) return captain;

  // No debería pasar en el flujo normal: la fila se crea en /auth/callback
  // la primera vez que alguien entra. Este es solo un resguardo para no
  // dejar a un capitán con sesión válida pero sin fila local.
  return prisma.captain.create({
    data: { id: user.id, email: user.email! },
  });
});

/**
 * Para usar al principio de cualquier página o server action que solo
 * puede usar un capitán logueado. Si no hay sesión, redirige a /login.
 *
 * Esto es la segunda cerradura: src/proxy.ts refresca la sesión en cada
 * request pero no bloquea nada por su cuenta (ver comentario ahí). Cada
 * página del dashboard y cada server action que toque datos de un equipo
 * tiene que llamar a este helper (o a requireTeamOwnership(), que se suma
 * en el bloque 3) — un guard a nivel de layout no alcanza para las server
 * actions, que se pueden invocar directo sin pasar por la página.
 */
export async function requireCaptain(): Promise<Captain> {
  const captain = await getCaptain();
  if (!captain) {
    redirect("/login");
  }
  return captain;
}
