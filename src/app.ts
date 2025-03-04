import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env';
import logger from './config/logger';
import dataRoutes from './routes/data.routes';

// Helper function to safely stringify objects containing BigInt
const safeStringify = (obj: any): string => {
  return JSON.stringify(obj, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
};

// Create Express application
const app: Application = express();

// Log application initialization
logger.debug('Initializing Express application');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (env.nodeEnv === 'development') {
  logger.debug('Setting up Morgan logger for development');
  app.use(morgan('dev', { stream: (logger as any).stream }));
} else {
  logger.debug('Setting up Morgan logger for production');
  app.use(morgan('combined', { stream: (logger as any).stream }));
}

// Routes
logger.debug('Setting up API routes');
app.use('/api', dataRoutes);

// Root route
app.get('/', (req: Request, res: Response) => {
  logger.debug(`Handling root route request: ${req.method} ${req.originalUrl}`);
  res.json({
    message: 'MQTT to MariaDB API',
    version: '1.0.0',
  });
  logger.debug('Root route response sent');
});

// 404 handler
app.use((req: Request, res: Response) => {
  logger.debug(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
  logger.debug('404 response sent');
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);
  logger.debug(`Unhandled error details: ${safeStringify(err)}`);
  logger.debug(`Error occurred on: ${req.method} ${req.originalUrl}`);
  
  res.status(500).json({
    success: false,
    error: 'Server Error',
  });
  
  logger.debug('500 error response sent');
});

logger.debug('Express application initialized successfully');

export default app; 