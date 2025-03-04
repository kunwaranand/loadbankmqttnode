import winston from 'winston';
import { env } from './env';

// Define log format with more details for debugging
const logFormat = winston.format.printf(
  ({ level, message, timestamp, ...metadata }) => {
    let metaStr = '';
    if (Object.keys(metadata).length > 0) {
      metaStr = JSON.stringify(metadata);
    }
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  }
);

// Create logger instance
const logger = winston.createLogger({
  level: env.nodeEnv === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'mqtt-mariadb-app' },
  transports: [
    // Console transport with colorized output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        logFormat
      ),
    }),
    // File transports
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.json()
      )
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.json()
      )
    }),
    // Dedicated debug log file
    new winston.transports.File({ 
      filename: 'logs/debug.log', 
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.json()
      )
    }),
  ],
  // Exit on error
  exitOnError: false,
});

// Add stream for Morgan middleware
interface LoggerStream {
  write(message: string): void;
}

const loggerStream: LoggerStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Attach the stream to the logger object
(logger as any).stream = loggerStream;

// Log logger initialization
logger.debug('Logger initialized');

export default logger; 