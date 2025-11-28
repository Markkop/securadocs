import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import { checkEnvVars } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { RecentActivity } from "@/components/dashboard/recent-activity";

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

      {/* Stats Cards */}
      <div className="mb-8">
        <DashboardStats />
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Ações Rápidas</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Meus Arquivos</CardTitle>
                <CardDescription>Gerencie seus arquivos e pastas</CardDescription>
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
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Upload</CardTitle>
                <CardDescription>Envie novos arquivos</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/files">
                  <Button className="w-full">Fazer Upload</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Auditoria</CardTitle>
                <CardDescription>Histórico de atividades</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/audit">
                  <Button variant="outline" className="w-full">
                    Ver Logs
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <RecentActivity />
      </div>
    </div>
  );
}
