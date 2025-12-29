import { Config } from '../config/Config';

const levels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = levels[Config.LOG_LEVEL as keyof typeof levels] || levels.info;

const shouldLog = (level: keyof typeof levels) => levels[level] >= currentLevel;

export const logger = {
  debug: (obj: object | string, msg?: string) => {
    if (shouldLog('debug'))
      console.debug(new Date().toISOString(), '[DEBUG]', msg || obj, msg ? obj : '');
  },
  info: (obj: object | string, msg?: string) => {
    if (shouldLog('info'))
      console.info(new Date().toISOString(), '[INFO]', msg || obj, msg ? obj : '');
  },
  warn: (obj: object | string, msg?: string) => {
    if (shouldLog('warn'))
      console.warn(new Date().toISOString(), '[WARN]', msg || obj, msg ? obj : '');
  },
  error: (obj: object | string, msg?: string) => {
    if (shouldLog('error'))
      console.error(new Date().toISOString(), '[ERROR]', msg || obj, msg ? obj : '');
  },
};
