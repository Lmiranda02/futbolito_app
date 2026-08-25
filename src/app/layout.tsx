import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";

import { SoundProvider } from "@/components/sound/sound-provider";

import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arma tu Partido",
  description:
    "Organiza los partidos de tu equipo sin cadenas de WhatsApp: invitación por link, plantel aprobado y confirmación de asistencia con hora límite.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-CL"
      className={`${archivo.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SoundProvider>{children}</SoundProvider>
      </body>
    </html>
  );
}
