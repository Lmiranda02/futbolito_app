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
          "¿Cambiar el código? El link y el QR que ya compartiste van a dejar de funcionar.",
        );
        if (!confirma) return;
        startTransition(() => {
          regenerarInviteCode(teamId);
        });
      }}
      className="boton-fantasma px-[20px] py-[13px] text-[14px]"
    >
      {pending ? "Cambiando..." : "Cambiar código"}
    </button>
  );
}
