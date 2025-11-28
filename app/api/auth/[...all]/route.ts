import { getAuth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const auth = getAuth();
    const handler = toNextJsHandler(auth);
    return handler.GET(request);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Configuração de autenticação não está completa. Verifique as variáveis de ambiente.",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = getAuth();
    const handler = toNextJsHandler(auth);
    return handler.POST(request);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Configuração de autenticação não está completa. Verifique as variáveis de ambiente.",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
