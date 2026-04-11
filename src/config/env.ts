/**
 * Valida e exporta todas as variáveis de ambiente da aplicação.
 * Falha em tempo de boot se alguma variável obrigatória estiver ausente.
 */

const required = (key: string): string => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`[ENV] Variável de ambiente obrigatória não encontrada: ${key}`);
  }
  return value;
};

const optional = (key: string, fallback = ""): string => {
  return import.meta.env[key] || fallback;
};

export const env = {
  supabase: {
    url: required("VITE_SUPABASE_URL"),
    anonKey: required("VITE_SUPABASE_ANON_KEY"),
  },
  ai: {
    provider: optional("VITE_AI_PROVIDER", "gemini"),
    apiKey: optional("VITE_AI_API_KEY"),
  },
  zapi: {
    instance: optional("VITE_ZAPI_INSTANCE"),
    token: optional("VITE_ZAPI_TOKEN"),
  },
} as const;
