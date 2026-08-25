"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Ingresa tu correo.")
  .email("Ese correo no parece válido.");

// Un archivo "use server" solo puede exportar funciones async: ni siquiera
// una constante como { status: "idle" } puede vivir acá. El estado inicial
// se define en el componente cliente que la usa (login-form.tsx).
export type LoginState = {
  status: "idle" | "error" | "success";
  message?: string;
};

/**
 * Manda el magic link al correo del capitán. No crea la fila local del
 * capitán acá: eso pasa en /auth/callback, recién cuando confirma que el
 * link es válido (si lo hiciéramos acá, cualquiera podría crear filas de
 * capitanes solo escribiendo emails ajenos, sin nunca haber entrado).
 */
export async function requestMagicLink(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Correo inválido.",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    console.error("[login] falta la variable NEXT_PUBLIC_SITE_URL");
    return {
      status: "error",
      message: "Hubo un error de configuración. Avísale al capitán del proyecto.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    // No mostramos el motivo exacto: podría revelar si un correo existe o
    // no, o detalles internos de Supabase. El detalle real queda en los
    // logs del servidor.
    console.error("[login] signInWithOtp falló:", error.message);
    return {
      status: "error",
      message: "No pudimos enviar el link. Intenta de nuevo en un momento.",
    };
  }

  return { status: "success" };
}
