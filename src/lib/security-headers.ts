/**
 * Cabeceras de seguridad HTTP, aplicadas en src/proxy.ts a cada respuesta
 * que no sea un asset estático.
 *
 * La CSP necesita un "nonce" nuevo en cada request (por eso se arma acá y
 * no en next.config.ts, que solo puede escribir cabeceras fijas). El nonce
 * viaja en el propio header de la CSP; Next.js lo detecta ahí y lo aplica
 * automáticamente a los <script> que él mismo inyecta para hidratar la
 * página (los "self.__next_f.push(...)" del App Router). Si en algún
 * momento agregamos un <script> propio (un pixel de analytics, por
 * ejemplo), tiene que llevar el mismo nonce a mano — por eso también se
 * reenvía en el header `x-nonce` hacia los Server Components, disponible
 * vía `(await headers()).get("x-nonce")`.
 */
export function buildContentSecurityPolicy(nonce: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  // Solo en desarrollo: React usa eval() para reconstruir stack traces de
  // depuración en este modo ("React will never use eval() in production
  // mode", como avisa la propia consola). Sin esto, la app funciona igual
  // pero el navegador tira una advertencia en cada recarga.
  const unsafeEvalEnDev =
    process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";

  return [
    "default-src 'self'",
    // 'strict-dynamic' es lo que permite que los scripts que Next carga
    // dinámicamente (los chunks de cada ruta) se ejecuten sin tener que
    // listarlos uno por uno: confía en cualquier script que haya sido
    // agregado por otro script ya confiado por el nonce.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${unsafeEvalEnDev}`,
    // next/font inyecta un <style> inline con las reglas @font-face.
    // Un <style> inline no puede ejecutar JavaScript, así que el riesgo de
    // permitirlo es bajo comparado con hacer lo mismo en script-src.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self'${supabaseUrl ? ` ${supabaseUrl}` : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

/** Aplica las cabeceras de seguridad "estáticas" (no dependen del request). */
export function applySecurityHeaders(headers: globalThis.Headers, nonce: string) {
  headers.set("Content-Security-Policy", buildContentSecurityPolicy(nonce));
  // Refuerza frame-ancestors para navegadores viejos que no soportan CSP nivel 2.
  headers.set("X-Frame-Options", "DENY");
  // Evita que el navegador intente adivinar el tipo de un archivo servido
  // con un Content-Type distinto (ej. tratar un .txt subido como si fuera
  // HTML/JS ejecutable).
  headers.set("X-Content-Type-Options", "nosniff");
  // No mandar la URL completa (que puede incluir el inviteCode o el
  // publicId de un partido) como referrer a un sitio de terceros.
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // La app no usa cámara, micrófono ni geolocalización en ninguna pantalla.
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  // Solo tiene efecto sobre HTTPS (los navegadores ignoran este header si
  // llega por HTTP plano), así que es inofensivo dejarlo también en dev.
  headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
}
