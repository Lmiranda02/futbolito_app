import type { Metadata } from "next";
import Link from "next/link";

import { TeamCrest } from "@/components/team/team-crest";
import { requireCaptain } from "@/lib/auth";
import { formatearDiaHora } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Mis equipos",
};

// Fútbol 7: con 7 confirmados ya se puede jugar, pero sin ningún margen
// para que alguien se baje a última hora — de ahí el chip de "atención"
// en vez del verde de "todo bien".
const MINIMO_FUTBOL_7 = 7;

const NUMEROS = [
  "cero",
  "un",
  "dos",
  "tres",
  "cuatro",
  "cinco",
  "seis",
  "siete",
  "ocho",
  "nueve",
  "diez",
];

function enPalabras(n: number): string {
  return NUMEROS[n] ?? String(n);
}

/**
 * El subtítulo de la cabecera cambia según lo que realmente hay que
 * saber hoy: si no hay equipos, ya se está mostrando el estado vacío
 * general; si nadie tiene un partido convocado, no tiene sentido
 * mencionar partidos.
 */
function generarSubtitulo(
  cantidadEquipos: number,
  proximos: { fecha: Date }[],
): string {
  const palabra = enPalabras(cantidadEquipos);
  const equipoTexto =
    cantidadEquipos === 1
      ? "Un equipo al hombro"
      : `${palabra[0]!.toUpperCase()}${palabra.slice(1)} equipos al hombro`;

  if (proximos.length === 0) {
    return `${equipoTexto}, sin partidos convocados por ahora.`;
  }

  if (proximos.length === 1) {
    const dia = formatearDiaHora(proximos[0]!.fecha).split(" ")[0]!.toLowerCase();
    return `${equipoTexto} y un partido el ${dia}.`;
  }

  return `${equipoTexto} y ${enPalabras(proximos.length)} partidos convocados.`;
}

export default async function DashboardPage() {
  const captain = await requireCaptain();
  const primerNombre = captain.name?.trim().split(/\s+/)[0];

  const teams = await prisma.team.findMany({
    where: { captainId: captain.id },
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: { members: { where: { status: "APPROVED" } } },
      },
      members: {
        where: { status: "PENDING" },
        select: { id: true },
      },
      matches: {
        where: { status: "SCHEDULED", kickoffAt: { gt: new Date() } },
        orderBy: { kickoffAt: "asc" },
        take: 1,
        include: {
          _count: {
            select: { attendances: { where: { status: "CONFIRMED" } } },
          },
        },
      },
    },
  });

  const tarjetas = teams.map((team) => {
    const proximo = team.matches[0];
    return {
      id: team.id,
      name: team.name,
      plantel: team._count.members,
      pendientes: team.members.length,
      proximo: proximo
        ? {
            fecha: proximo.kickoffAt,
            venue: proximo.venue,
            confirmados: proximo._count.attendances,
            cupo: proximo.slots,
          }
        : null,
    };
  });

  const proximosPartidos = tarjetas.flatMap((t) =>
    t.proximo ? [{ fecha: t.proximo.fecha }] : [],
  );

  return (
    <div className="mx-auto w-full max-w-[1120px]">
      <div className="animar-subir flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] tracking-[0.2em] text-lima uppercase">
            Tus banquillos
          </p>
          <h1 className="mt-1 text-[40px] leading-tight font-extrabold tracking-[-0.03em] text-tinta">
            Hola{primerNombre ? `, ${primerNombre}` : ""}
          </h1>
          {teams.length > 0 && (
            <p className="mt-1 text-[15px] text-tinta/58">
              {generarSubtitulo(teams.length, proximosPartidos)}
            </p>
          )}
        </div>
        <Link
          href="/dashboard/equipos/nuevo"
          className="boton-primario shrink-0 px-[22px] py-[15px] text-[15px]"
        >
          + Nuevo equipo
        </Link>
      </div>

      {teams.length === 0 ? (
        <div className="animar-subir [animation-delay:.05s] mt-8 rounded-[18px] border border-dashed border-tinta/18 px-6 py-12 text-center">
          <p className="text-sm text-tinta/60">
            Todavía no armaste ningún equipo.
          </p>
          <Link
            href="/dashboard/equipos/nuevo"
            className="boton-primario mt-4 inline-block px-[22px] py-[15px] text-[15px]"
          >
            Crear mi primer equipo
          </Link>
        </div>
      ) : (
        <ul className="animar-subir [animation-delay:.05s] mt-[26px] grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-[14px]">
          {tarjetas.map((tarjeta) => (
            <li key={tarjeta.id}>
              <Link
                href={`/dashboard/equipos/${tarjeta.id}`}
                className="block rounded-[18px] border border-tinta/12 bg-[linear-gradient(160deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015))] p-[22px] transition-colors hover:border-lima/45 hover:bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <TeamCrest name={tarjeta.name} teamId={tarjeta.id} size={40} />
                  <div className="min-w-0">
                    <p className="truncate text-[18px] font-bold tracking-[-0.015em] text-tinta">
                      {tarjeta.name}
                    </p>
                    <p className="font-mono text-[12px] text-tinta/45">
                      {tarjeta.plantel} en el plantel
                    </p>
                  </div>
                </div>

                <p className="mt-[18px] text-[14px] text-tinta/60">
                  {tarjeta.proximo
                    ? `${formatearDiaHora(tarjeta.proximo.fecha)} · ${tarjeta.proximo.venue}`
                    : "Sin partido convocado todavía"}
                </p>

                <div className="mt-[14px] flex flex-wrap gap-2">
                  {tarjeta.pendientes > 0 && (
                    <span className="rounded-full border border-ambar/40 bg-ambar/[0.12] px-[11px] py-[5px] font-mono text-[11px] text-ambar">
                      {tarjeta.pendientes} por aprobar
                    </span>
                  )}
                  {tarjeta.proximo &&
                    (tarjeta.proximo.confirmados <= MINIMO_FUTBOL_7 ? (
                      <span className="rounded-full border border-ambar/40 bg-ambar/[0.12] px-[11px] py-[5px] font-mono text-[11px] text-ambar">
                        justo con {tarjeta.proximo.confirmados}
                      </span>
                    ) : (
                      <span className="rounded-full border border-lima/35 bg-lima/10 px-[11px] py-[5px] font-mono text-[11px] text-lima-clara">
                        {tarjeta.proximo.confirmados}
                        {tarjeta.proximo.cupo ? `/${tarjeta.proximo.cupo}` : ""}{" "}
                        confirmados
                      </span>
                    ))}
                  {tarjeta.pendientes === 0 && !tarjeta.proximo && (
                    <span className="rounded-full border border-tinta/18 px-[11px] py-[5px] font-mono text-[11px] text-tinta/60">
                      plantel al día
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
