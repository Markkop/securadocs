import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { checkEnvVars } from "@/lib/env";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const envStatus = checkEnvVars();

  if (!envStatus.isValid) {
    redirect("/setup");
  }

  let session;
  try {
    const auth = getAuth();
    session = await auth.api.getSession({
      headers: await import("next/headers").then((m) => m.headers()),
    });
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
    redirect("/login");
  }

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <nav className="border-b bg-white dark:bg-zinc-950">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="text-xl font-bold">
            SecuraDocs
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/files">
              <Button variant="ghost">Arquivos</Button>
            </Link>
            <SignOutButton variant="ghost">Sair</SignOutButton>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
