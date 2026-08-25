import Link from "next/link";

import { SoundToggle } from "@/components/sound/sound-toggle";
import { BrandCrest } from "@/components/team/team-crest";

const PASOS = [
  {
    numero: "01",
    titulo: "Armas el equipo",
    descripcion: "Le pones nombre y te queda un código de invitación al toque.",
  },
  {
    numero: "02",
    titulo: "Pasas el link o el QR",
    descripcion: "Se anotan sin crear cuenta. Tú apruebas quién entra al plantel.",
  },
  {
    numero: "03",
    titulo: "Sabes quién va",
    descripcion:
      "Cada uno confirma antes de la hora límite. Nada de contar cabezas a última hora.",
  },
];

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-40 flex w-full items-center gap-3 border-b border-[rgba(200,255,180,0.10)] bg-[rgba(8,12,9,0.82)] px-6 py-[18px] backdrop-blur-[10px]">
        <BrandCrest size={30} />
        <span className="text-[15px] font-bold text-tinta">Arma tu Partido</span>
        <span className="hidden font-mono text-[11px] tracking-[0.16em] text-tinta/45 uppercase sm:inline">
          Fútbol 7 · barrio · Chile
        </span>
        <div className="ml-auto">
          <SoundToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1120px] px-5">
        <div className="animar-subir grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] items-center gap-8 py-[28px] sm:py-[56px]">
          <div>
            <p className="font-mono text-[11px] tracking-[0.2em] text-lima uppercase">
              Convocatoria abierta
            </p>
            <h1 className="mt-3 text-[clamp(42px,6.4vw,72px)] leading-[0.94] font-extrabold tracking-[-0.035em] text-balance text-tinta">
              Deja de rogar por WhatsApp que confirmen.
            </h1>
            <p className="mt-4 max-w-[44ch] text-pretty text-[18px] text-tinta/68">
              Pasas el link, el compadre se anota, tú apruebas el plantel y
              sabes quién juega antes de pisar la cancha. Sin cadenas, sin
              &ldquo;¿al final somos 7?&rdquo;.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="boton-primario relative overflow-hidden px-[24px] py-[15px] text-[16px]"
              >
                <span className="animar-barrido pointer-events-none absolute inset-y-0 left-0 w-2/5 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)]" />
                <span className="relative">Entrar como capitán</span>
              </Link>
              <Link
                href="#como-funciona"
                className="boton-fantasma px-[24px] py-[15px] text-[16px]"
              >
                Tengo un link de invitación
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-tinta/14 px-3 py-[6px] font-mono text-[11px] text-tinta/50">
                Los jugadores no crean cuenta
              </span>
              <span className="rounded-full border border-tinta/14 px-3 py-[6px] font-mono text-[11px] text-tinta/50">
                Hora límite para confirmar
              </span>
            </div>
          </div>

          <div className="cancha-hero flex min-h-[430px] flex-col rounded-[20px] border border-[rgba(200,255,180,0.16)] p-[26px]">
            <div className="linea-perimetro" />
            <div className="linea-medio" />
            <div className="linea-circulo" />

            <div className="relative flex flex-1 flex-col justify-between p-[14px]">
              <div className="w-fit rounded-[14px] border border-lima/20 bg-[rgba(8,17,11,0.86)] px-4 py-3 backdrop-blur-[4px]">
                <p className="font-mono text-[11px] text-lima uppercase">
                  Confirmados
                </p>
                <p className="font-mono text-[38px] leading-none font-semibold text-tinta">
                  09<span className="text-[20px] text-tinta/35">/12</span>
                </p>
              </div>

              <div className="w-fit self-end rounded-[14px] border border-lima/20 bg-[rgba(8,17,11,0.86)] px-4 py-3 text-right backdrop-blur-[4px]">
                <p className="text-[13px] text-tinta/60">
                  Sábado 21:00 · Cancha La Chimba
                </p>
                <p className="text-[17px] font-bold text-tinta">
                  vs. Deportivo La Cisterna
                </p>
                <p className="animar-respirar font-mono text-[12px] text-lima">
                  quedan 4 h 12 min para confirmar
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          id="como-funciona"
          className="animar-subir [animation-delay:.1s] grid scroll-mt-20 grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-[14px] pb-16"
        >
          {PASOS.map((paso) => (
            <div
              key={paso.numero}
              className="rounded-2xl border border-tinta/12 bg-white/[0.022] p-[22px] transition-colors hover:border-lima/[0.34] hover:bg-white/5"
            >
              <p className="font-mono text-[13px] text-lima">{paso.numero}</p>
              <p className="mt-2 text-[17px] font-bold text-tinta">
                {paso.titulo}
              </p>
              <p className="mt-1 text-[14px] text-tinta/58">
                {paso.descripcion}
              </p>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
