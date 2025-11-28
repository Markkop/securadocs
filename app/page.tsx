import { redirect } from "next/navigation";
import { checkEnvVars } from "@/lib/env";
import { getAuth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const envStatus = checkEnvVars();

  // Se as variáveis de ambiente não estão configuradas, mostrar página de setup
  if (!envStatus.isValid) {
    redirect("/setup");
  }

  try {
    const auth = getAuth();
    const session = await auth.api.getSession({
      headers: await import("next/headers").then((m) => m.headers()),
    });

    if (session) {
      redirect("/dashboard");
    }
  } catch (error) {
    // Se houver erro ao verificar sessão, ainda mostrar a página inicial
    console.error("Erro ao verificar sessão:", error);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black p-4">
      <main className="flex w-full max-w-3xl flex-col items-center gap-8 py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            SecuraDocs - Secure File Storage Platform
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Plataforma segura de armazenamento de arquivos com controle de acesso granular e compartilhamento.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <Link href="/login">
            <Button size="lg">Entrar</Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline">
              Criar Conta
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
