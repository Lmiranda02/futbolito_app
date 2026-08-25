import type { Metadata } from "next";
import Link from "next/link";

import { EditMatchForm } from "@/components/match/edit-match-form";
import { requireMatchOwnership } from "@/lib/auth";
import { utcADatetimeLocalChile } from "@/lib/dates";

export const metadata: Metadata = { title: "Editar partido" };

export default async function EditarPartidoPage(
  props: PageProps<"/dashboard/equipos/[teamId]/partidos/[matchId]/editar">,
) {
  const { teamId, matchId } = await props.params;
  const { team, match } = await requireMatchOwnership(teamId, matchId);

  return (
    <div className="mx-auto max-w-md">
      <Link
        href={`/dashboard/equipos/${team.id}/partidos/${match.id}`}
        className="text-sm opacity-60 hover:underline"
      >
        ← Volver al partido
      </Link>
      <h1 className="mt-2 text-xl font-semibold">Editar partido</h1>

      {match.status !== "SCHEDULED" ? (
        <p className="mt-4 text-sm opacity-70">
          Este partido ya no se puede editar.
        </p>
      ) : (
        <EditMatchForm
          teamId={team.id}
          matchId={match.id}
          valoresIniciales={{
            venue: match.venue,
            opponent: match.opponent ?? "",
            slots: match.slots?.toString() ?? "",
            kickoffAt: utcADatetimeLocalChile(match.kickoffAt),
            confirmDeadline: utcADatetimeLocalChile(match.confirmDeadline),
          }}
        />
      )}
    </div>
  );
}
