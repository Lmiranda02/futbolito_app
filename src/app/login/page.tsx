import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { BrandCrest } from "@/components/team/team-crest";
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
    <main className="flex w-full flex-1 items-center justify-center px-6 py-[40px] sm:py-[70px]">
      <div className="animar-subir w-full max-w-[420px]">
        <div className="text-center">
          <div className="flex justify-center">
            <BrandCrest size={56} />
          </div>
          <p className="mt-3 font-mono text-[12px] text-tinta/45">
            Arma tu Partido
          </p>
          <h1 className="mt-2 text-[34px] font-extrabold tracking-[-0.03em] text-tinta">
            Ingresa como capitán
          </h1>
          <p className="mx-auto mt-2 max-w-[34ch] text-[15px] text-tinta/60">
            Te mandamos un link al correo. Ábrelo en este mismo aparato y
            quedas dentro — no hay contraseña que olvidar.
          </p>
        </div>

        {errorMessage && (
          <p className="mt-6 rounded-[12px] border border-rojo/35 bg-rojo/10 px-4 py-3 text-center text-[14px] text-rojo">
            {errorMessage}
          </p>
        )}

        <LoginForm />
      </div>
    </main>
  );
}
