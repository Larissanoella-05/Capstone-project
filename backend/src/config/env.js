import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy backend/.env.example to backend/.env and fill it in.`
    );
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  jwtExpiresInMobile: process.env.JWT_EXPIRES_IN_MOBILE || '30d',
  smsProvider: process.env.SMS_PROVIDER || 'log',
  /** Where the web app lives; the tracking link in a guest's SMS starts with this. */
  publicWebUrl: (process.env.PUBLIC_WEB_URL || 'http://localhost:5173').replace(/\/+$/, ''),
  expoAccessToken: process.env.EXPO_ACCESS_TOKEN || undefined,
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
