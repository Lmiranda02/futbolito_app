"use client";

import { QRCodeSVG } from "qrcode.react";

const TAMANOS = {
  grande: { relleno: "p-[14px]", radio: "rounded-[14px]", qr: 176 }, // puerta de entrada del equipo
  chico: { relleno: "p-[9px]", radio: "rounded-[10px]", qr: 104 }, // fila de compartir del partido
} as const;

/**
 * Placa clara fija, sin importar el tema: un QR necesita contraste real
 * entre los módulos y el fondo para que un celular lo pueda leer. Con la
 * app siempre oscura, un fondo transparente lo dejaría ilegible — y
 * nunca hay que invertirlo (módulos claros sobre fondo oscuro), porque
 * ahí es donde los lectores empiezan a fallar.
 */
export function InviteQr({
  url,
  tamano = "grande",
}: {
  url: string;
  tamano?: keyof typeof TAMANOS;
}) {
  const { relleno, radio, qr } = TAMANOS[tamano];

  return (
    <div
      className={`inline-block ${radio} ${relleno} bg-tinta shadow-[0_14px_34px_-18px_rgba(0,0,0,0.9)]`}
    >
      <QRCodeSVG value={url} size={qr} />
    </div>
  );
}
