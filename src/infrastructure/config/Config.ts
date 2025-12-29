import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PIPED_URL: z.string().url().default('https://piped.video'),
  OUTPUT_DIR: z.string().default('./output'),
  CONCURRENCY_LIMIT: z.coerce.number().int().positive().default(2),
  MAX_VIDEOS: z.coerce.number().int().positive().default(50),
  SKIP_SHORTS: z
    .string()
    .transform((val) => val === 'true')
    .or(z.boolean())
    .default(false),
  SKIP_LIVES: z
    .string()
    .transform((val) => val === 'true')
    .or(z.boolean())
    .default(false),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type ConfigType = z.infer<typeof envSchema>;

export const Config = envSchema.parse(process.env);
