import type { Metadata } from "next";
import Link from "next/link";

import { CopyLinkButton } from "@/components/share/copy-link-button";
import { InviteQr } from "@/components/share/invite-qr";
import { RegenerateInviteButton } from "@/components/team/regenerate-invite-button";
import { requireTeamOwnership } from "@/lib/auth";

export const metadata: Metadata = { title: "Equipo" };

export default async function EquipoPage(
  props: PageProps<"/dashboard/equipos/[teamId]">,
) {
  const { teamId } = await props.params;
  const { team } = await requireTeamOwnership(teamId);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const inviteUrl = `${siteUrl}/unirse/${team.inviteCode}`;

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

      <p className="mt-6 text-center text-sm opacity-60">
        Todavía no está la lista del plantel acá — eso llega en el próximo
        paso del roadmap.
      </p>
    </div>
  );
}
