import { z } from 'zod';

const booleanFromString = z.string().transform((val, ctx) => {
  const normalized = val.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  ctx.addIssue({
    code: 'custom',
    message: `Invalid boolean value: "${val}". Expected "true" or "false".`,
  });
  return z.NEVER;
});

const numberFromString = z.string().transform((val, ctx) => {
  const num = Number(val);
  if (!Number.isNaN(num)) return num;
  ctx.addIssue({
    code: 'invalid_type',
    expected: 'number',
    received: typeof val,
  });
  return z.NEVER;
});

export const configSchema = z.object({
  NODE_ENV: z
    .enum(['local', 'development', 'production', 'test', 'staging', 'e2e'])
    .default('development'),

  // Auth
  JWT_ACCESS_SECRET: z.string().min(1, { error: 'JWT_SECRET is required' }),
  JWT_REFRESH_SECRET: z.string().min(1, { error: 'JWT_SECRET is required' }),

  // DB
  DB_HOST: z.string().min(1, { error: 'DB_HOST is required' }),
  DB_PASSWORD: z.string().min(1, { error: 'DB_PASSWORD is required' }),
  DB_SYNC: booleanFromString.default(false),
  DB_PORT: numberFromString.default(5432),

  POINTS_TO_BALANCE_CONVERTION_RATE: numberFromString,

  // Firebase (optional - only needed for push notifications)
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().email().optional().or(z.literal('')),
});

// Optionally, define the TypeScript type for the validated config
export type Config = z.infer<typeof configSchema>;
