import type { Metadata } from "next";

import { AttendanceList, type FilaAsistencia } from "@/components/match/attendance-list";
import { Countdown } from "@/components/match/countdown";
import { TeamCrest } from "@/components/team/team-crest";
import { formatearFechaCorta, yaPaso } from "@/lib/dates";
import { asignarDorsales } from "@/lib/dorsales";
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
      <main className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="animar-subir w-full max-w-[440px] text-center">
          <p className="font-mono text-[11px] tracking-[0.2em] text-lima uppercase">
            Arma tu Partido
          </p>
          <h1 className="mt-3 text-xl font-bold text-tinta">
            Este link no es válido
          </h1>
          <p className="mt-2 text-sm text-tinta/60">
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

  const dorsales = asignarDorsales(asistencias.map((a) => a.teamMember));
  const filas: FilaAsistencia[] = asistencias.map((asistencia, i) => ({
    id: asistencia.id,
    teamMemberId: asistencia.teamMemberId,
    dorsal: dorsales[i]!,
    nombre: asistencia.teamMember.nickname ?? asistencia.teamMember.player.name,
    estado: asistencia.status,
  }));

  return (
    <main className="flex flex-1 justify-center px-5 py-[34px]">
      <div className="w-full max-w-[440px]">
        <div className="animar-subir text-center">
          <TeamCrest
            name={match.team.name}
            teamId={match.team.id}
            size={48}
          />
          <p className="mt-3 font-mono text-[11px] tracking-[0.2em] text-lima uppercase">
            {match.team.name}
          </p>
          <h1 className="mt-1 text-[32px] leading-[1.05] font-extrabold tracking-[-0.03em] text-tinta text-balance">
            {match.opponent ? `vs. ${match.opponent}` : "Partido"}
          </h1>
          <p className="mt-3 text-[15px] text-tinta/62">
            {formatearFechaCorta(match.kickoffAt)}
          </p>
          <p className="text-[15px] text-tinta/62">{match.venue}</p>
        </div>

        <div className="animar-subir [animation-delay:.05s] mt-6 rounded-2xl border border-lima/30 bg-lima/[0.08] px-[18px] py-[18px] text-center">
          {match.status === "CANCELLED" ? (
            <p className="text-sm font-medium text-rojo">
              Este partido fue cancelado.
            </p>
          ) : (
            <>
              <p className="font-mono text-[11px] tracking-[0.18em] text-lima uppercase">
                Tienes hasta
              </p>
              <div className="mt-1">
                <Countdown hastaIso={match.confirmDeadline.toISOString()} />
              </div>
              {puedeResponder && (
                <p className="mt-1 text-[13px] text-tinta/50">
                  para decir si vas o no.
                </p>
              )}
            </>
          )}
        </div>

        <div className="animar-subir [animation-delay:.1s] mt-8">
          {/* La lista propiamente tal — incluye el marcador "{n}/{cupo}
              van", que sube al instante al tocar Voy/No voy. */}
          <AttendanceList
            matchId={match.id}
            filasIniciales={filas}
            cupo={match.slots}
            puedeResponder={puedeResponder}
          />
        </div>
      </div>
    </main>
  );
}
