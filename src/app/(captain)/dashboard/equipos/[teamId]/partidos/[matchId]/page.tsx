import type { Metadata } from "next";
import Link from "next/link";

import { AutoRefresh } from "@/components/match/auto-refresh";
import { CancelMatchButton } from "@/components/match/cancel-match-button";
import { Countdown } from "@/components/match/countdown";
import { CopyLinkButton } from "@/components/share/copy-link-button";
import { InviteQr } from "@/components/share/invite-qr";
import { requireMatchOwnership } from "@/lib/auth";
import { formatearFechaCorta, yaPaso } from "@/lib/dates";
import { asignarDorsales } from "@/lib/dorsales";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Partido" };

const ESTADO_CHIP: Record<string, { texto: string; className: string }> = {
  SCHEDULED: { texto: "Convocado", className: "bg-lima text-tinta-oscura" },
  CANCELLED: { texto: "Cancelado", className: "bg-rojo text-noche" },
  PLAYED: {
    texto: "Jugado",
    className: "border border-tinta/15 bg-white/10 text-tinta/70",
  },
};

export default async function PartidoPage(
  props: PageProps<"/dashboard/equipos/[teamId]/partidos/[matchId]">,
) {
  const { teamId, matchId } = await props.params;
  const { team, match } = await requireMatchOwnership(teamId, matchId);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const matchUrl = `${siteUrl}/partido/${match.publicId}`;

  const asistencias = await prisma.attendance.findMany({
    where: { matchId: match.id },
    include: { teamMember: { include: { player: true } } },
    orderBy: { teamMember: { requestedAt: "asc" } },
  });

  // Los dorsales se calculan sobre el orden completo del plantel (no por
  // grupo), así que cada uno mantiene el mismo número sin importar en
  // qué columna termine cayendo.
  const dorsales = asignarDorsales(asistencias.map((a) => a.teamMember));
  const filas = asistencias.map((asistencia, i) => ({
    id: asistencia.id,
    dorsal: dorsales[i]!,
    nombre:
      asistencia.teamMember.nickname ?? asistencia.teamMember.player.name,
    estado: asistencia.status,
  }));

  const confirmados = filas.filter((f) => f.estado === "CONFIRMED");
  const noVan = filas.filter((f) => f.estado === "DECLINED");
  const sinResponder = filas.filter((f) => f.estado === "PENDING");

  const grupos = [
    {
      titulo: "Confirmados",
      items: confirmados,
      borde: "border-lima/30",
      fondo: "bg-lima/[0.06]",
      colorEyebrow: "text-lima-clara",
    },
    {
      titulo: "No van",
      items: noVan,
      borde: "border-tinta/12",
      fondo: "bg-white/[0.022]",
      colorEyebrow: "text-tinta/60",
    },
    {
      titulo: "Sin responder",
      items: sinResponder,
      borde: "border-ambar/30",
      fondo: "bg-ambar/[0.06]",
      colorEyebrow: "text-ambar-claro",
    },
  ];

  // Ya no tiene sentido seguir refrescando solo si no puede cambiar nada:
  // ni un partido cancelado ni uno con el plazo vencido van a sumar
  // respuestas nuevas.
  const puedeSeguirCambiando =
    match.status === "SCHEDULED" && !yaPaso(match.confirmDeadline);

  const chip = ESTADO_CHIP[match.status] ?? {
    texto: match.status,
    className: "border border-tinta/15 text-tinta/70",
  };

  return (
    <div className="mx-auto w-full max-w-[1120px]">
      {puedeSeguirCambiando && <AutoRefresh />}

      <Link
        href={`/dashboard/equipos/${team.id}`}
        className="font-mono text-[12px] text-tinta/50 hover:text-tinta/70"
      >
        ← {team.name}
      </Link>

      <div className="cartel-partido animar-subir mt-4 overflow-hidden rounded-[22px] border border-[rgba(200,255,180,0.16)]">
        <div className="flex flex-wrap items-start gap-6 p-7">
          <div className="min-w-[260px] flex-1">
            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-[11px] py-[5px] font-mono text-[10px] uppercase ${chip.className}`}
              >
                {chip.texto}
              </span>
              <span className="font-mono text-[11px] text-tinta/45">
                {formatearFechaCorta(match.kickoffAt)}
              </span>
            </div>
            <h1 className="mt-2 text-[clamp(30px,4.4vw,46px)] leading-none font-extrabold tracking-[-0.035em] text-tinta">
              {match.opponent ? `vs. ${match.opponent}` : "Partido"}
            </h1>
            <p className="mt-2 text-[15px] text-tinta/60">
              {match.venue}
              {match.slots ? ` · cupo para ${match.slots}` : ""}
            </p>

            {match.status === "SCHEDULED" && (
              <div className="mt-4 flex flex-wrap gap-[10px]">
                <Link
                  href={`/dashboard/equipos/${team.id}/partidos/${match.id}/editar`}
                  className="boton-fantasma px-[18px] py-[12px] text-[14px]"
                >
                  Editar partido
                </Link>
                <CancelMatchButton teamId={team.id} matchId={match.id} />
              </div>
            )}
          </div>

          {match.status === "SCHEDULED" && (
            <div className="min-w-[230px] rounded-2xl border border-lima/20 bg-black/40 px-[22px] py-[18px] text-center">
              <p className="font-mono text-[11px] tracking-[0.16em] text-lima uppercase">
                Cierra la lista en
              </p>
              <div className="mt-1">
                <Countdown
                  hastaIso={match.confirmDeadline.toISOString()}
                  mensajeVencido="La lista está cerrada"
                  tamano={34}
                />
              </div>
              {!yaPaso(match.confirmDeadline) && (
                <p className="mt-1 text-[13px] text-tinta/50">
                  Después de eso nadie cambia su respuesta.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 border-t border-tinta/10">
          <div className="border-r border-tinta/[0.08] px-4 py-5 text-center">
            <p className="font-mono text-[42px] leading-none font-semibold tracking-[-0.03em] text-lima-clara">
              {String(confirmados.length).padStart(2, "0")}
            </p>
            <p className="mt-1 font-mono text-[11px] tracking-[0.14em] text-tinta/45 uppercase">
              Confirmados
            </p>
          </div>
          <div className="border-r border-tinta/[0.08] px-4 py-5 text-center">
            <p className="font-mono text-[42px] leading-none font-semibold tracking-[-0.03em] text-tinta">
              {String(noVan.length).padStart(2, "0")}
            </p>
            <p className="mt-1 font-mono text-[11px] tracking-[0.14em] text-tinta/45 uppercase">
              No van
            </p>
          </div>
          <div className="px-4 py-5 text-center">
            <p className="font-mono text-[42px] leading-none font-semibold tracking-[-0.03em] text-tinta/45">
              {String(sinResponder.length).padStart(2, "0")}
            </p>
            <p className="mt-1 font-mono text-[11px] tracking-[0.14em] text-tinta/45 uppercase">
              Sin responder
            </p>
          </div>
        </div>
      </div>

      {asistencias.length === 0 ? (
        <p className="animar-subir [animation-delay:.05s] mt-8 text-sm text-tinta/50">
          Todavía no hay nadie en el plantel para convocar a este partido.
        </p>
      ) : (
        <div className="animar-subir [animation-delay:.05s] mt-4 grid grid-cols-[repeat(auto-fit,minmax(290px,1fr))] gap-4">
          {grupos.map(({ titulo, items, borde, fondo, colorEyebrow }) => (
            <div
              key={titulo}
              className={`rounded-[18px] border ${borde} ${fondo} p-5`}
            >
              <p
                className={`font-mono text-[11px] tracking-[0.14em] uppercase ${colorEyebrow}`}
              >
                {titulo} · {items.length}
              </p>
              {items.length === 0 ? (
                <p className="mt-3 text-sm text-tinta/45">Nadie por acá.</p>
              ) : (
                <ul className="mt-2">
                  {items.map((fila) => (
                    <li
                      key={fila.id}
                      className="flex items-center gap-3 border-b border-tinta/[0.07] px-1 py-[9px] last:border-b-0"
                    >
                      <span className="w-[22px] shrink-0 font-mono text-[13px] text-tinta/55">
                        {fila.dorsal}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-tinta">
                        {fila.nombre}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="animar-subir [animation-delay:.1s] mt-4 flex flex-wrap items-center gap-[18px] rounded-[18px] border border-tinta/12 bg-white/[0.022] p-5">
        <InviteQr url={matchUrl} tamano="chico" />
        <div className="min-w-[200px] flex-1">
          <p className="text-[16px] font-bold text-tinta">
            Pásale el link del partido al grupo
          </p>
          <p className="mt-1 font-mono text-[12px] break-all text-tinta/55">
            {matchUrl}
          </p>
        </div>
        <CopyLinkButton text={matchUrl} />
      </div>
    </div>
  );
}
