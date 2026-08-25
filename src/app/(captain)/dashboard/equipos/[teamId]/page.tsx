import type { Metadata } from "next";
import Link from "next/link";

import { CopyLinkButton } from "@/components/share/copy-link-button";
import { InviteQr } from "@/components/share/invite-qr";
import { MemberActions } from "@/components/team/member-actions";
import { RegenerateInviteButton } from "@/components/team/regenerate-invite-button";
import { TeamCrest } from "@/components/team/team-crest";
import { requireTeamOwnership } from "@/lib/auth";
import { formatearFechaCorta } from "@/lib/dates";
import { asignarDorsales } from "@/lib/dorsales";
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

  const dorsalesPlantel = asignarDorsales(plantel);

  const resumenPlantel = [
    `${plantel.length} en el plantel`,
    pendientes.length > 0
      ? `${pendientes.length} esperando el visto bueno`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto w-full max-w-[1120px]">
      <Link
        href="/dashboard"
        className="font-mono text-[12px] text-tinta/50 hover:text-tinta/70"
      >
        ← Mis equipos
      </Link>

      <div className="animar-subir mt-4 flex items-center gap-4">
        <TeamCrest name={team.name} teamId={team.id} size={56} />
        <div className="min-w-0">
          <h1 className="truncate text-[36px] leading-tight font-extrabold tracking-[-0.03em] text-tinta">
            {team.name}
          </h1>
          <p className="font-mono text-[12px] text-tinta/45">{resumenPlantel}</p>
        </div>
      </div>

      <div className="animar-subir [animation-delay:.05s] mt-8 grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-start gap-4">
        {/* Columna izquierda — Puerta de entrada */}
        <div className="rounded-[20px] border border-[rgba(200,255,180,0.18)] bg-[linear-gradient(165deg,rgba(200,255,180,0.07),rgba(255,255,255,0.015))] p-[26px] text-center">
          <p className="font-mono text-[11px] tracking-[0.18em] text-lima uppercase">
            Puerta de entrada
          </p>
          <h2 className="mt-1 text-[19px] font-bold text-tinta">
            Que escaneen y se anoten
          </h2>

          <div className="mt-4 flex justify-center">
            <InviteQr url={inviteUrl} tamano="grande" />
          </div>

          <p className="mt-4 rounded-[10px] border border-tinta/10 bg-black/35 px-[13px] py-[11px] font-mono text-[12px] break-all text-tinta/62">
            {inviteUrl}
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-[10px]">
            <CopyLinkButton text={inviteUrl} className="min-w-[130px] flex-1" />
            <RegenerateInviteButton teamId={team.id} />
          </div>
        </div>

        {/* Columna derecha — tres tarjetas apiladas */}
        <div className="flex flex-col gap-4">
          {/* Golpeando la puerta */}
          <div
            className={
              "rounded-[18px] p-5 " +
              (pendientes.length > 0
                ? "border border-ambar/35 bg-ambar/[0.07]"
                : "border border-tinta/12 bg-white/[0.022]")
            }
          >
            <p
              className={
                "font-mono text-[11px] tracking-[0.16em] uppercase " +
                (pendientes.length > 0 ? "text-ambar-claro" : "text-tinta/50")
              }
            >
              Golpeando la puerta
              {pendientes.length > 0 ? ` · ${pendientes.length}` : ""}
            </p>
            {pendientes.length === 0 ? (
              <p className="mt-3 text-sm text-tinta/50">
                Nadie esperando. Plantel al día.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {pendientes.map((member) => (
                  <MemberActions
                    key={member.id}
                    teamMemberId={member.id}
                    nombre={member.nickname ?? member.player.name}
                    telefono={formatearTelefono(member.player.phone)}
                  />
                ))}
              </ul>
            )}
          </div>

          {/* Próximos partidos */}
          <div className="rounded-[18px] border border-tinta/12 bg-white/[0.022] p-5">
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-mono text-[11px] tracking-[0.14em] text-tinta/50 uppercase">
                Próximos partidos · {proximosPartidos.length}
              </p>
              <Link
                href={`/dashboard/equipos/${team.id}/partidos/nuevo`}
                className="boton-primario ml-auto px-[22px] py-[15px] text-[15px]"
              >
                + Convocar
              </Link>
            </div>

            {proximosPartidos.length === 0 ? (
              <p className="mt-3 text-sm text-tinta/50">
                Todavía no hay ningún partido convocado.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {proximosPartidos.map((match) => (
                  <li key={match.id}>
                    <Link
                      href={`/dashboard/equipos/${team.id}/partidos/${match.id}`}
                      className="block rounded-xl border border-tinta/12 px-[15px] py-[13px] transition-colors hover:border-lima/45 hover:bg-white/5"
                    >
                      <p className="text-[16px] font-bold text-tinta">
                        {match.opponent ? `vs. ${match.opponent}` : "Partido"}
                      </p>
                      <p className="text-[13px] text-tinta/55">
                        {formatearFechaCorta(match.kickoffAt)} · {match.venue}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Plantel */}
          <div className="rounded-[18px] border border-tinta/12 bg-white/[0.022] p-5">
            <p className="font-mono text-[11px] tracking-[0.14em] text-tinta/50 uppercase">
              Plantel · {plantel.length}
            </p>
            {plantel.length === 0 ? (
              <p className="mt-3 text-sm text-tinta/50">
                Todavía no hay nadie aprobado.
              </p>
            ) : (
              <ul className="mt-2">
                {plantel.map((member, i) => (
                  <li
                    key={member.id}
                    className="flex items-center gap-3 border-b border-tinta/[0.07] px-1 py-[9px] last:border-b-0"
                  >
                    <span className="w-[22px] shrink-0 font-mono text-[13px] text-tinta/55">
                      {dorsalesPlantel[i]}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-tinta">
                      {member.nickname ?? member.player.name}
                    </span>
                    {member.role === "CAPTAIN" && (
                      <span className="shrink-0 rounded-full bg-lima px-2 py-[3px] font-mono text-[10px] tracking-[0.1em] text-tinta-oscura uppercase">
                        Capitán
                      </span>
                    )}
                    <span className="shrink-0 font-mono text-[11px] text-tinta/55">
                      {formatearTelefono(member.player.phone)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
