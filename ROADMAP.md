# ROADMAP — Arma tu Partido

Estado: **Fase 1 (MVP)**. Cada tarea es chica, verificable y está en orden de dependencia.
Marcar el checkbox solo cuando el criterio _Verificable_ se cumplió de verdad.

Decisiones de base tomadas al planificar (ver `CLAUDE.md` para el alcance por fases):

- El jugador no tiene cuenta: se inscribe por link/QR y confirma eligiéndose de la lista
  en el link del partido.
- El capitán también juega: al crear el equipo se le arma su membresía ya aprobada.
- Sin alta manual de jugadores en Fase 1.
- Todo en horario de **Santiago de Chile** (`America/Santiago`), teléfonos **+56**.
  Se guarda en UTC y se convierte al mostrar, porque Chile cambia de hora dos veces al año.

## Bloque 0 — Pipeline a producción (antes de cualquier feature)

- [x] **0.1 Inicializar el proyecto.** Next.js (App Router) + TypeScript + Tailwind +
      ESLint, con `src/`. Primer commit y push a `Lmiranda02/futbolito_app`.
      _Verificable_: `npm run dev` levanta y muestra la home en localhost:3000.
- [ ] **0.2 Deploy inicial en Vercel.** Crear cuenta, importar el repo, deploy de la
      landing vacía. Poner la región de funciones en **São Paulo (`gru1`)**.
      _Verificable_: la URL pública de Vercel abre la home; un push a `main` redeploya solo.
- [ ] **0.3 Crear el proyecto de Supabase.** Región **South America (São Paulo)** —ojo, no
      se puede cambiar después—. Anotar `DATABASE_URL` (pooler 6543), `DIRECT_URL` (5432)
      y las claves. Armar `.env.local` y `.env.example` con las 5 variables, y cargarlas
      también en Vercel.
      _Verificable_: `.env.example` está commiteado, `.env.local` no aparece en `git status`.
- [ ] **0.4 Conectar Prisma + healthcheck.** Instalar Prisma, `src/lib/prisma.ts` singleton,
      y una ruta `/api/health` que hace un `SELECT 1`.
      _Verificable_: `/api/health` responde ok **en local y en la URL de Vercel** — eso
      prueba que el pooler funciona desde serverless, que es donde suele fallar.

## Bloque 1 — Modelo de datos

- [ ] **1.1 Schema y primera migración.** `prisma/schema.prisma` completo (6 modelos, 4
      enums, índices) + `prisma migrate dev` + `prisma generate`.
      _Verificable_: las tablas se ven en el Table Editor de Supabase.
- [ ] **1.2 RLS deny-all.** Activar RLS en las tablas de la app sin políticas públicas.
      _Verificable_: pegarle a la API REST de Supabase con la anon key no devuelve datos.
- [ ] **1.3 Seed de desarrollo.** Un capitán, un equipo, 6 jugadores (2 pendientes), un
      partido con sus asistencias. Script `npm run db:seed`.
      _Verificable_: los datos aparecen en Prisma Studio.

## Bloque 2 — Auth del capitán

- [ ] **2.1 Clientes de Supabase + middleware de sesión.** `lib/supabase/{client,server,
      middleware}.ts` y `src/middleware.ts` refrescando la sesión.
      _Verificable_: el proyecto compila y las rutas públicas siguen andando.
- [ ] **2.2 Login con magic link.** `/login`, `/auth/callback` (canje + upsert de
      `Captain`), `/auth/signout`, `/dashboard` placeholder protegido, helper
      `requireCaptain()`.
      _Verificable_: entras con tu email, llegas al dashboard, cierras sesión, y
      `/dashboard` te manda de vuelta a `/login`.

## Bloque 3 — Equipos e invitación

- [ ] **3.1 Crear equipo.** Form (nombre del equipo + "yo también juego" con nombre y
      teléfono) → server action que genera `inviteCode` y la membresía `CAPTAIN` aprobada.
      Lista de equipos en el dashboard.
      _Verificable_: creas un equipo, aparece en la lista y tú ya estás en el plantel.
- [ ] **3.2 Página del equipo con link y QR.** Link de invitación, QR (`qrcode.react`),
      botón copiar, botón regenerar código.
      _Verificable_: escaneas el QR con el celular y abre `/unirse/<code>`.

## Bloque 4 — Inscripción y aprobación

- [ ] **4.1 Inscripción del jugador.** `/unirse/[inviteCode]` público: form nombre +
      teléfono, normalización, upsert de `Player`, `TeamMember` en `PENDING`, y los casos
      borde (ya pendiente / ya aprobado / rechazado / código inválido).
      _Verificable_: desde el celular te inscribes y el registro queda en la base.
- [ ] **4.2 Aprobar o rechazar.** En la página del equipo: lista de pendientes con dos
      botones, y el plantel aprobado abajo. Al aprobar, crear asistencias `PENDING` para
      los partidos futuros ya existentes.
      _Verificable_: apruebas a uno y pasa de "pendientes" a "plantel" sin recargar a mano.

## Bloque 5 — Partidos

- [ ] **5.1 Convocar partido.** Form (fecha y hora, cancha, rival opcional, cupo opcional,
      hora límite) con validaciones (límite antes del partido, partido en el futuro),
      conversión a UTC, `publicId`, y creación de las asistencias del plantel aprobado.
      Lista de próximos partidos en la página del equipo.
      _Verificable_: creas un partido y en la base hay una fila `Attendance` por jugador
      aprobado.
- [ ] **5.2 Detalle del partido (capitán).** Contadores (confirmados / no van /
      pendientes), lista agrupada por estado, link del partido con botón copiar + QR,
      y editar/cancelar partido.
      _Verificable_: la página refleja el estado real y el link copiado abre la vista
      pública.

## Bloque 6 — Confirmación del jugador

- [ ] **6.1 Vista pública del partido.** `/partido/[publicId]`: datos del partido, cuenta
      regresiva hasta la hora límite, plantel con el estado de cada uno.
      _Verificable_: abres el link en el celular sin sesión y ves todo.
- [ ] **6.2 Voy / No voy.** Server action que valida partido `SCHEDULED` y
      `now < confirmDeadline`, actualiza la asistencia y revalida. Después del límite, solo
      lectura.
      _Verificable_: confirmas desde el celular y el capitán ve el cambio; adelantando el
      deadline en la base, los botones se bloquean.
- [ ] **6.3 Auto-refresh del capitán.** Refresco cada ~20s en el detalle del partido.
      _Verificable_: dos dispositivos lado a lado; el conteo del capitán se mueve solo.

## Bloque 7 — Salida a la cancha

- [ ] **7.1 Pasada mobile-first.** Estados vacíos, loading, errores de formulario,
      botones grandes. Todo se usa desde el celular y en la calle.
- [ ] **7.2 Detalles finos.** `noindex` en rutas con código, 404 propias, metadatos y título,
      formato de fechas en español de Chile (`America/Santiago`). Probar con una fecha
      posterior al cambio de horario para confirmar que no se corre una hora.
- [ ] **7.3 Prueba real.** Un partido de verdad con tu equipo, de punta a punta en
      producción, y anotar lo que duela.

## Opcionales (no bloquean el MVP)

- [ ] SMTP propio (Resend) para el magic link, si suman capitanes.
- [ ] Últimos 4 dígitos del teléfono al confirmar, si alguien confirma por otro.
- [ ] Proyecto de Supabase separado para producción, cuando haya datos reales.

## Fuera de alcance en Fase 1 (para que no sorprenda después)

- La app **no envía** WhatsApp, SMS ni email a los jugadores: el capitán comparte los links.
- "Tiempo real" es auto-refresh cada ~20s, no WebSockets.
- Pagos de cancha (Fase 2), partidos entre dos equipos (Fase 3) y vista tipo cancha
  (Fase 4) no se tocan.
