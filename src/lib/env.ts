export function getPublicEnv() {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  };
}

export function getServerEnv() {
  return {
    ...getPublicEnv(),
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    rateLimitSecret: process.env.RATE_LIMIT_SECRET ?? "local-rate-limit",
  };
}

export function hasSupabasePublicEnv() {
  const env = getPublicEnv();
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function hasSupabaseServerEnv() {
  const env = getServerEnv();
  return Boolean(
    env.supabaseUrl &&
      env.supabaseAnonKey &&
      env.supabaseServiceRoleKey,
  );
}
