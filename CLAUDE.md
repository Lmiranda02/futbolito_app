# Armá tu Partido — Gestión de partidos de fútbol amateur

## Qué es esto
App web para que capitanes organicen equipos y partidos de fútbol amateur sin
depender de cadenas de WhatsApp: inscripción de jugadores vía link/QR,
aprobación por el capitán, y confirmación de asistencia por partido con hora
límite.

## Contexto de producto
Ya se validó el flujo core en un prototipo interactivo (React con estado en
memoria). Los flujos validados son:

1. Capitán crea equipo → se genera un código/link de invitación
2. Jugador se inscribe con ese link → queda en estado "Pendiente"
3. Capitán aprueba o rechaza la inscripción
4. Capitán convoca un partido (fecha, hora, cancha, hora límite de confirmación)
5. Jugadores del plantel aprobado confirman o rechazan asistencia antes del límite
6. Capitán ve el estado de cada jugador en tiempo real

## Alcance por fases
No implementar nada de una fase posterior sin acuerdo explícito primero.

- **Fase 1 (MVP — foco actual)**: todo lo del punto anterior, completo.
  Un jugador puede pertenecer a varios equipos. Un solo equipo "dueño" de
  cada partido (todavía no hay coordinación entre dos capitanes).
- **Fase 2**: gestión de pagos de cancha (marcar pagado/pendiente por
  jugador y partido).
- **Fase 3**: partidos entre dos equipos, coordinados por sus dos capitanes.
- **Fase 4**: visualización tipo cancha con jugadores ubicados según su
  estado (confirmado/pendiente).

## Stack técnico (decidido — no cambiar sin discutirlo primero)
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Base de datos: Supabase (Postgres), capa gratuita
- ORM: Prisma
- Auth: Supabase Auth (magic link por email), solo para capitanes. Los
  jugadores se inscriben sin crear cuenta, identificados por teléfono.
- Hosting: Vercel, capa gratuita, deploy automático desde GitHub
- QR: librería cliente `qrcode.react` (no requiere backend)

## Convenciones de trabajo
- Incrementos chicos y verificables: un objetivo concreto por sesión/commit.
- Antes de tocar modelo de datos, auth, o configuración de producción:
  planificar primero (modo plan), no escribir código directo.
- Mantener `ROADMAP.md` actualizado con checkboxes de progreso real.
- Variables sensibles solo en `.env.local` (nunca commitear). Documentar
  cada variable nueva en `.env.example`.
- Preferir server actions / route handlers de Next.js antes que armar un
  backend separado.
- Explicar en criollo (sin jerga innecesaria) cualquier decisión de
  arquitectura antes de implementarla.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
