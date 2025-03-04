import mqtt from 'mqtt';
import { env, MQTT_TOPICS, MqttTopicType } from '../config/env';
import logger from '../config/logger';
import dbService from './db.service';

// Helper function to safely stringify objects containing BigInt
const safeStringify = (obj: any): string => {
  return JSON.stringify(obj, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
};

// Define the expected message format
interface MqttMessage {
  TYPE: string;
  ID: string;
  VALUES: number[];
}

// Map topic types to table names and insert functions
const topicConfig: Record<string, { table: string; insertFn: (deviceId: string, values: number[]) => Promise<any> }> = {
  [MQTT_TOPICS.DIGITAL_INPUTS]: { 
    table: 'digital_inputs',
    insertFn: dbService.insertDigitalInputs
  },
  [MQTT_TOPICS.ANALYSER_DATA]: { 
    table: 'analyzer_data',
    insertFn: dbService.insertAnalyzerData
  },
  [MQTT_TOPICS.ANALOG_INPUT]: { 
    table: 'analog_input',
    insertFn: dbService.insertAnalogInput
  },
  [MQTT_TOPICS.DEVICE_DATA]: { 
    table: 'device_data',
    insertFn: dbService.insertDeviceData
  }
};

// MQTT client instance
let client: mqtt.MqttClient;

// Connect to MQTT broker
export const connectMqtt = (): void => {
  try {
    logger.info(`Connecting to MQTT broker at ${env.mqttBrokerUrl}`);
    logger.debug(`MQTT connection details: 
      - Broker URL: ${env.mqttBrokerUrl}
      - Client ID: ${env.mqttClientId}
      - Topics: ${Object.values(env.mqttTopics).join(', ')}
    `);
    
    client = mqtt.connect(env.mqttBrokerUrl, {
      clientId: env.mqttClientId,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    });

    // Handle connection events
    client.on('connect', () => {
      logger.info('Connected to MQTT broker');
      logger.debug(`MQTT connection successful with client ID: ${env.mqttClientId}`);
      subscribeToTopics();
    });

    client.on('error', (err) => {
      logger.error('MQTT connection error:', err);
      logger.debug(`MQTT connection error details: ${safeStringify(err)}`);
    });

    client.on('reconnect', () => {
      logger.info('Attempting to reconnect to MQTT broker');
      logger.debug(`MQTT reconnection attempt to broker: ${env.mqttBrokerUrl}`);
    });

    client.on('close', () => {
      logger.info('Disconnected from MQTT broker');
      logger.debug('MQTT connection closed');
    });

    // Handle incoming messages
    client.on('message', async (topic, message) => {
      try {
        const messageStr = message.toString();
        logger.debug(`Received message on topic ${topic}: ${messageStr}`);
        
        // Parse the message
        const data: MqttMessage = JSON.parse(messageStr);
        logger.debug(`Parsed message: ${safeStringify(data)}`);
        
        // Validate message format
        if (!data.ID || !Array.isArray(data.VALUES)) {
          logger.warn('Invalid message format:', messageStr);
          logger.debug(`Message validation failed: ID=${data.ID}, VALUES=${safeStringify(data.VALUES)}`);
          return;
        }

        // Process the message
        await processMessage(topic, data);
      } catch (err) {
        logger.error('Error processing MQTT message:', err);
        logger.debug(`MQTT message processing error details: ${safeStringify(err)}`);
      }
    });
  } catch (err) {
    logger.error('Failed to connect to MQTT broker:', err);
    logger.debug(`MQTT connection initialization error: ${safeStringify(err)}`);
    throw err;
  }
};

// Subscribe to all configured topics
const subscribeToTopics = (): void => {
  if (client && client.connected) {
    Object.values(env.mqttTopics).forEach(topic => {
      logger.debug(`Attempting to subscribe to topic: ${topic}`);
      client.subscribe(topic, (err, granted) => {
        if (err) {
          logger.error(`Error subscribing to topic ${topic}:`, err);
          logger.debug(`Subscription error details: ${safeStringify(err)}`);
        } else {
          logger.info(`Subscribed to topic: ${topic}`);
          logger.debug(`Subscription details: ${safeStringify(granted)}`);
        }
      });
    });
  } else {
    logger.warn('Cannot subscribe: MQTT client not connected');
    logger.debug(`Subscribe attempt failed: Client connected=${client?.connected}`);
  }
};

// Get table name and insert function from topic
const getTopicConfig = (topic: string): { table: string; insertFn: (deviceId: string, values: number[]) => Promise<any> } | undefined => {
  // Find matching topic pattern
  const matchingPattern = Object.entries(topicConfig).find(([pattern]) => {
    // Convert MQTT wildcards to regex
    const regexPattern = pattern
      .replace('+', '[^/]+')
      .replace('#', '.*');
    return new RegExp(`^${regexPattern}$`).test(topic);
  });

  return matchingPattern ? matchingPattern[1] : undefined;
};

// Process messages
const processMessage = async (topic: string, data: MqttMessage): Promise<void> => {
  try {
    const config = getTopicConfig(topic);
    if (!config) {
      logger.warn(`No configuration found for topic: ${topic}`);
      return;
    }

    logger.debug(`Processing message for table ${config.table}, device ID: ${data.ID}`);
    logger.debug(`Message details: ID=${data.ID}, VALUES=${safeStringify(data.VALUES)}`);
    
    // Insert data using the specific insert function
    const result = await config.insertFn(data.ID, data.VALUES);
    
    logger.info(`Data stored successfully in ${config.table}`);
    logger.debug(`Database insert result: ${safeStringify(result)}`);
  } catch (err) {
    logger.error(`Error processing message for topic ${topic}:`, err);
    logger.debug(`Message processing error details: ${safeStringify(err)}`);
    throw err;
  }
};

// Disconnect from MQTT broker
export const disconnectMqtt = (): void => {
  if (client && client.connected) {
    logger.debug('Initiating MQTT disconnect sequence');
    client.end(true, () => {
      logger.info('Disconnected from MQTT broker');
      logger.debug('MQTT disconnect completed successfully');
    });
  } else {
    logger.debug(`MQTT disconnect not needed: Client connected=${client?.connected}`);
  }
};

export default {
  connectMqtt,
  disconnectMqtt,
}; 