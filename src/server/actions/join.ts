"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { normalizarTelefono } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const joinSchema = z.object({
  inviteCode: z.string().trim().min(1),
  nombre: z
    .string()
    .trim()
    .min(2, "Tu nombre es muy corto.")
    .max(60, "Tu nombre es muy largo."),
  apodo: z
    .string()
    .trim()
    .max(30, "El apodo es muy largo.")
    .optional()
    .transform((valor) => (valor ? valor : undefined)),
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

type Campo = "nombre" | "telefono" | "apodo";

export type JoinState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<Campo, string>>;
};

async function obtenerIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "desconocida";
}

/**
 * Inscribe a un jugador en un equipo a partir del código de invitación.
 * Público, sin sesión: la "credencial" acá es conocer el código.
 *
 * Casos borde, todos resueltos acá mismo (ver ROADMAP 4.1):
 * - Teléfono ya existe (juega en otro equipo) → se reusa el Player.
 * - Ya está PENDING en este equipo → se le avisa, no se duplica.
 * - Ya está APPROVED → "ya estás en el plantel".
 * - Estaba REJECTED → puede volver a pedir, vuelve a PENDING.
 * - Código inválido o inactivo → mensaje claro, sin crear nada.
 */
export async function joinTeam(
  _prevState: JoinState,
  formData: FormData,
): Promise<JoinState> {
  const ip = await obtenerIp();
  const dentroDelLimite = await checkRateLimit(`unirse:${ip}`, {
    max: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!dentroDelLimite) {
    return {
      status: "error",
      message: "Muchos intentos seguidos. Espera unos minutos e intenta de nuevo.",
    };
  }

  const parsed = joinSchema.safeParse({
    inviteCode: formData.get("inviteCode"),
    nombre: formData.get("nombre"),
    apodo: formData.get("apodo"),
    telefono: formData.get("telefono"),
  });

  if (!parsed.success) {
    const fieldErrors: JoinState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const campo = issue.path[0];
      if (
        typeof campo === "string" &&
        (campo === "nombre" || campo === "telefono" || campo === "apodo") &&
        !(campo in fieldErrors)
      ) {
        fieldErrors[campo] = issue.message;
      }
    }
    return { status: "error", fieldErrors };
  }

  const { inviteCode, nombre, apodo, telefono } = parsed.data;

  // Se vuelve a resolver el equipo acá, sin confiar en nada que no sea el
  // propio código: el capitán pudo haber regenerado el link entre que se
  // cargó la página y que se mandó el formulario.
  const team = await prisma.team.findUnique({
    where: { inviteCode: inviteCode.toUpperCase() },
  });

  if (!team || !team.inviteActive) {
    return {
      status: "error",
      message: "Este link ya no es válido. Pídele al capitán el link actualizado.",
    };
  }

  const player = await prisma.player.upsert({
    where: { phone: telefono },
    update: { name: nombre },
    create: { name: nombre, phone: telefono },
  });

  const existente = await prisma.teamMember.findUnique({
    where: { teamId_playerId: { teamId: team.id, playerId: player.id } },
  });

  if (existente) {
    if (existente.status === "APPROVED") {
      return {
        status: "success",
        message: "Ya estás en el plantel. ¡Nos vemos en la cancha!",
      };
    }
    if (existente.status === "PENDING") {
      return {
        status: "success",
        message: "Ya habías pedido entrar. Estás esperando que el capitán te apruebe.",
      };
    }
    // Estaba REJECTED: puede volver a pedir.
    await prisma.teamMember.update({
      where: { id: existente.id },
      data: {
        status: "PENDING",
        requestedAt: new Date(),
        decidedAt: null,
        nickname: apodo,
      },
    });
    return {
      status: "success",
      message: "Volviste a pedir entrar. Espera que el capitán te apruebe.",
    };
  }

  await prisma.teamMember.create({
    data: { teamId: team.id, playerId: player.id, status: "PENDING", nickname: apodo },
  });

  return {
    status: "success",
    message: "¡Listo! Quedaste pendiente de aprobación del capitán.",
  };
}
