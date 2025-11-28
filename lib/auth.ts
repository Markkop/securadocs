import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";

let authInstance: ReturnType<typeof betterAuth> | null = null;

export function getAuth() {
  if (!process.env.AUTH_SECRET) {
    throw new Error(
      "AUTH_SECRET não está configurada. Por favor, configure as variáveis de ambiente."
    );
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL não está configurada. Por favor, configure as variáveis de ambiente."
    );
  }

  if (!authInstance) {
    authInstance = betterAuth({
      database: drizzleAdapter(getDb(), {
        provider: "pg",
        schema: schema,
        usePlural: true, // Our tables use plural names (users, sessions, accounts, verifications)
      }),
      secret: process.env.AUTH_SECRET,
      baseURL: process.env.NEXT_PUBLIC_APP_URL,
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false, // MVP: desabilitar verificação de email
      },
    });
  }

  return authInstance;
}

// Export para compatibilidade
export const auth = new Proxy({} as ReturnType<typeof betterAuth>, {
  get(_target, prop) {
    return getAuth()[prop as keyof ReturnType<typeof betterAuth>];
  },
});

export type Session = Awaited<ReturnType<ReturnType<typeof getAuth>["api"]["getSession"]>>;
