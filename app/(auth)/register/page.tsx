"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
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

    // Validação básica no cliente
    if (!name || name.trim().length < 2) {
      setError("O nome deve ter pelo menos 2 caracteres.");
      setLoading(false);
      return;
    }

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
      const response = await fetch("/api/auth/sign-up/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
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
          `Erro ao criar conta (${response.status}). Verifique os dados informados.`;
        setError(String(errorMessage));
        console.error("Erro na resposta:", { status: response.status, data });
        return;
      }

      // Sucesso - redireciona para o dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Erro ao criar conta:", err);
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
          <CardTitle>Criar Conta</CardTitle>
          <CardDescription>
            Crie uma conta para começar a usar o SecuraDocs
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
              <label htmlFor="name" className="text-sm font-medium">
                Nome
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
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
                minLength={8}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando conta..." : "Criar Conta"}
            </Button>
            <div className="text-center text-sm">
              Já tem uma conta?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Faça login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
