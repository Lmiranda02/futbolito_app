"use client";

import { useState } from "react";

import { useSound } from "@/components/sound/sound-provider";

export function CopyLinkButton({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const [estado, setEstado] = useState<"idle" | "copiado" | "error">("idle");
  const { reproducirClick } = useSound();

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setEstado("copiado");
          reproducirClick();
        } catch {
          setEstado("error");
        }
        setTimeout(() => setEstado("idle"), 1800);
      }}
      className={`boton-primario px-[20px] py-[13px] text-[14px] ${className}`}
    >
      {estado === "copiado"
        ? "¡Copiado!"
        : estado === "error"
          ? "No se pudo copiar"
          : "Copiar link"}
    </button>
  );
}
