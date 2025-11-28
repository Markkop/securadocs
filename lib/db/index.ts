import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL não está configurada. Por favor, configure as variáveis de ambiente."
    );
  }

  if (!dbInstance) {
    const sql = neon(process.env.DATABASE_URL);
    dbInstance = drizzle(sql, { schema });
  }

  return dbInstance;
}

// Export para compatibilidade, mas pode retornar null se não configurado
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get() {
    return getDb();
  },
});
