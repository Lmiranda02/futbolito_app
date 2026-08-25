import { requireCaptain } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  // Segunda cerradura (la primera es src/proxy.ts, que solo refresca la
  // sesión): sin capitán logueado, esto redirige a /login antes de
  // renderizar nada del dashboard.
  const captain = await requireCaptain();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-black/10 px-6 py-4 dark:border-white/10">
        <span className="text-sm font-semibold">Arma tu Partido</span>
        <div className="flex items-center gap-3 text-sm">
          <span className="opacity-70">{captain.email}</span>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
