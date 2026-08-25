"use client";

import { QRCodeSVG } from "qrcode.react";

/**
 * Fondo blanco fijo, sin importar el tema: un QR necesita contraste real
 * entre los módulos y el fondo para que un celular lo pueda leer. En modo
 * oscuro, un fondo transparente lo dejaría ilegible.
 */
export function InviteQr({ url }: { url: string }) {
  return (
    <div className="inline-block rounded-lg bg-white p-4">
      <QRCodeSVG value={url} size={192} />
    </div>
  );
}
