import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { checkEnvVars } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function DashboardPage() {
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
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Bem-vindo, {session.user.name}!
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Meus Arquivos</CardTitle>
            <CardDescription>Gerencie seus arquivos</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/files">
              <Button variant="outline" className="w-full">
                Ver Arquivos
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload</CardTitle>
            <CardDescription>Envie novos arquivos</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/files">
              <Button className="w-full">Fazer Upload</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
            <CardDescription>Gerencie sua conta</CardDescription>
          </CardHeader>
          <CardContent>
            <SignOutButton variant="outline" className="w-full">
              Sair
            </SignOutButton>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
