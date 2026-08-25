"use client";

import { useTransition } from "react";

import { regenerarInviteCode } from "@/server/actions/team";

export function RegenerateInviteButton({ teamId }: { teamId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const confirma = window.confirm(
          "¿Regenerar el link? El link y el QR que ya compartiste van a dejar de funcionar.",
        );
        if (!confirma) return;
        startTransition(() => {
          regenerarInviteCode(teamId);
        });
      }}
      className="rounded-md border border-black/15 px-4 py-2.5 text-sm font-medium hover:bg-black/5 disabled:opacity-60 dark:border-white/20 dark:hover:bg-white/10"
    >
      {pending ? "Regenerando..." : "Regenerar link"}
    </button>
  );
}
