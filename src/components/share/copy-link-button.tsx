"use client";

import { useState } from "react";

export function CopyLinkButton({ text }: { text: string }) {
  const [estado, setEstado] = useState<"idle" | "copiado" | "error">("idle");

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setEstado("copiado");
        } catch {
          setEstado("error");
        }
        setTimeout(() => setEstado("idle"), 2000);
      }}
      className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
    >
      {estado === "copiado"
        ? "¡Copiado!"
        : estado === "error"
          ? "No se pudo copiar"
          : "Copiar link"}
    </button>
  );
}
