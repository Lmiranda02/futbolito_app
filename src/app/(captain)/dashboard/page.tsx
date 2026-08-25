import type { Metadata } from "next";
import Link from "next/link";

import { requireCaptain } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Mis equipos",
};

export default async function DashboardPage() {
  const captain = await requireCaptain();

  const teams = await prisma.team.findMany({
    where: { captainId: captain.id },
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: { members: { where: { status: "APPROVED" } } },
      },
    },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">
          Hola{captain.name ? `, ${captain.name}` : ""}
        </h1>
        <Link
          href="/dashboard/equipos/nuevo"
          className="shrink-0 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white"
        >
          + Nuevo equipo
        </Link>
      </div>

      {teams.length === 0 ? (
        <div className="mt-10 rounded-lg border border-dashed border-black/15 px-6 py-10 text-center dark:border-white/20">
          <p className="text-sm opacity-70">
            Todavía no armaste ningún equipo.
          </p>
          <Link
            href="/dashboard/equipos/nuevo"
            className="mt-4 inline-block rounded-md bg-emerald-600 px-4 py-3 text-base font-medium text-white"
          >
            Crear mi primer equipo
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {teams.map((team) => (
            <li key={team.id}>
              <Link
                href={`/dashboard/equipos/${team.id}`}
                className="flex items-center justify-between rounded-lg border border-black/10 px-4 py-3 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
              >
                <span className="font-medium">{team.name}</span>
                <span className="text-sm opacity-60">
                  {team._count.members} en el plantel
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
