"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Normalizar email (trim e lowercase)
    const normalizedEmail = email.trim().toLowerCase();

    // Validação básica de email no cliente
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setError("Por favor, insira um email válido.");
      setLoading(false);
      return;
    }

    if (!password || password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      // Tenta ler o corpo da resposta como texto primeiro
      const responseText = await response.text();
      
      // Tenta fazer parse do JSON, se possível
      let data: Record<string, unknown> = {};
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          // Se não for JSON válido, mostra o texto da resposta
          console.error("Resposta não é JSON válido:", responseText);
          if (!response.ok) {
            setError(`Erro do servidor (${response.status}): ${responseText || response.statusText}`);
            return;
          }
        }
      }

      if (!response.ok) {
        const errorMessage = 
          data.error || 
          data.message || 
          data.code ||
          `Erro ao fazer login (${response.status}). Verifique suas credenciais.`;
        setError(String(errorMessage));
        console.error("Erro na resposta:", { status: response.status, data });
        return;
      }

      // Sucesso - redireciona para o dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Erro ao fazer login:", err);
      setError(
        err instanceof Error
          ? `Erro: ${err.message}`
          : "Erro ao conectar com o servidor. Verifique sua conexão."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Entre com suas credenciais para acessar o SecuraDocs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            <div className="text-center text-sm">
              Não tem uma conta?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Registre-se
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
