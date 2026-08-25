import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// El CLI de Prisma no lee .env.local por su cuenta (eso lo hace Next.js al correr
// la app). Lo cargamos a mano para que `prisma migrate` encuentre las credenciales.
// En Vercel este archivo no existe y las variables vienen de la plataforma:
// dotenv no pisa lo que ya está definido, así que funciona en los dos lados.
loadEnv({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Ojo: acá va DIRECT_URL, no DATABASE_URL.
    // Esta url la usan solo los comandos del CLI (migrate, studio), que crean y
    // modifican tablas. El pooler de transacciones no soporta esas operaciones,
    // así que el CLI va por la conexión de sesión (5432).
    // La app en runtime usa DATABASE_URL a través del adaptador, en src/lib/prisma.ts.
    url: process.env["DIRECT_URL"],
  },
});
