import * as winston from 'winston';
import 'winston-daily-rotate-file';

const dailyRotateFileTransport = new winston.transports.DailyRotateFile({
  filename: 'log/slack-bot-%DATE%.log',
  datePattern: 'YYYY-MM-DD-HH',
  zippedArchive: false,
  maxSize: '20m',
  maxFiles: '28d',
  level: 'silly',
  format: winston.format.combine(winston.format.splat(), winston.format.json()),
});

const consoleTransport = new winston.transports.Console({
  level: 'silly',
  format: winston.format.combine(
    winston.format.splat(),
    winston.format.colorize(),
    winston.format.simple(),
  ),
});

export const logger = winston.createLogger({
  transports: [dailyRotateFileTransport, consoleTransport],
});

export const getLogger = (scope: string) => logger.child({ scope });
