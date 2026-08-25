import "server-only";

import { cache } from "react";
import { notFound, redirect } from "next/navigation";

import type { Captain, Match, Team } from "@/generated/prisma/client";
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

/**
 * Para páginas y server actions que operan sobre UN equipo puntual
 * (/dashboard/equipos/[teamId] y todo lo que cuelgue de ahí). Devuelve el
 * capitán y el equipo solo si el equipo existe Y es del capitán logueado.
 *
 * Si cualquiera de las dos condiciones falla, responde con un 404 — nunca
 * con algo tipo "este equipo no es tuyo". Un capitán que prueba ids de
 * equipos ajenos en la URL no puede distinguir "no existe" de "existe pero
 * no es mío": las dos respuestas se ven exactamente igual desde afuera.
 */
export const requireTeamOwnership = cache(
  async (teamId: string): Promise<{ captain: Captain; team: Team }> => {
    const captain = await requireCaptain();
    const team = await prisma.team.findUnique({ where: { id: teamId } });

    if (!team || team.captainId !== captain.id) {
      notFound();
    }

    return { captain, team };
  },
);

/**
 * Igual que requireTeamOwnership(), un nivel más abajo: para páginas que
 * operan sobre UN partido puntual. 404 tanto si el partido no existe como
 * si es de otro equipo — mismo motivo que arriba.
 */
export const requireMatchOwnership = cache(
  async (
    teamId: string,
    matchId: string,
  ): Promise<{ captain: Captain; team: Team; match: Match }> => {
    const { captain, team } = await requireTeamOwnership(teamId);
    const match = await prisma.match.findUnique({ where: { id: matchId } });

    if (!match || match.teamId !== team.id) {
      notFound();
    }

    return { captain, team, match };
  },
);
