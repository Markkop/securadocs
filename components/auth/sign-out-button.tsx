"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SignOutButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
  children?: React.ReactNode;
}

export function SignOutButton({ variant = "ghost", className, children }: SignOutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/sign-out", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}), // Envia um objeto vazio em vez de nenhum body
      });

      if (response.ok) {
        // Redireciona para a página inicial após logout
        router.push("/");
        router.refresh();
      } else {
        console.error("Erro ao fazer logout");
        // Mesmo assim, redireciona para a página inicial
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      // Mesmo assim, redireciona para a página inicial
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={handleSignOut}
      disabled={loading}
    >
      {loading ? "Saindo..." : children || "Sair"}
    </Button>
  );
}
