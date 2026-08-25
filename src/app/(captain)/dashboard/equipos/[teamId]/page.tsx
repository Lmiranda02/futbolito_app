import type { Metadata } from "next";
import Link from "next/link";

import { CopyLinkButton } from "@/components/share/copy-link-button";
import { InviteQr } from "@/components/share/invite-qr";
import { MemberActions } from "@/components/team/member-actions";
import { RegenerateInviteButton } from "@/components/team/regenerate-invite-button";
import { requireTeamOwnership } from "@/lib/auth";
import { formatearFechaChile } from "@/lib/dates";
import { formatearTelefono } from "@/lib/phone";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Equipo" };

export default async function EquipoPage(
  props: PageProps<"/dashboard/equipos/[teamId]">,
) {
  const { teamId } = await props.params;
  const { team } = await requireTeamOwnership(teamId);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const inviteUrl = `${siteUrl}/unirse/${team.inviteCode}`;

  const [pendientes, plantel, proximosPartidos] = await Promise.all([
    prisma.teamMember.findMany({
      where: { teamId: team.id, status: "PENDING" },
      include: { player: true },
      orderBy: { requestedAt: "asc" },
    }),
    prisma.teamMember.findMany({
      where: { teamId: team.id, status: "APPROVED" },
      include: { player: true },
      orderBy: { requestedAt: "asc" },
    }),
    prisma.match.findMany({
      where: { teamId: team.id, status: "SCHEDULED", kickoffAt: { gt: new Date() } },
      orderBy: { kickoffAt: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-md">
      <Link href="/dashboard" className="text-sm opacity-60 hover:underline">
        ← Mis equipos
      </Link>
      <h1 className="mt-2 text-xl font-semibold">{team.name}</h1>

      <div className="mt-8 rounded-lg border border-black/10 p-6 text-center dark:border-white/10">
        <p className="text-sm font-medium">Invita jugadores con este link</p>

        <div className="mt-4 flex justify-center">
          <InviteQr url={inviteUrl} />
        </div>

        <p className="mt-4 break-all rounded-md bg-black/5 px-3 py-2 font-mono text-xs dark:bg-white/10">
          {inviteUrl}
        </p>

        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <CopyLinkButton text={inviteUrl} />
          <RegenerateInviteButton teamId={team.id} />
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide opacity-70">
            Próximos partidos ({proximosPartidos.length})
          </h2>
          <Link
            href={`/dashboard/equipos/${team.id}/partidos/nuevo`}
            className="shrink-0 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white"
          >
            + Convocar
          </Link>
        </div>

        {proximosPartidos.length === 0 ? (
          <p className="mt-3 text-sm opacity-60">
            Todavía no hay ningún partido convocado.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {proximosPartidos.map((match) => (
              <li key={match.id}>
                <Link
                  href={`/dashboard/equipos/${team.id}/partidos/${match.id}`}
                  className="block rounded-lg border border-black/10 px-4 py-3 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                >
                  <p className="font-medium">
                    {match.opponent ? `vs. ${match.opponent}` : "Partido"}
                  </p>
                  <p className="text-sm opacity-70">
                    {formatearFechaChile(match.kickoffAt)} — {match.venue}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {pendientes.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide opacity-70">
            Pendientes de aprobar ({pendientes.length})
          </h2>
          <ul className="mt-3 space-y-2">
            {pendientes.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-black/10 px-4 py-3 dark:border-white/10"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {member.nickname ?? member.player.name}
                  </p>
                  <p className="text-xs opacity-60">
                    {formatearTelefono(member.player.phone)}
                  </p>
                </div>
                <MemberActions teamMemberId={member.id} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide opacity-70">
          Plantel ({plantel.length})
        </h2>
        {plantel.length === 0 ? (
          <p className="mt-3 text-sm opacity-60">
            Todavía no hay nadie aprobado.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {plantel.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-black/10 px-4 py-3 dark:border-white/10"
              >
                <div>
                  <p className="font-medium">
                    {member.nickname ?? member.player.name}
                    {member.role === "CAPTAIN" && (
                      <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                        Capitán
                      </span>
                    )}
                  </p>
                  <p className="text-xs opacity-60">
                    {formatearTelefono(member.player.phone)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
