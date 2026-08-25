import type { Metadata } from "next";
import Link from "next/link";

import { AutoRefresh } from "@/components/match/auto-refresh";
import { CancelMatchButton } from "@/components/match/cancel-match-button";
import { CopyLinkButton } from "@/components/share/copy-link-button";
import { InviteQr } from "@/components/share/invite-qr";
import { requireMatchOwnership } from "@/lib/auth";
import { formatearFechaChile, yaPaso } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Partido" };

const ETIQUETA_ESTADO: Record<string, string> = {
  SCHEDULED: "Convocado",
  CANCELLED: "Cancelado",
  PLAYED: "Jugado",
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

  const confirmados = asistencias.filter((a) => a.status === "CONFIRMED");
  const noVan = asistencias.filter((a) => a.status === "DECLINED");
  const pendientes = asistencias.filter((a) => a.status === "PENDING");

  const grupos = [
    { titulo: "Confirmados", items: confirmados },
    { titulo: "No van", items: noVan },
    { titulo: "Pendientes", items: pendientes },
  ];

  // Ya no tiene sentido seguir refrescando solo si no puede cambiar nada:
  // ni un partido cancelado ni uno con el plazo vencido van a sumar
  // respuestas nuevas.
  const puedeSeguirCambiando =
    match.status === "SCHEDULED" && !yaPaso(match.confirmDeadline);

  return (
    <div className="mx-auto max-w-md">
      {puedeSeguirCambiando && <AutoRefresh />}

      <Link
        href={`/dashboard/equipos/${team.id}`}
        className="text-sm opacity-60 hover:underline"
      >
        ← {team.name}
      </Link>

      <div className="mt-2 flex items-start justify-between gap-3">
        <h1 className="text-xl font-semibold">
          {match.opponent ? `vs. ${match.opponent}` : "Partido"}
        </h1>
        <span className="shrink-0 rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium dark:bg-white/10">
          {ETIQUETA_ESTADO[match.status] ?? match.status}
        </span>
      </div>
      <p className="mt-1 text-sm opacity-70">
        {formatearFechaChile(match.kickoffAt)} — {match.venue}
      </p>
      <p className="text-sm opacity-70">
        Confirmar hasta: {formatearFechaChile(match.confirmDeadline)}
      </p>
      {match.slots && (
        <p className="text-sm opacity-70">
          Cupo: {confirmados.length} / {match.slots}
        </p>
      )}

      {match.status === "SCHEDULED" && (
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/dashboard/equipos/${team.id}/partidos/${match.id}/editar`}
            className="rounded-md border border-black/15 px-4 py-2.5 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            Editar partido
          </Link>
          <CancelMatchButton teamId={team.id} matchId={match.id} />
        </div>
      )}

      <div className="mt-8 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-black/10 py-3 dark:border-white/10">
          <p className="text-2xl font-semibold text-emerald-600">
            {confirmados.length}
          </p>
          <p className="text-xs opacity-60">Confirmados</p>
        </div>
        <div className="rounded-lg border border-black/10 py-3 dark:border-white/10">
          <p className="text-2xl font-semibold">{noVan.length}</p>
          <p className="text-xs opacity-60">No van</p>
        </div>
        <div className="rounded-lg border border-black/10 py-3 dark:border-white/10">
          <p className="text-2xl font-semibold opacity-60">
            {pendientes.length}
          </p>
          <p className="text-xs opacity-60">Pendientes</p>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-black/10 p-6 text-center dark:border-white/10">
        <p className="text-sm font-medium">Comparte el link de este partido</p>

        <div className="mt-4 flex justify-center">
          <InviteQr url={matchUrl} />
        </div>

        <p className="mt-4 break-all rounded-md bg-black/5 px-3 py-2 font-mono text-xs dark:bg-white/10">
          {matchUrl}
        </p>

        <div className="mt-4 flex justify-center">
          <CopyLinkButton text={matchUrl} />
        </div>
      </div>

      {asistencias.length === 0 ? (
        <p className="mt-8 text-sm opacity-60">
          Todavía no hay nadie en el plantel para convocar a este partido.
        </p>
      ) : (
        grupos.map(
          ({ titulo, items }) =>
            items.length > 0 && (
              <div key={titulo} className="mt-8">
                <h2 className="text-sm font-semibold uppercase tracking-wide opacity-70">
                  {titulo} ({items.length})
                </h2>
                <ul className="mt-3 space-y-2">
                  {items.map((attendance) => (
                    <li
                      key={attendance.id}
                      className="rounded-lg border border-black/10 px-4 py-3 dark:border-white/10"
                    >
                      <p className="font-medium">
                        {attendance.teamMember.nickname ??
                          attendance.teamMember.player.name}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ),
        )
      )}
    </div>
  );
}
