import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// MQTT Topics Configuration
export const MQTT_TOPICS = {
  DIGITAL_INPUTS: 'CDC/+/DIGITAL_INPUTS',
  ANALYSER_DATA: 'CDC/+/ANALYSER_DATA',
  ANALOG_INPUT: 'CDC/+/ANALOG_INPUT',
  DEVICE_DATA: 'CDC/+/DEVICE_DATA'
} as const;

export type MqttTopicType = keyof typeof MQTT_TOPICS;

// Environment variables with default values
export const env = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // MQTT
  mqttBrokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
  mqttTopics: MQTT_TOPICS,
  mqttClientId: process.env.MQTT_CLIENT_ID || 'eclb_noname',
  
  // Database
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'mqtt_data',
  },
};

// Validate required environment variables
const validateEnv = () => {
  const requiredEnvVars = [
    'MQTT_BROKER_URL',
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
  ];

  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  );

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(', ')}`
    );
  }
};

// Call validation function
validateEnv();

export default env; 