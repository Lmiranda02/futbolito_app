import type { Metadata } from "next";

import { JoinForm } from "@/components/team/join-form";
import { TeamCrest } from "@/components/team/team-crest";
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
      <main className="flex w-full flex-1 items-center justify-center px-6 py-16">
        <div className="animar-subir w-full max-w-[430px] text-center">
          <p className="font-mono text-[11px] tracking-[0.2em] text-lima uppercase">
            Arma tu Partido
          </p>
          <h1 className="mt-3 text-xl font-bold text-tinta">
            Este link ya no sirve
          </h1>
          <p className="mt-2 text-sm text-tinta/60">
            Puede que el capitán haya generado uno nuevo. Pídele el link
            actualizado.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex w-full flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-[430px]">
        <div className="animar-subir text-center">
          <div className="flex justify-center">
            <TeamCrest name={team.name} teamId={team.id} size={56} />
          </div>
          <p className="mt-3 font-mono text-[11px] tracking-[0.2em] text-lima uppercase">
            Te invitaron a
          </p>
          <h1 className="mt-1 text-[34px] font-extrabold tracking-[-0.03em] text-tinta">
            {team.name}
          </h1>
          <p className="mt-2 text-[15px] text-tinta/60">
            Déjale tus datos al capitán y quedas en el plantel cuando te
            apruebe. No tienes que crear cuenta ni nada.
          </p>
        </div>

        <JoinForm inviteCode={codigo} />
      </div>
    </main>
  );
}
