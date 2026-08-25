"use server";

import { revalidatePath } from "next/cache";

import { requireCaptain } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Confirma que el teamMemberId sea de un equipo del capitán logueado.
 * Es la misma idea que requireTeamOwnership(), pero partiendo del
 * TeamMember en vez del Team: acá no hay página que muestre un 404, así
 * que si no es dueño simplemente no se hace nada (ver comentario en las
 * funciones de abajo).
 */
async function requireOwnedMember(teamMemberId: string) {
  const captain = await requireCaptain();
  const member = await prisma.teamMember.findUnique({
    where: { id: teamMemberId },
    include: { team: true },
  });

  if (!member || member.team.captainId !== captain.id) {
    return null;
  }

  return member;
}

/**
 * Aprueba a un jugador pendiente. Además, le crea una fila de asistencia
 * PENDING para cada partido futuro que ya existía en el equipo — así el
 * capitán no tiene que "acordarse" de sumarlo a los partidos ya
 * convocados (ver la nota de diseño en el ROADMAP, bloque 1).
 */
export async function approveMember(teamMemberId: string): Promise<void> {
  const member = await requireOwnedMember(teamMemberId);
  // Si no es un miembro del capitán logueado, no hacemos nada: la UI
  // nunca debería ofrecer este botón para un miembro ajeno, así que
  // llegar acá sin ser dueño solo puede ser alguien manipulando la
  // request a mano. Fallar en silencio es suficiente, no hay nada que
  // informarle a quien está intentando eso.
  if (!member) return;

  await prisma.$transaction(async (tx) => {
    await tx.teamMember.update({
      where: { id: member.id },
      data: { status: "APPROVED", decidedAt: new Date() },
    });

    const partidosFuturos = await tx.match.findMany({
      where: {
        teamId: member.teamId,
        status: "SCHEDULED",
        kickoffAt: { gt: new Date() },
      },
      select: { id: true },
    });

    if (partidosFuturos.length > 0) {
      await tx.attendance.createMany({
        data: partidosFuturos.map((match) => ({
          matchId: match.id,
          teamMemberId: member.id,
          status: "PENDING" as const,
        })),
        skipDuplicates: true,
      });
    }
  });

  revalidatePath(`/dashboard/equipos/${member.teamId}`);
}

/** Rechaza a un jugador pendiente. Puede volver a pedir entrar más adelante. */
export async function rejectMember(teamMemberId: string): Promise<void> {
  const member = await requireOwnedMember(teamMemberId);
  if (!member) return;

  await prisma.teamMember.update({
    where: { id: member.id },
    data: { status: "REJECTED", decidedAt: new Date() },
  });

  revalidatePath(`/dashboard/equipos/${member.teamId}`);
}
