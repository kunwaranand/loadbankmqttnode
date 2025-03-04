import mqtt from 'mqtt';
import { env, MQTT_TOPICS } from '../config/env';
import logger from '../config/logger';
import dbService from './db.service';

// Helper function to safely stringify objects containing BigInt
const safeStringify = (obj: any): string => {
  return JSON.stringify(obj, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
};

// Define the message format
interface MqttMessage {
  TYPE: string;
  ID: string;
  RNUM?:number;
  IP?:string;
  VALUES?: number[];
}

// MQTT client instance
let client: mqtt.MqttClient;

// Connect to MQTT broker
export const connectMqtt = (): void => {
  try {
    logger.info(`Connecting to MQTT broker at ${env.mqttBrokerUrl}`);
    
    client = mqtt.connect(env.mqttBrokerUrl, {
      clientId: env.mqttClientId,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    });

    // Handle connection events
    client.on('connect', () => {
      logger.info('Connected to MQTT broker');
      subscribeToTopics();
    });

    client.on('error', (err) => {
      logger.error('MQTT connection error:', err);
      logger.debug(`Error details: ${safeStringify(err)}`);
    });

    client.on('message', handleMessage);

    client.on('reconnect', () => {
      logger.info('Attempting to reconnect to MQTT broker');
    });

    client.on('close', () => {
      logger.info('Disconnected from MQTT broker');
    });
  } catch (err) {
    logger.error('Failed to connect to MQTT broker:', err);
    logger.debug(`Connection error details: ${safeStringify(err)}`);
    throw err;
  }
};

// Subscribe to all topics
const subscribeToTopics = (): void => {
  if (!client?.connected) {
    logger.warn('Cannot subscribe: MQTT client not connected');
    return;
  }

  Object.values(MQTT_TOPICS).forEach(topic => {
    client.subscribe(topic, (err) => {
      if (err) {
        logger.error(`Error subscribing to ${topic}:`, err);
      } else {
        logger.info(`Subscribed to topic: ${topic}`);
      }
    });
  });
};

// Message handler
const handleMessage = async (topic: string, message: Buffer): Promise<void> => {
  try {
    const messageStr = message.toString();
    logger.debug(`Received message on topic ${topic}: ${messageStr}`);
    
    const data: MqttMessage = JSON.parse(messageStr);
    
    // Validate basic message format
    if (!data.ID) {
      logger.warn('Invalid message format - missing ID:', messageStr);
      return;
    }

    // Route message to appropriate handler based on topic pattern
    if (topic.includes('/DIGITAL_INPUTS')) {
      await handleDigitalInputs(data);
    } else if (topic.includes('/ANALYSER_DATA')) {
      await handleAnalyzerData(data);
    } else if (topic.includes('/ANALOG_INPUT')) {
      await handleAnalogInput(data);
    } else if (topic.includes('/DEVICE_DATA')) {
      await handleDeviceData(data);
    } else {
      logger.warn(`Unhandled topic: ${topic}`);
    }
  } catch (err) {
    logger.error('Error processing message:', err);
    logger.debug(`Processing error details: ${safeStringify(err)}`);
  }
};

// Individual topic handlers
const handleDigitalInputs = async (data: MqttMessage): Promise<void> => {
  try {
    logger.debug(`Processing digital inputs: ${safeStringify(data)}`);
    await dbService.insertDigitalInputs(data.ID, data.VALUES!);
    logger.info(`Digital inputs stored for device ${data.ID}`);
  } catch (err) {
    logger.error('Error handling digital inputs:', err);
    logger.debug(`Error details: ${safeStringify(err)}`);
  }
};

const handleAnalyzerData = async (data: MqttMessage): Promise<void> => {
  try {
    logger.debug(`Processing analyzer data: ${safeStringify(data)}`);
    await dbService.insertAnalyzerData(data.ID, data.VALUES!);
    logger.info(`Analyzer data stored for device ${data.ID}`);
  } catch (err) {
    logger.error('Error handling analyzer data:', err);
    logger.debug(`Error details: ${safeStringify(err)}`);
  }
};

const handleAnalogInput = async (data: MqttMessage): Promise<void> => {
  try {
    logger.debug(`Processing analog input: ${safeStringify(data)}`);
    await dbService.insertAnalogInputs(data.ID, data.VALUES!);
    logger.info(`Analog input stored for device ${data.ID}`);
  } catch (err) {
    logger.error('Error handling analog input:', err);
    logger.debug(`Error details: ${safeStringify(err)}`);
  }
};

const handleDeviceData = async (data: MqttMessage): Promise<void> => {
  try {
    logger.debug(`Processing device data: ${safeStringify(data)}`);
    await dbService.insertDeviceData(data.ID, data.RNUM, data.IP);
    logger.info(`Device data stored for device ${data.ID}`);
  } catch (err) {
    logger.error('Error handling device data:', err);
    logger.debug(`Error details: ${safeStringify(err)}`);
  }
};

// Disconnect from MQTT broker
export const disconnectMqtt = (): void => {
  if (client?.connected) {
    logger.debug('Initiating MQTT disconnect');
    client.end(true, () => {
      logger.info('Disconnected from MQTT broker');
    });
  }
};

export default {
  connectMqtt,
  disconnectMqtt,
}; 