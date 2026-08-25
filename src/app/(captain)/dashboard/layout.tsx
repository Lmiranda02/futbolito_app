import Link from "next/link";

import { SoundToggle } from "@/components/sound/sound-toggle";
import { BrandCrest } from "@/components/team/team-crest";
import { requireCaptain } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  // Segunda cerradura (la primera es src/proxy.ts, que solo refresca la
  // sesión): sin capitán logueado, esto redirige a /login antes de
  // renderizar nada del dashboard.
  const captain = await requireCaptain();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-40 flex flex-wrap items-center gap-3 border-b border-tinta/10 bg-[rgba(8,12,9,0.82)] px-6 py-[22px] backdrop-blur-[10px]">
        <Link href="/dashboard" className="flex items-center gap-2">
          <BrandCrest size={30} />
          <span className="text-[15px] font-bold text-tinta">
            Arma tu Partido
          </span>
        </Link>
        <span className="ml-auto font-mono text-[12px] text-tinta/45">
          {captain.email}
        </span>
        <SoundToggle />
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="boton-fantasma px-[14px] py-[9px] text-[13px]"
          >
            Cerrar sesión
          </button>
        </form>
      </header>
      {/* w-full + min-w-0 a propósito: <body> es flex, así que sin esto un
          hijo con texto no cortable (p. ej. un nombre de equipo con
          truncate) puede empujar el ancho más allá del viewport en vez de
          encogerse — ver la nota en el paso 4 del handoff. */}
      <main className="w-full min-w-0 flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
