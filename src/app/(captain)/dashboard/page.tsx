import type { Metadata } from "next";

import { requireCaptain } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Panel",
};

export default async function DashboardPage() {
  const captain = await requireCaptain();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-semibold">
        Hola{captain.name ? `, ${captain.name}` : ""}
      </h1>
      <p className="mt-2 text-sm opacity-70">
        Acá vas a ver tus equipos. Todavía no hay nada armado — eso llega en
        el próximo bloque del roadmap.
      </p>
    </div>
  );
}
