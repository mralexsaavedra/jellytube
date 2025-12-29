import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PROXY_URL: z.string().url().default('http://jellytube-proxy:3000'),
  // OUTPUT_DIR removed as it is now hardcoded
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

export type ConfigType = z.infer<typeof envSchema> & { OUTPUT_DIR: string };

const requestConfig = envSchema.parse(process.env);

export const Config: ConfigType = {
  ...requestConfig,
  OUTPUT_DIR: './output',
};
