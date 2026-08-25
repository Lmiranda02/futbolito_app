import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getCaptain } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Ingresar",
};

const MENSAJES_ERROR: Record<string, string> = {
  link_invalido:
    "Ese link ya no sirve. Puede que haya vencido o que ya lo hayas usado — pide uno nuevo.",
};

export default async function LoginPage(props: PageProps<"/login">) {
  // Si ya hay sesión, no tiene sentido mostrarle el formulario de nuevo.
  const captain = await getCaptain();
  if (captain) {
    redirect("/dashboard");
  }

  const searchParams = await props.searchParams;
  const errorParam =
    typeof searchParams.error === "string" ? searchParams.error : undefined;
  const errorMessage = errorParam ? MENSAJES_ERROR[errorParam] : undefined;

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-emerald-600">
            Arma tu Partido
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">
            Ingresa como capitán
          </h1>
          <p className="mt-2 text-sm opacity-70">
            Te mandamos un link a tu correo. Ábrelo desde este mismo
            dispositivo para entrar.
          </p>
        </div>

        {errorMessage && (
          <p className="mt-6 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
            {errorMessage}
          </p>
        )}

        <LoginForm />
      </div>
    </main>
  );
}
