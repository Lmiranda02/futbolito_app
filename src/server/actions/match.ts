"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireTeamOwnership } from "@/lib/auth";
import { generarPublicId } from "@/lib/codes";
import { horaLocalChileAUtc } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

const fechaSchema = z
  .string()
  .trim()
  .min(1, "Elige fecha y hora.")
  .transform((valor, ctx) => {
    const fecha = horaLocalChileAUtc(valor);
    if (Number.isNaN(fecha.getTime())) {
      ctx.addIssue({ code: "custom", message: "Fecha inválida." });
      return z.NEVER;
    }
    return fecha;
  });

const crearPartidoSchema = z
  .object({
    venue: z
      .string()
      .trim()
      .min(2, "Ingresa dónde se juega.")
      .max(120, "El nombre de la cancha es muy largo."),
    opponent: z
      .string()
      .trim()
      .max(80, "El nombre del rival es muy largo.")
      .optional()
      .transform((valor) => (valor ? valor : undefined)),
    slots: z
      .string()
      .trim()
      .optional()
      .transform((valor, ctx) => {
        if (!valor) return undefined;
        const numero = Number(valor);
        if (!Number.isInteger(numero) || numero < 1) {
          ctx.addIssue({
            code: "custom",
            message: "El cupo tiene que ser un número entero mayor a 0.",
          });
          return z.NEVER;
        }
        return numero;
      }),
    kickoffAt: fechaSchema,
    confirmDeadline: fechaSchema,
  })
  .superRefine((data, ctx) => {
    if (data.kickoffAt.getTime() <= Date.now()) {
      ctx.addIssue({
        code: "custom",
        path: ["kickoffAt"],
        message: "El partido tiene que ser en el futuro.",
      });
    }
    if (data.confirmDeadline.getTime() >= data.kickoffAt.getTime()) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmDeadline"],
        message: "La hora límite tiene que ser antes del partido.",
      });
    }
  });

type Campo = "venue" | "opponent" | "slots" | "kickoffAt" | "confirmDeadline";

export type CrearPartidoState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Partial<Record<Campo, string>>;
};

/**
 * Convoca un partido nuevo. En la misma transacción, crea una asistencia
 * PENDING por cada jugador ya aprobado del plantel — así "pendiente" es un
 * dato real desde el minuto uno, y no algo que se calcula después (ver la
 * nota de diseño del modelo de datos en el ROADMAP, bloque 1).
 */
export async function crearPartido(
  teamId: string,
  _prevState: CrearPartidoState,
  formData: FormData,
): Promise<CrearPartidoState> {
  const { team } = await requireTeamOwnership(teamId);

  const parsed = crearPartidoSchema.safeParse({
    venue: formData.get("venue"),
    opponent: formData.get("opponent"),
    slots: formData.get("slots"),
    kickoffAt: formData.get("kickoffAt"),
    confirmDeadline: formData.get("confirmDeadline"),
  });

  if (!parsed.success) {
    const fieldErrors: CrearPartidoState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const campo = issue.path[0];
      if (typeof campo === "string" && !(campo in fieldErrors)) {
        fieldErrors[campo as Campo] = issue.message;
      }
    }
    return { status: "error", fieldErrors };
  }

  const { venue, opponent, slots, kickoffAt, confirmDeadline } = parsed.data;

  let match = null;
  for (let intento = 0; intento < 5 && !match; intento++) {
    const publicId = generarPublicId();
    try {
      match = await prisma.$transaction(async (tx) => {
        const nuevoPartido = await tx.match.create({
          data: {
            teamId: team.id,
            publicId,
            venue,
            opponent,
            slots,
            kickoffAt,
            confirmDeadline,
          },
        });

        const plantel = await tx.teamMember.findMany({
          where: { teamId: team.id, status: "APPROVED" },
          select: { id: true },
        });

        if (plantel.length > 0) {
          await tx.attendance.createMany({
            data: plantel.map((member) => ({
              matchId: nuevoPartido.id,
              teamMemberId: member.id,
              status: "PENDING" as const,
            })),
          });
        }

        return nuevoPartido;
      });
    } catch (error) {
      const esChoqueDeCodigo =
        error !== null &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2002";
      if (!esChoqueDeCodigo) throw error;
      // Sigue el loop y prueba con un publicId nuevo.
    }
  }

  if (!match) {
    console.error("[crearPartido] no se pudo generar un publicId único tras 5 intentos");
    return {
      status: "error",
      message: "No pudimos crear el partido. Intenta de nuevo en un momento.",
    };
  }

  revalidatePath(`/dashboard/equipos/${team.id}`);
  redirect(`/dashboard/equipos/${team.id}`);
}
