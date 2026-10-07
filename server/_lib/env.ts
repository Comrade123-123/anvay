// Reads server-side settings from the environment. Nothing is hard-coded here; see .env.example for the names.
export function readEnv() {
  return {
    supabaseUrl: process.env.SUPABASE_URL ?? '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    jwtSecret: process.env.JWT_SECRET ?? '',
    demoOtp: process.env.DEMO_OTP ?? '123456',
  };
}

export const hasSupabaseEnv = () => {
  const e = readEnv();
  return Boolean(e.supabaseUrl && e.serviceRoleKey);
};
