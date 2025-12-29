import pino from 'pino';
import { Config } from '../config/Config';

export const logger = pino({
  level: Config.LOG_LEVEL,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
    },
  },
});
