export const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || "default_super_secret",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "default_refresh_secret",
  SUPERVISOR_KEY: process.env.SUPERVISOR_KEY || "default_supervisor_key",
  FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT || "{}",
};

if (!env.JWT_SECRET || !env.SUPERVISOR_KEY) {
  console.warn("WARNING: JWT_SECRET and SUPERVISOR_KEY are not set in .env properly.");
}
