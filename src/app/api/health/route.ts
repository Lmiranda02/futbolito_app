import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// Sin esto Next.js podría cachear la respuesta en el build y el healthcheck
// dejaría de comprobar nada.
export const dynamic = "force-dynamic";

/**
 * Healthcheck: confirma que la app puede hablar con la base de datos.
 * Sirve sobre todo en Vercel, donde la conexión pasa por el pooler y es el
 * punto que más suele fallar al configurar el proyecto.
 */
export async function GET() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "ok",
      database: "conectada",
      latenciaMs: Date.now() - startedAt,
    });
  } catch (error) {
    console.error("[healthcheck] falló la conexión a la base:", error);

    // No devolvemos el mensaje del error: puede incluir el string de conexión
    // con la contraseña. El detalle queda en los logs del servidor.
    return NextResponse.json(
      {
        status: "error",
        database: "sin conexión",
        latenciaMs: Date.now() - startedAt,
      },
      { status: 503 },
    );
  }
}
