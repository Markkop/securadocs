import { checkEnvVars } from "@/lib/env";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { RefreshButton } from "./refresh-button";

export default function SetupPage() {
  const envStatus = checkEnvVars();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Configuração Necessária</CardTitle>
          <CardDescription>
            Configure as variáveis de ambiente para continuar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {envStatus.missing.length > 0 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  Variáveis de Ambiente Faltando:
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                  {envStatus.missing.map((key) => (
                    <li key={key}>
                      <code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">
                        {key}
                      </code>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  Como configurar:
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  <li>
                    Copie o arquivo <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">.env.example</code> para{" "}
                    <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">.env.local</code>
                  </li>
                  <li>
                    Preencha todas as variáveis necessárias no arquivo{" "}
                    <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">.env.local</code>
                  </li>
                  <li>
                    Reinicie o servidor de desenvolvimento após configurar
                  </li>
                </ol>
              </div>

              <div className="rounded-lg bg-gray-50 dark:bg-gray-900/20 p-4">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Recursos necessários:
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <li>
                    <strong>PostgreSQL:</strong> Local via Docker Compose (docker compose up -d postgres)
                  </li>
                  <li>
                    <strong>Nextcloud:</strong> Para storage de arquivos via WebDAV - configure NEXTCLOUD_URL, NEXTCLOUD_USER e NEXTCLOUD_PASSWORD
                  </li>
                  <li>
                    <strong>AUTH_SECRET:</strong> Gere com{" "}
                    <code className="bg-gray-100 dark:bg-gray-900/40 px-1 rounded">
                      openssl rand -base64 32
                    </code>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {envStatus.warnings.length > 0 && (
            <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 p-4">
              <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                Avisos:
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-orange-700 dark:text-orange-300">
                {envStatus.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {envStatus.isValid && (
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4">
              <p className="text-green-800 dark:text-green-200 font-semibold">
                ✓ Todas as variáveis de ambiente estão configuradas!
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <Link href="/">
              <Button variant="outline">Voltar</Button>
            </Link>
            {!envStatus.isValid && <RefreshButton />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
