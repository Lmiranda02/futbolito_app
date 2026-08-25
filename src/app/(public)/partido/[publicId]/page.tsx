import type { Metadata } from "next";

import { AttendanceButtons } from "@/components/match/attendance-buttons";
import { Countdown } from "@/components/match/countdown";
import { formatearFechaChile, yaPaso } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

// El estado de las asistencias cambia todo el tiempo: nunca se puede
// prerenderizar en build ni cachear entre visitas.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Partido",
  // Igual que /unirse: el publicId es la única "llave" del link, no tiene
  // sentido que quede indexado y buscable.
  robots: { index: false, follow: false },
};

const ETIQUETA_ASISTENCIA: Record<string, string> = {
  CONFIRMED: "Va",
  DECLINED: "No va",
  PENDING: "Sin responder",
};

export default async function PartidoPublicoPage(
  props: PageProps<"/partido/[publicId]">,
) {
  const { publicId } = await props.params;

  const match = await prisma.match.findUnique({
    where: { publicId },
    include: { team: true },
  });

  if (!match) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-emerald-600">
            Arma tu Partido
          </p>
          <h1 className="mt-3 text-xl font-semibold">Este link no es válido</h1>
          <p className="mt-2 text-sm opacity-70">
            Puede que el partido ya no exista. Pídele al capitán el link
            actualizado.
          </p>
        </div>
      </main>
    );
  }

  const asistencias = await prisma.attendance.findMany({
    where: { matchId: match.id },
    include: { teamMember: { include: { player: true } } },
    orderBy: { teamMember: { requestedAt: "asc" } },
  });

  // Se decide acá, en el servidor, en el momento exacto en que se arma la
  // página — no en el navegador. La server action vuelve a validar esto
  // de nuevo igual (por si alguien deja la pestaña abierta después de que
  // venza el plazo), pero no tiene sentido ni mostrar los botones si ya
  // se sabe de entrada que no van a funcionar.
  const puedeResponder =
    match.status === "SCHEDULED" && !yaPaso(match.confirmDeadline);

  return (
    <main className="flex flex-1 justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-emerald-600">
            {match.team.name}
          </p>
          <h1 className="mt-3 text-xl font-semibold">
            {match.opponent ? `vs. ${match.opponent}` : "Partido"}
          </h1>
          <p className="mt-2 text-sm opacity-70">
            {formatearFechaChile(match.kickoffAt)}
          </p>
          <p className="text-sm opacity-70">{match.venue}</p>
          {match.slots && (
            <p className="mt-1 text-sm opacity-70">
              Cupo: {match.slots} jugadores
            </p>
          )}
        </div>

        <div className="mt-6 rounded-lg border border-black/10 px-4 py-3 text-center dark:border-white/10">
          {match.status === "CANCELLED" ? (
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              Este partido fue cancelado.
            </p>
          ) : (
            <Countdown hastaIso={match.confirmDeadline.toISOString()} />
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide opacity-70">
            Plantel ({asistencias.length})
          </h2>
          {puedeResponder && (
            <p className="mt-1 text-xs opacity-60">
              Toca Voy o No voy junto a tu nombre.
            </p>
          )}
          <ul className="mt-3 space-y-2">
            {asistencias.map((asistencia) => (
              <li
                key={asistencia.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-black/10 px-4 py-3 dark:border-white/10"
              >
                <span className="min-w-0 truncate font-medium">
                  {asistencia.teamMember.nickname ??
                    asistencia.teamMember.player.name}
                </span>
                {puedeResponder ? (
                  <AttendanceButtons
                    matchId={match.id}
                    teamMemberId={asistencia.teamMemberId}
                    estadoActual={asistencia.status}
                  />
                ) : (
                  <span
                    className={
                      asistencia.status === "CONFIRMED"
                        ? "text-sm font-medium text-emerald-600"
                        : asistencia.status === "DECLINED"
                          ? "text-sm font-medium opacity-50"
                          : "text-sm opacity-60"
                    }
                  >
                    {ETIQUETA_ASISTENCIA[asistencia.status]}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
