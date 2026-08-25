import type { Metadata } from "next";

import { CreateTeamForm } from "@/components/team/create-team-form";
import { requireCaptain } from "@/lib/auth";

export const metadata: Metadata = { title: "Nuevo equipo" };

export default async function NuevoEquipoPage() {
  await requireCaptain();

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-xl font-semibold">Crea tu equipo</h1>
      <p className="mt-2 text-sm opacity-70">
        Vas a quedar como capitán y también en el plantel — por eso te
        pedimos tus datos como jugador.
      </p>
      <CreateTeamForm />
    </div>
  );
}
