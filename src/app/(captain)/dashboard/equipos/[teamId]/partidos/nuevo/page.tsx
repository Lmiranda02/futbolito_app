import type { Metadata } from "next";
import Link from "next/link";

import { CreateMatchForm } from "@/components/match/create-match-form";
import { requireTeamOwnership } from "@/lib/auth";

export const metadata: Metadata = { title: "Nuevo partido" };

export default async function NuevoPartidoPage(
  props: PageProps<"/dashboard/equipos/[teamId]/partidos/nuevo">,
) {
  const { teamId } = await props.params;
  const { team } = await requireTeamOwnership(teamId);

  return (
    <div className="mx-auto max-w-md">
      <Link
        href={`/dashboard/equipos/${team.id}`}
        className="text-sm opacity-60 hover:underline"
      >
        ← {team.name}
      </Link>
      <h1 className="mt-2 text-xl font-semibold">Convoca un partido</h1>
      <p className="mt-2 text-sm opacity-70">
        Se va a armar una asistencia pendiente para cada jugador que ya esté
        en el plantel.
      </p>

      <CreateMatchForm teamId={team.id} />
    </div>
  );
}
