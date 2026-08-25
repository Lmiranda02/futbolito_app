/**
 * Datos de desarrollo: un capitán, un equipo, 6 jugadores (2 pendientes) y
 * un partido con sus asistencias. Se corre con `npm run db:seed`.
 *
 * OJO: este script BORRA todo lo que haya en estas tablas antes de volver a
 * crear los datos de ejemplo. Está pensado para una base de desarrollo, no
 * para correrlo nunca contra producción con inscripciones reales.
 *
 * El capitán de ejemplo NO corresponde a ningún usuario real de Supabase
 * Auth (su id es un UUID inventado). Sirve para inspeccionar el modelo en
 * Prisma Studio y armar pantallas antes de que exista el login (Bloque 2).
 * Una vez que el login esté armado, cada capitán real se crea con el mismo
 * id que le da Supabase Auth al loguearse (ver tarea 2.2).
 */
import { randomUUID } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";

import { generarInviteCode, generarPublicId } from "../src/lib/codes";
import { PrismaClient } from "../src/generated/prisma/client";

// El seed es un script suelto (corre con tsx, fuera de Next.js), así que arma
// su propia conexión en vez de reusar src/lib/prisma.ts: ese archivo está
// guardado con "server-only", que revienta apenas se ejecuta fuera del
// build de Next.
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

// Fechas en UTC. Comentado el horario equivalente en Santiago para no
// depender todavía de date-fns-tz (eso llega con los formularios, tarea 5.1).
// Fin de agosto: Chile está en horario de invierno (UTC-4, sin cambio de
// horario), así que la resta es directa.
const PARTIDO_KICKOFF_UTC = "2026-08-29T23:00:00.000Z"; // sábado 29-ago 19:00 CLT
const PARTIDO_DEADLINE_UTC = "2026-08-29T16:00:00.000Z"; // sábado 29-ago 12:00 CLT

async function main() {
  console.log("Limpiando datos de desarrollo previos...");
  await prisma.attendance.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.match.deleteMany();
  await prisma.team.deleteMany();
  await prisma.player.deleteMany();
  await prisma.captain.deleteMany();

  console.log("Creando capitán...");
  const captain = await prisma.captain.create({
    data: {
      id: randomUUID(),
      email: "capitan.demo@armatupartido.cl",
      name: "Capitán Demo",
    },
  });

  console.log("Creando equipo...");
  const team = await prisma.team.create({
    data: {
      name: "Deportivo Ñuñoa",
      captainId: captain.id,
      inviteCode: generarInviteCode(),
    },
  });

  // El capitán también juega: tiene su propia membresía, ya aprobada.
  const jugadorCapitan = await prisma.player.create({
    data: { name: captain.name!, phone: "56911111111" },
  });
  const membresiaCapitan = await prisma.teamMember.create({
    data: {
      teamId: team.id,
      playerId: jugadorCapitan.id,
      role: "CAPTAIN",
      status: "APPROVED",
      decidedAt: new Date(),
    },
  });

  console.log("Creando jugadores del plantel (4 aprobados, 2 pendientes)...");
  const jugadoresAprobados = [
    { name: "Diego Fernández", phone: "56922222222" },
    { name: "Matías Rojas", phone: "56933333333" },
    { name: "Sebastián Muñoz", phone: "56944444444" },
    { name: "Ignacio Soto", phone: "56955555555" },
  ];
  const jugadoresPendientes = [
    { name: "Cristóbal Vera", phone: "56966666666" },
    { name: "Benjamín Castro", phone: "56977777777" },
  ];

  const membresiasAprobadas = [membresiaCapitan];
  for (const datos of jugadoresAprobados) {
    const player = await prisma.player.create({ data: datos });
    const membership = await prisma.teamMember.create({
      data: {
        teamId: team.id,
        playerId: player.id,
        status: "APPROVED",
        decidedAt: new Date(),
      },
    });
    membresiasAprobadas.push(membership);
  }

  for (const datos of jugadoresPendientes) {
    const player = await prisma.player.create({ data: datos });
    await prisma.teamMember.create({
      data: { teamId: team.id, playerId: player.id, status: "PENDING" },
    });
  }

  console.log("Creando partido...");
  const match = await prisma.match.create({
    data: {
      teamId: team.id,
      publicId: generarPublicId(),
      opponent: "Los Tigres",
      venue: "Cancha Municipal Ñuñoa",
      address: "Av. Grecia 1234, Ñuñoa",
      kickoffAt: new Date(PARTIDO_KICKOFF_UTC),
      confirmDeadline: new Date(PARTIDO_DEADLINE_UTC),
      slots: 10,
    },
  });

  // Solo se crean asistencias para el plantel APROBADO: los pendientes
  // todavía no forman parte del equipo, así que no tienen nada que
  // confirmar (ver decisión de diseño en el ROADMAP, bloque 4.2).
  console.log("Creando asistencias...");
  await prisma.attendance.create({
    data: { matchId: match.id, teamMemberId: membresiasAprobadas[0].id, status: "CONFIRMED", respondedAt: new Date() },
  });
  await prisma.attendance.create({
    data: { matchId: match.id, teamMemberId: membresiasAprobadas[1].id, status: "CONFIRMED", respondedAt: new Date() },
  });
  await prisma.attendance.create({
    data: { matchId: match.id, teamMemberId: membresiasAprobadas[2].id, status: "DECLINED", respondedAt: new Date() },
  });
  await prisma.attendance.create({
    data: { matchId: match.id, teamMemberId: membresiasAprobadas[3].id, status: "PENDING" },
  });
  await prisma.attendance.create({
    data: { matchId: match.id, teamMemberId: membresiasAprobadas[4].id, status: "PENDING" },
  });

  console.log("\nListo. Resumen:");
  console.log(`  Capitán:  ${captain.email}`);
  console.log(`  Equipo:   ${team.name}  (invitación: /unirse/${team.inviteCode})`);
  console.log(`  Plantel:  ${membresiasAprobadas.length} aprobados, ${jugadoresPendientes.length} pendientes`);
  console.log(`  Partido:  vs ${match.opponent}  (link: /partido/${match.publicId})`);
}

main()
  .catch((error) => {
    console.error("Falló el seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
