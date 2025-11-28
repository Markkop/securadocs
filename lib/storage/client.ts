import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseClientInstance: SupabaseClient | null = null;
let supabaseAdminInstance: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(
      "Configurações do Supabase não estão completas. Por favor, configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  if (!supabaseClientInstance) {
    supabaseClientInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }

  return supabaseClientInstance;
}

export function getSupabaseAdmin() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Configurações do Supabase não estão completas. Por favor, configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  return supabaseAdminInstance;
}

// Exports para compatibilidade
export const supabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getSupabaseClient()[prop as keyof SupabaseClient];
  },
});

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getSupabaseAdmin()[prop as keyof SupabaseClient];
  },
});

// Bucket name
export const BUCKET_NAME = "securdocs-files";
