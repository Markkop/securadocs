/**
 * Helper para verificar variáveis de ambiente de forma segura
 */

export interface EnvStatus {
  isValid: boolean;
  missing: string[];
  warnings: string[];
}

export function checkEnvVars(): EnvStatus {
  const required = [
    "DATABASE_URL",
    "AUTH_SECRET",
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];

  const missing: string[] = [];
  const warnings: string[] = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  // Verificar se AUTH_SECRET é seguro
  if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length < 32) {
    warnings.push("AUTH_SECRET deve ter pelo menos 32 caracteres para segurança");
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
  };
}

export function getEnvVar(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue;
}
