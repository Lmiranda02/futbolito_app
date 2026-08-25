import type { Metadata } from "next";

import { JoinForm } from "@/components/team/join-form";
import { prisma } from "@/lib/prisma";

// Nunca prerenderizado en build: el código puede regenerarse o el equipo
// puede crearse después del deploy, así que siempre hay que consultar la
// base en cada visita.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Únete a un equipo",
  // El código es la única "llave" del link: no tiene sentido que Google
  // lo indexe y quede buscable.
  robots: { index: false, follow: false },
};

export default async function UnirsePage(
  props: PageProps<"/unirse/[inviteCode]">,
) {
  const { inviteCode } = await props.params;
  const codigo = inviteCode.toUpperCase();

  const team = await prisma.team.findUnique({ where: { inviteCode: codigo } });

  if (!team || !team.inviteActive) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-emerald-600">
            Arma tu Partido
          </p>
          <h1 className="mt-3 text-xl font-semibold">Este link ya no sirve</h1>
          <p className="mt-2 text-sm opacity-70">
            Puede que el capitán haya generado uno nuevo. Pídele el link
            actualizado.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-emerald-600">
            Arma tu Partido
          </p>
          <h1 className="mt-3 text-xl font-semibold">Únete a {team.name}</h1>
          <p className="mt-2 text-sm opacity-70">
            Completa tus datos. El capitán tiene que aprobarte antes de que
            puedas confirmar asistencia a un partido.
          </p>
        </div>

        <JoinForm inviteCode={codigo} />
      </div>
    </main>
  );
}
