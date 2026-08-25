import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Falta la variable DATABASE_URL. En local se define en .env.local; " +
      "en Vercel, en Settings → Environment Variables.",
  );
}

// Prisma 7 ya no trae su propio motor de conexión: hay que pasarle un adaptador.
// Usamos el de Postgres apuntando al pooler (puerto 6543), que es el que aguanta
// que las funciones de Vercel se prendan y apaguen todo el rato.
const adapter = new PrismaPg({ connectionString });

// En desarrollo, Next.js recarga los módulos en cada cambio. Si creáramos un
// PrismaClient nuevo cada vez, en pocos minutos tendríamos decenas de conexiones
// abiertas contra Supabase y la base empezaría a rechazarlas. Guardarlo en
// globalThis hace que sobreviva a las recargas.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
