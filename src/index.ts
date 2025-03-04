import app from './app';
import { env } from './config/env';
import logger from './config/logger';
import dbService from './services/db.service';
import mqttService from './services/mqtt.service';

// Helper function to safely stringify objects containing BigInt
const safeStringify = (obj: any): string => {
  return JSON.stringify(obj, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
};

// Log application startup
logger.debug('Application starting up');
logger.debug(`Environment: ${env.nodeEnv}`);
logger.debug(`Server port: ${env.port}`);
logger.debug(`MQTT topics: ${Object.values(env.mqttTopics).join(', ')}`);

// Process error handling
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
  logger.debug(`Uncaught exception details: ${safeStringify(err)}`);
  logger.debug(`Error stack: ${err.stack}`);
  logger.debug('Exiting process with code 1');
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection:', err);
  logger.debug(`Unhandled rejection details: ${safeStringify(err)}`);
  logger.debug('Exiting process with code 1');
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');
  logger.debug('Graceful shutdown initiated');
  
  // Disconnect from MQTT
  logger.debug('Disconnecting from MQTT broker');
  mqttService.disconnectMqtt();
  
  // Close server and exit
  logger.debug('Exiting process with code 0');
  process.exit(0);
};

// Handle termination signals
process.on('SIGTERM', () => {
  logger.debug('Received SIGTERM signal');
  gracefulShutdown();
});

process.on('SIGINT', () => {
  logger.debug('Received SIGINT signal');
  gracefulShutdown();
});

// Start the server
const startServer = async () => {
  try {
    logger.debug('Starting server initialization');
    
    // Initialize database
    logger.debug('Initializing database');
    await dbService.initDatabase();
    logger.debug('Database initialization completed');
    
    // Connect to MQTT broker
    logger.debug('Connecting to MQTT broker');
    mqttService.connectMqtt();
    logger.debug('MQTT connection initialized');
    
    // Start Express server
    logger.debug(`Starting Express server on port ${env.port}`);
    const server = app.listen(env.port, () => {
      logger.info(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
      logger.debug(`Server startup completed at ${new Date().toISOString()}`);
      logger.debug(`Server is listening for connections on port ${env.port}`);
    });
    
    // Log server events
    server.on('error', (err) => {
      logger.error('Server error:', err);
      logger.debug(`Server error details: ${safeStringify(err)}`);
    });
    
  } catch (err) {
    logger.error('Failed to start server:', err);
    logger.debug(`Server startup error details: ${safeStringify(err)}`);
    logger.debug(`Error stack: ${(err as Error).stack}`);
    logger.debug('Exiting process with code 1');
    process.exit(1);
  }
};

// Start the application
logger.debug('Calling startServer function');
startServer(); 