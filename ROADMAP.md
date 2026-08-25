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

- [x] **4.1 Inscripción del jugador.** `/unirse/[inviteCode]` público: form nombre +
      teléfono, normalización, upsert de `Player`, `TeamMember` en `PENDING`, y los casos
      borde (ya pendiente / ya aprobado / rechazado / código inválido).
      _Verificado por el agente_, de punta a punta por la interfaz real (esta página es
      pública, no necesita sesión): código inválido muestra "este link ya no sirve";
      código en minúscula igual funciona; inscripción nueva queda `PENDING`; reenviar el
      mismo teléfono en otro formato (`+56 9...` vs `9...`) lo reconoce como la misma
      persona y no duplica nada; con la membresía en `APPROVED` muestra "ya estás en el
      plantel"; con `REJECTED` vuelve a `PENDING` (confirmado en la base:
      `decidedAt` se resetea). Límite de intentos por IP verificado por separado
      (3 permitidos, el 4to rechazado, se resetea cuando vence la ventana). Todos los
      datos de prueba se limpiaron al terminar.
- [x] **4.2 Aprobar o rechazar.** En la página del equipo: lista de pendientes con dos
      botones, y el plantel aprobado abajo. Al aprobar, crear asistencias `PENDING` para
      los partidos futuros ya existentes.
      _Verificado por el agente_ a nivel de base de datos (mismos pasos que la server
      action): aprobar cambia el estado y crea asistencias `PENDING` para los partidos
      futuros con estado `SCHEDULED` — pero NO para uno pasado ni para uno cancelado
      (se armaron los 4 casos a propósito para probarlo); aprobar dos veces no duplica
      asistencias; rechazar deja la fila en `REJECTED` (no la borra, para que la
      re-solicitud de la 4.1 siga funcionando).
      _De paso_: se completó un hueco de la 4.1 — el formulario de inscripción no tenía
      el campo de apodo opcional que sí estaba en el plan original. Agregado y probado
      por la interfaz real: el apodo se guarda y es lo que se muestra acá si existe (si
      no, se usa el nombre).
      _Pendiente de tu parte_: entrá a un equipo con algún pendiente (podés generar uno
      inscribiéndote vos mismo desde el link de invitación) y probá aprobar/rechazar
      desde la interfaz.

## Bloque 5 — Partidos

- [x] **5.1 Convocar partido.** Form (fecha y hora, cancha, rival opcional, cupo opcional,
      hora límite) con validaciones (límite antes del partido, partido en el futuro),
      conversión a UTC, `publicId`, y creación de las asistencias del plantel aprobado.
      Lista de próximos partidos en la página del equipo.
      _Verificado por el agente_: la conversión de horario probada aparte, con un caso en
      horario de invierno (UTC-4) y uno en horario de verano (UTC-3) — las dos dan el
      offset correcto y el round-trip muestra la misma hora que se cargó. A nivel de base
      de datos (mismos pasos que la server action, con 3 aprobados + 1 pendiente de
      prueba): el partido nace `SCHEDULED` con `publicId` de 12 caracteres, y se crean
      asistencias `PENDING` para los 3 aprobados exactamente — el pendiente no recibe
      ninguna. Las reglas "partido en el futuro" y "límite antes del partido" confirmadas.
      La ruta de convocatoria sin sesión redirige a `/login`.
      _Pendiente de tu parte_: entrá a un equipo con plantel aprobado y convocá un
      partido de verdad desde la interfaz.
- [x] **5.2 Detalle del partido (capitán).** Contadores (confirmados / no van /
      pendientes), lista agrupada por estado, link del partido con botón copiar + QR,
      y editar/cancelar partido.
      _Verificado por el agente_ a nivel de base de datos (con 2 capitanes y 3 asistencias
      de prueba, una de cada estado): los contadores agrupan bien (1/1/1); un capitán no
      puede ver el partido de otro (mismo 404 que uno inventado); editar actualiza los
      campos SIN tocar las asistencias existentes (siguen siendo 3); cancelar marca
      CANCELLED sin tocar las asistencias tampoco (quedan como historial) y el partido
      deja de aparecer en la consulta de "próximos partidos". También se probó el
      round-trip completo de la fecha: UTC de la base → valor para precargar el
      `datetime-local` del formulario de edición → UTC de nuevo, exactos.
      `crearPartido` ahora redirige al detalle del partido recién creado, no al equipo.
      _Pendiente de tu parte_: entrá al detalle de un partido, probá copiar el link,
      editar los datos, y cancelarlo.

## Bloque 6 — Confirmación del jugador

- [x] **6.1 Vista pública del partido.** `/partido/[publicId]`: datos del partido, cuenta
      regresiva hasta la hora límite, plantel con el estado de cada uno.
      _Verificado por el agente_, de punta a punta por la interfaz real (esta página es
      pública, no necesita sesión), con un partido de prueba y 3 asistencias (una de cada
      estado): se ven el equipo, el rival, la fecha en español/Santiago, la cancha, el
      cupo, la cuenta regresiva corriendo en vivo (confirmado que avanza segundo a
      segundo, no un número estático) y el plantel con apodo o nombre y su estado (Va /
      No va / Sin responder). También: link inválido muestra "este link no es válido";
      con el plazo vencido muestra "ya venció"; con el partido cancelado muestra "fue
      cancelado" — sin ningún error de hidratación en consola en ninguno de los casos
      (el punto más delicado de esta tarea: la cuenta regresiva usa useSyncExternalStore
      en vez de useState+useEffect, que es lo que evita ese error). noindex confirmado.
      Todos los datos de prueba se limpiaron al terminar.
- [x] **6.2 Voy / No voy.** Server action que valida partido `SCHEDULED` y
      `now < confirmDeadline`, actualiza la asistencia y revalida. Después del límite, solo
      lectura.
      _Verificado por el agente_, de punta a punta por la interfaz real (esta página es
      pública): tocar "Voy" cambia el estado en la base al toque (confirmado el
      `respondedAt`); volver a tocar "No voy" cambia de opinión sin problema; el botón
      activo queda resaltado (probado en claro y en oscuro). Adelantando el
      `confirmDeadline` al pasado en la base y recargando, los botones desaparecen y
      queda de solo lectura con el último estado guardado. Segunda capa de defensa
      confirmada aparte: aunque alguien deje la pestaña abierta desde antes del
      vencimiento, la propia validación del servidor bloquea el intento sin tocar la
      asistencia. También se probó que un `teamMemberId` de otro equipo no tiene
      ninguna asistencia en este partido (no se puede "colar" una respuesta ajena). Se
      reusa el mismo limitador por IP que la 4.1. Los datos de prueba se limpiaron al
      terminar.
- [x] **6.3 Auto-refresh del capitán.** Refresco cada ~20s en el detalle del partido.
      _Verificado por el agente_: como este mecanismo no depende de sesión ni de lógica de
      negocio (es puro timing del navegador), se probó en una página pública descartable
      que montaba el mismo componente. Con un log temporal se contaron los "tick" reales
      del intervalo — exactamente 3, a las 19:03:04, 19:03:24 y 19:03:44, cada 20.0
      segundos justos, sin duplicarse ni desviarse — antes de sacar el log y borrar la
      página de prueba. En el camino se descartó una falsa alarma: la herramienta de red
      mostraba el doble de peticiones de las esperadas, pero resultó ser un artefacto de
      esa herramienta (parece loguear la misma petición dos veces), no un bug real —el
      conteo de `console.log` desde adentro del propio intervalo fue la prueba
      concluyente. Solo se refresca mientras el partido sigue `SCHEDULED` y no venció el
      plazo (no tiene sentido seguir pidiendo datos si ya no puede cambiar nada).
      _Pendiente de tu parte_: dejá abierto el detalle de un partido convocado y mirá
      cómo se actualiza solo si alguien responde desde otro dispositivo.

## Bloque 7 — Salida a la cancha

- [x] **7.1 Pasada mobile-first.** Estados vacíos, loading, errores de formulario,
      botones grandes. Todo se usa desde el celular y en la calle.
      _Verificado por el agente_: botón "Voy/No voy" (el más crítico — lo toca cualquier
      jugador desde su celular) agrandado a `py-3 text-base`, ancho completo en pantallas
      chicas; probado en 375px con nombres deliberadamente largos para forzar el layout,
      en claro y en oscuro, con un click real (vía JS, porque la herramienta de click
      quedó confundida por los reintentos fallidos de HMR de este entorno — no un bug de
      la app: confirmado con la base de datos, que sí quedó `CONFIRMED`). Todos los
      botones primarios pasaron de `py-2.5 text-sm` a `py-3 text-base`; los secundarios
      (aprobar/rechazar/editar/cancelar/regenerar/copiar) de `py-1.5`/`py-2` a `py-2.5`.
      Feedback de carga agregado donde faltaba (Aprobar/Rechazar de un jugador pendiente
      no tenían texto de "cargando"). Estado vacío agregado al detalle del partido para
      cuando todavía no hay nadie en el plantel (antes no mostraba nada). Los inputs ya
      usaban `text-base` desde el principio (evita el zoom automático de iOS al enfocar
      un campo), sin cambios ahí más que un poco más de aire vertical.
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
