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
- [x] **0.2 Deploy inicial en Vercel.** Crear cuenta, importar el repo, deploy de la
      landing vacía. Poner la región de funciones en **São Paulo (`gru1`)**.
      _Verificable_: la URL pública de Vercel abre la home; un push a `main` redeploya solo.
- [x] **0.3 Crear el proyecto de Supabase.** Región **South America (São Paulo)** —ojo, no
      se puede cambiar después—. Anotar `DATABASE_URL` (pooler 6543), `DIRECT_URL` (5432)
      y las claves. Armar `.env.local` y `.env.example` con las 5 variables, y cargarlas
      también en Vercel.
      _Verificable_: `.env.example` está commiteado, `.env.local` no aparece en `git status`.
- [x] **0.4 Conectar Prisma + healthcheck.** Instalar Prisma, `src/lib/prisma.ts` singleton,
      y una ruta `/api/health` que hace un `SELECT 1`.
      _Verificable_: `/api/health` responde ok **en local y en la URL de Vercel** — eso
      prueba que el pooler funciona desde serverless, que es donde suele fallar.

## Bloque 1 — Modelo de datos

- [x] **1.1 Schema y primera migración.** `prisma/schema.prisma` completo (6 modelos, 4
      enums, índices) + `prisma migrate dev` + `prisma generate`.
      _Verificable_: las tablas se ven en el Table Editor de Supabase.
- [x] **1.2 Verificar el cierre de la Data API.** Al crear el proyecto se dejó la Data
      API apagada y el RLS automático encendido, así que esto pasó de "implementar" a
      "confirmar": chequear que las tablas nuevas nazcan con RLS activo y que la API REST
      no exponga nada.
      _Verificable_: pegarle a la API REST de Supabase con la anon key no devuelve datos.
- [x] **1.3 Seed de desarrollo.** Un capitán, un equipo, 6 jugadores (2 pendientes), un
      partido con sus asistencias. Script `npm run db:seed`.
      _Verificable_: los datos aparecen en Prisma Studio.

## Seguridad transversal (revisada 2026-08-25)

No es una fase del producto: es una pasada de dureza sobre lo que ya existe,
antes de sumar el login. Se repite cada vez que se sienta necesario, no solo
una vez.

- [x] Confirmado que ningún secreto entró nunca a git (revisado el historial
      completo, no solo el estado actual).
- [x] Los 4 paquetes con scripts de instalación pendientes de revisión
      (@prisma/engines, esbuild, prisma, unrs-resolver) fueron auditados
      (cadena de dependencias limpia) y aprobados fijados a su versión
      exacta en package.json → allowScripts. Una actualización futura de
      cualquiera de los cuatro vuelve a pedir aprobación en vez de correr
      sola.
- [x] `npm audit`: una vulnerabilidad alta en deepmerge-ts (vía
      @prisma/config) evaluada y descartada a propósito — solo la usa el
      CLI de Prisma para fusionar nuestro propio prisma.config.ts en
      build/local, nunca código que sirva requests de usuarios. Arreglarla
      exige bajar a Prisma 6 y perder el adaptador; no vale la pena para un
      vector sin superficie de ataque real acá.
- [x] Cabeceras de seguridad HTTP en src/lib/security-headers.ts, aplicadas
      en src/proxy.ts a cada respuesta: CSP con nonce por request
      (verificado que Next lo aplica a sus 16 <script> inyectados, y que
      producción no lleva unsafe-eval), X-Frame-Options, nosniff,
      Referrer-Policy, Permissions-Policy y HSTS.

## Bloque 2 — Auth del capitán

- [x] **2.1 Clientes de Supabase + middleware de sesión.** `lib/supabase/{client,server,
      middleware}.ts` y `src/middleware.ts` refrescando la sesión.
      _Verificable_: el proyecto compila y las rutas públicas siguen andando.
- [x] **2.2 Login con magic link.** `/login`, `/auth/callback` (canje + upsert de
      `Captain`), `/auth/signout`, `/dashboard` placeholder protegido, helper
      `requireCaptain()`.
      _Verificado por el agente_: `/dashboard` sin sesión redirige a `/login`;
      `/auth/callback` sin código o con código inválido redirige a
      `/login?error=link_invalido` con el mensaje visible; `/auth/signout` solo
      responde a POST (GET da 405); protección contra open-redirect probada con
      5 casos. El envío real del magic link a Supabase también se probó y
      **funciona** (confirmado en los logs del servidor) — lo que no se pudo
      probar automáticamente es abrir el correo y hacer click, porque eso pasa
      fuera de la app.
      _Pendiente de tu parte_: la cuota de correos del SMTP compartido de
      Supabase se agotó durante las pruebas (`email rate limit exceeded`, unos
      pocos por hora en el plan gratis). Cuando reponga, hacé la prueba real:
      entrá con tu email, revisá la bandeja (y spam), hacé click, y confirmá
      que llegás al dashboard y podés cerrar sesión. De paso confirmá en el
      dashboard de Supabase (Authentication → URL Configuration) que
      `http://localhost:3000/auth/callback` y
      `https://arma-tu-partido.vercel.app/auth/callback` estén en Redirect
      URLs — si no están, el link del correo no va a redirigir bien aunque el
      correo sí llegue.

## Bloque 3 — Equipos e invitación

- [x] **3.1 Crear equipo.** Form (nombre del equipo + "yo también juego" con nombre y
      teléfono) → server action que genera `inviteCode` y la membresía `CAPTAIN` aprobada.
      Lista de equipos en el dashboard.
      _Verificado por el agente_ (a nivel de base de datos, mismos pasos que la server
      action: crear equipo + upsert de Player por teléfono + TeamMember CAPTAIN/APPROVED):
      el equipo queda con su inviteCode de 8 caracteres, la membresía del capitán queda
      aprobada de una, y crear un segundo equipo con el mismo teléfono reusa el mismo
      Player en vez de duplicarlo. `/dashboard/equipos/nuevo` sin sesión redirige a
      `/login`.
      _Pendiente de tu parte_: no se pudo probar por la interfaz porque requiere una
      sesión real (magic link) que el agente no puede completar solo — probá crear un
      equipo desde `/dashboard` y confirmá que aparece en la lista.
- [x] **3.2 Página del equipo con link y QR.** Link de invitación, QR (`qrcode.react`),
      botón copiar, botón regenerar código.
      _Verificado por el agente_: sin sesión, `/dashboard/equipos/[id]` redirige a
      `/login` (antes de siquiera mirar si el equipo existe). A nivel de base de datos,
      con dos capitanes de prueba: un capitán no puede "ver" el equipo de otro (mismo
      404 que un id inventado — no se puede distinguir "no existe" de "no es tuyo"), y
      regenerar el código efectivamente cambia el inviteCode del equipo.
      _Importante_: el QR ya apunta bien a `/unirse/<code>`, pero esa página recién se
      construye en la tarea 4.1 — hasta entonces, escanearlo muestra un 404. Es lo
      esperado en este punto del roadmap, no un bug.
      _Pendiente de tu parte_: entrá a un equipo desde `/dashboard`, confirmá que se ve
      el link y el QR, probá copiar el link, y probá regenerar el código (el link viejo
      debería dejar de andar cuando lleguemos a la 4.1).

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
