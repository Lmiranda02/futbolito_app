"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { yaPaso } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const respuestaSchema = z.object({
  matchId: z.string().trim().min(1),
  teamMemberId: z.string().trim().min(1),
  // PENDING es el "deshacer": tocar de nuevo el botón ya activo vuelve a
  // sin responder (ver AttendanceList — el toggle-off del diseño).
  status: z.enum(["CONFIRMED", "DECLINED", "PENDING"]),
});

export type AttendanceState = {
  status: "idle" | "error" | "success";
  message?: string;
};

async function obtenerIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "desconocida";
}

/**
 * Guarda la respuesta de un jugador a un partido (Voy / No voy). Público,
 * sin sesión: quien tiene el link del partido puede responder por
 * cualquiera del plantel — es una limitación conocida y aceptada para la
 * Fase 1 (ver la decisión de diseño en el ROADMAP, bloque 6), no un
 * descuido.
 *
 * Vuelve a validar todo del lado del servidor sin confiar en lo que
 * muestre la página en ese momento: el plazo puede haber vencido entre
 * que alguien abrió el link y que tocó el botón, o el capitán pudo haber
 * cancelado el partido mientras tanto.
 */
export async function responderAsistencia(
  matchId: string,
  teamMemberId: string,
  nuevoEstado: "CONFIRMED" | "DECLINED" | "PENDING",
): Promise<AttendanceState> {
  const ip = await obtenerIp();
  const dentroDelLimite = await checkRateLimit(`asistencia:${ip}`, {
    max: 30,
    windowMs: 10 * 60 * 1000,
  });
  if (!dentroDelLimite) {
    return {
      status: "error",
      message: "Muchos intentos seguidos. Espera unos minutos e intenta de nuevo.",
    };
  }

  const parsed = respuestaSchema.safeParse({
    matchId,
    teamMemberId,
    status: nuevoEstado,
  });
  if (!parsed.success) {
    return { status: "error", message: "Algo salió mal. Recarga la página e intenta de nuevo." };
  }

  const match = await prisma.match.findUnique({
    where: { id: parsed.data.matchId },
  });
  if (!match) {
    return { status: "error", message: "Este partido ya no existe." };
  }
  if (match.status !== "SCHEDULED") {
    return { status: "error", message: "Este partido fue cancelado." };
  }
  if (yaPaso(match.confirmDeadline)) {
    return { status: "error", message: "El plazo para confirmar ya venció." };
  }

  // Confirma que ese teamMemberId realmente tenga una asistencia en ESTE
  // partido, en vez de confiar ciegamente en lo que llegó del cliente.
  const attendance = await prisma.attendance.findUnique({
    where: {
      matchId_teamMemberId: {
        matchId: match.id,
        teamMemberId: parsed.data.teamMemberId,
      },
    },
  });
  if (!attendance) {
    return { status: "error", message: "No te encontramos en el plantel de este partido." };
  }

  await prisma.attendance.update({
    where: { id: attendance.id },
    data: {
      status: parsed.data.status,
      // "Sin responder" no es una respuesta: no le corresponde marca de
      // hora, igual que cuando nace la asistencia.
      respondedAt: parsed.data.status === "PENDING" ? null : new Date(),
    },
  });

  // La misma respuesta la ve el jugador en esta página pública y el
  // capitán en el detalle privado del partido — se refrescan los dos.
  revalidatePath(`/partido/${match.publicId}`);
  revalidatePath(`/dashboard/equipos/${match.teamId}/partidos/${match.id}`);

  return { status: "success" };
}
