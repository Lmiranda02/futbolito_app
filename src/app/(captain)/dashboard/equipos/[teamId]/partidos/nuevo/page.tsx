import type { Metadata } from "next";
import Link from "next/link";

import { CreateMatchForm } from "@/components/match/create-match-form";
import { requireTeamOwnership } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Nuevo partido" };

export default async function NuevoPartidoPage(
  props: PageProps<"/dashboard/equipos/[teamId]/partidos/nuevo">,
) {
  const { teamId } = await props.params;
  const { team } = await requireTeamOwnership(teamId);

  const plantelCount = await prisma.teamMember.count({
    where: { teamId: team.id, status: "APPROVED" },
  });

  return (
    <div className="mx-auto w-full max-w-[560px]">
      <Link
        href={`/dashboard/equipos/${team.id}`}
        className="font-mono text-[12px] text-tinta/50 hover:text-tinta/70"
      >
        ← {team.name}
      </Link>
      <h1 className="animar-subir mt-3 text-[38px] font-extrabold tracking-[-0.03em] text-tinta">
        Convoca un partido
      </h1>
      <p className="animar-subir mt-2 max-w-[46ch] text-[15px] text-tinta/60">
        Al guardar le queda una asistencia pendiente a cada uno de los{" "}
        {plantelCount} del plantel. Después solo pasas el link.
      </p>

      <CreateMatchForm teamId={team.id} />
    </div>
  );
}
