"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireCaptain } from "@/lib/auth";
import { generarInviteCode } from "@/lib/codes";
import { normalizarTelefono } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

const crearEquipoSchema = z.object({
  nombreEquipo: z
    .string()
    .trim()
    .min(2, "El nombre del equipo es muy corto.")
    .max(60, "El nombre es muy largo."),
  nombreJugador: z
    .string()
    .trim()
    .min(2, "Tu nombre es muy corto.")
    .max(60, "Tu nombre es muy largo."),
  telefono: z
    .string()
    .trim()
    .transform((valor, ctx) => {
      const normalizado = normalizarTelefono(valor);
      if (!normalizado) {
        ctx.addIssue({
          code: "custom",
          message: "Ingresa un teléfono chileno válido (9 dígitos).",
        });
        return z.NEVER;
      }
      return normalizado;
    }),
});

type Campo = "nombreEquipo" | "nombreJugador" | "telefono";

export type CrearEquipoState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Partial<Record<Campo, string>>;
};

/**
 * Crea un equipo nuevo y, en la misma transacción, la membresía del
 * capitán como jugador ya aprobado (decisión de diseño: el capitán
 * también juega). Si el código de invitación generado chocara con uno ya
 * existente (extremadamente improbable con 8 caracteres), reintenta con
 * uno nuevo en vez de fallar.
 */
export async function crearEquipo(
  _prevState: CrearEquipoState,
  formData: FormData,
): Promise<CrearEquipoState> {
  const captain = await requireCaptain();

  const parsed = crearEquipoSchema.safeParse({
    nombreEquipo: formData.get("nombreEquipo"),
    nombreJugador: formData.get("nombreJugador"),
    telefono: formData.get("telefono"),
  });

  if (!parsed.success) {
    const fieldErrors: CrearEquipoState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const campo = issue.path[0];
      if (typeof campo === "string" && !(campo in fieldErrors)) {
        fieldErrors[campo as Campo] = issue.message;
      }
    }
    return { status: "error", fieldErrors };
  }

  const { nombreEquipo, nombreJugador, telefono } = parsed.data;

  let team = null;
  for (let intento = 0; intento < 5 && !team; intento++) {
    const inviteCode = generarInviteCode();
    try {
      team = await prisma.$transaction(async (tx) => {
        const nuevoEquipo = await tx.team.create({
          data: { name: nombreEquipo, captainId: captain.id, inviteCode },
        });

        // upsert por teléfono: si el capitán ya juega en otro equipo,
        // reusa su Player existente en vez de crear uno duplicado.
        const player = await tx.player.upsert({
          where: { phone: telefono },
          update: { name: nombreJugador },
          create: { name: nombreJugador, phone: telefono },
        });

        await tx.teamMember.create({
          data: {
            teamId: nuevoEquipo.id,
            playerId: player.id,
            role: "CAPTAIN",
            status: "APPROVED",
            decidedAt: new Date(),
          },
        });

        return nuevoEquipo;
      });
    } catch (error) {
      const esChoqueDeCodigo =
        error !== null &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2002";
      if (!esChoqueDeCodigo) throw error;
      // Sigue el loop y prueba con un inviteCode nuevo.
    }
  }

  if (!team) {
    console.error("[crearEquipo] no se pudo generar un inviteCode único tras 5 intentos");
    return {
      status: "error",
      message: "No pudimos crear el equipo. Intenta de nuevo en un momento.",
    };
  }

  // Primera vez que sabemos cómo se llama el capitán (el login solo pide
  // el correo): lo guardamos para poder saludarlo por su nombre.
  if (!captain.name) {
    await prisma.captain.update({
      where: { id: captain.id },
      data: { name: nombreJugador },
    });
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
