"use client";

import { useActionState } from "react";

import { requestMagicLink, type LoginState } from "@/server/actions/auth";

const ESTADO_INICIAL: LoginState = { status: "idle" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    requestMagicLink,
    ESTADO_INICIAL,
  );

  if (state.status === "success") {
    return (
      <div className="mt-8 rounded-md border border-emerald-300 bg-emerald-50 px-4 py-4 text-center dark:border-emerald-800 dark:bg-emerald-950">
        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
          Listo, revisa tu correo
        </p>
        <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
          Te mandamos un link para entrar. Puede demorar un par de minutos —
          revisa también spam.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="tu@correo.cl"
          className="mt-1 w-full rounded-md border border-black/15 bg-transparent px-3 py-2.5 text-base outline-none focus:border-emerald-600 dark:border-white/20"
        />
      </div>

      {state.status === "error" && (
        <p className="text-sm text-red-700 dark:text-red-400">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-emerald-600 px-4 py-3 text-base font-medium text-white transition-opacity disabled:opacity-60"
      >
        {pending ? "Enviando..." : "Mandarme el link"}
      </button>
    </form>
  );
}
