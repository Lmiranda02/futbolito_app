"use client";

import { useSound } from "@/components/sound/sound-provider";

export function SoundToggle() {
  const { sonidoActivo, alternarSonido } = useSound();

  return (
    <button
      type="button"
      onClick={alternarSonido}
      aria-pressed={sonidoActivo}
      className={
        "shrink-0 rounded-full px-3 py-[6px] font-mono text-[11px] transition-colors " +
        (sonidoActivo
          ? "border border-lima/35 bg-lima/[0.12] text-lima"
          : "border border-tinta/16 text-tinta/50")
      }
    >
      {sonidoActivo ? "Sonido encendido" : "Sonido apagado"}
    </button>
  );
}
