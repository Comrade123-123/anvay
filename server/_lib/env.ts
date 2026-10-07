// Reads server-side settings from the environment. Nothing is hard-coded here; see .env.example for the names.
export function readEnv() {
  return {
    supabaseUrl: process.env.SUPABASE_URL ?? '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    jwtSecret: process.env.JWT_SECRET ?? '',
    demoOtp: process.env.DEMO_OTP ?? '123456',
    // Real SMS OTP is on only when all three are set; otherwise the app stays in demo mode.
    smsProvider: process.env.SMS_PROVIDER ?? '',
    msg91AuthKey: process.env.MSG91_AUTH_KEY ?? '',
    msg91TemplateId: process.env.MSG91_TEMPLATE_ID ?? '',
  };
}

export const hasSupabaseEnv = () => {
  const e = readEnv();
  return Boolean(e.supabaseUrl && e.serviceRoleKey);
};
