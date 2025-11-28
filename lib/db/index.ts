import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DrizzleInstance = ReturnType<typeof drizzle>;
let dbInstance: DrizzleInstance | null = null;

export function getDb(): DrizzleInstance {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL não está configurada. Por favor, configure as variáveis de ambiente."
    );
  }

  if (!dbInstance) {
    const client = postgres(process.env.DATABASE_URL);
    dbInstance = drizzle(client, { schema });
  }

  return dbInstance;
}

// Export para compatibilidade
export const db = new Proxy({} as DrizzleInstance, {
  get(_target, prop) {
    const instance = getDb();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (instance as any)[prop];
  },
});
