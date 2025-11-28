import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { logAuditEvent } from "@/lib/audit/logger";

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
      // Hooks for audit logging
      hooks: {
        after: createAuthMiddleware(async (ctx) => {
          // Log LOGIN event when a new session is created via sign-in
          if (ctx.path.startsWith("/sign-in") && ctx.context.newSession) {
            const ipAddress =
              ctx.request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
              ctx.request?.headers.get("x-real-ip") ||
              undefined;
            
            await logAuditEvent({
              userId: ctx.context.newSession.user.id,
              action: "LOGIN",
              resourceType: "user",
              resourceId: ctx.context.newSession.user.id,
              ipAddress,
              metadata: {
                userAgent: ctx.request?.headers.get("user-agent"),
              },
            });
          }
        }),
      },
      databaseHooks: {
        session: {
          delete: {
            after: async (session) => {
              // Log LOGOUT event when session is deleted
              await logAuditEvent({
                userId: session.userId,
                action: "LOGOUT",
                resourceType: "user",
                resourceId: session.userId,
              });
            },
          },
        },
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
