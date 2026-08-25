import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Límite simple por clave (típicamente "algo:<ip>"), respaldado en
 * Postgres — no hay Redis ni Vercel KV en el stack todavía, y para el
 * volumen que va a tener esta app alcanza de sobra. No es de grado
 * industrial (no protege contra alguien rotando de IP a propósito), pero
 * frena el caso real que importa: que un formulario público se llene de
 * basura por accidente o por un bot genérico.
 *
 * Antes de contar, borra los intentos vencidos de esa misma clave — así
 * la tabla se mantiene sola, sin necesitar un cron aparte.
 */
export async function checkRateLimit(
  key: string,
  { max, windowMs }: { max: number; windowMs: number },
): Promise<boolean> {
  const desde = new Date(Date.now() - windowMs);

  await prisma.rateLimitHit.deleteMany({
    where: { key, createdAt: { lt: desde } },
  });

  const intentos = await prisma.rateLimitHit.count({ where: { key } });
  if (intentos >= max) return false;

  await prisma.rateLimitHit.create({ data: { key } });
  return true;
}
