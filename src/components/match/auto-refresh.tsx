"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const INTERVALO_MS = 20_000;

/**
 * Sin interfaz propia (devuelve null): solo dispara router.refresh() cada
 * 20 segundos para que esta página (un Server Component) vuelva a traer
 * los datos frescos de la base, sin que el capitán tenga que recargar a
 * mano durante el partido.
 *
 * A propósito no es más sofisticado que esto — nada de WebSockets ni
 * Supabase Realtime: para el volumen de gente mirando esta pantalla al
 * mismo tiempo (el capitán, en un partido de fútbol amateur), un poll
 * liviano cada 20s alcanza de sobra y no exige resolver nada de auth para
 * un canal en tiempo real.
 */
export function AutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
    }, INTERVALO_MS);
    return () => clearInterval(id);
  }, [router]);

  return null;
}
