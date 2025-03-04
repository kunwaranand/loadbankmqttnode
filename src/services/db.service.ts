import mariadb from 'mariadb';
import { env } from '../config/env';
import logger from '../config/logger';

// Helper function to safely stringify objects containing BigInt
const safeStringify = (obj: any): string => {
  return JSON.stringify(obj, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
};

// Create a connection pool
const pool = mariadb.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  connectionLimit: 5,
});

// Log database configuration (without sensitive data)
logger.debug(`Database configuration: 
  - Host: ${env.db.host}
  - Port: ${env.db.port}
  - User: ${env.db.user}
  - Database: ${env.db.database}
  - Connection Limit: 5
`);

// Initialize database by creating tables if they don't exist
export const initDatabase = async (): Promise<void> => {
  let conn;
  try {
    logger.debug('Attempting to get database connection from pool');
    conn = await pool.getConnection();
    logger.info('Connected to MariaDB database');
    logger.debug(`Database connection established: ${conn.threadId}`);

    // Create tables for different data types
    const createTableQueries = {
      digital_inputs: `
        CREATE TABLE IF NOT EXISTS digital_inputs (
          record_id BIGINT NOT NULL AUTO_INCREMENT,
          id VARCHAR(50) NOT NULL,
          ip1 BOOLEAN,
          ip2 BOOLEAN,
          ip3 BOOLEAN,
          ip4 BOOLEAN,
          ip5 BOOLEAN,
          ip6 BOOLEAN,
          ip7 BOOLEAN,
          ip8 BOOLEAN,
          ip9 BOOLEAN,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (record_id)
        )
      `,
      analyzer_data: `
        CREATE TABLE IF NOT EXISTS analyzer_data (
          record_id BIGINT NOT NULL AUTO_INCREMENT,
          id VARCHAR(50) NOT NULL,
          ip1 BOOLEAN,
          ip2 BOOLEAN,
          ip3 BOOLEAN,
          ip4 BOOLEAN,
          ip5 BOOLEAN,
          ip6 BOOLEAN,
          ip7 BOOLEAN,
          ip8 BOOLEAN,
          ip9 BOOLEAN,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (record_id)
        )
      `,
      analog_input: `
        CREATE TABLE IF NOT EXISTS analog_input (
          record_id BIGINT NOT NULL AUTO_INCREMENT,
          id VARCHAR(50) NOT NULL,
          ip1 BOOLEAN,
          ip2 BOOLEAN,
          ip3 BOOLEAN,
          ip4 BOOLEAN,
          ip5 BOOLEAN,
          ip6 BOOLEAN,
          ip7 BOOLEAN,
          ip8 BOOLEAN,
          ip9 BOOLEAN,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (record_id)
        )
      `,
      device_data: `
        CREATE TABLE IF NOT EXISTS device_data (
          record_id BIGINT NOT NULL AUTO_INCREMENT,
          id VARCHAR(50) NOT NULL,
          ip1 BOOLEAN,
          ip2 BOOLEAN,
          ip3 BOOLEAN,
          ip4 BOOLEAN,
          ip5 BOOLEAN,
          ip6 BOOLEAN,
          ip7 BOOLEAN,
          ip8 BOOLEAN,
          ip9 BOOLEAN,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (record_id)
        )
      `
    };

    for (const [tableName, query] of Object.entries(createTableQueries)) {
      logger.debug(`Creating table if not exists: ${tableName}`);
      const result = await conn.query(query);
      logger.debug(`Table creation result for ${tableName}: ${safeStringify(result)}`);
    }

    logger.info('All database tables initialized');
  } catch (err) {
    logger.error('Error initializing database:', err);
    logger.debug(`Database initialization error details: ${safeStringify(err)}`);
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

// Digital Inputs Functions
export const insertDigitalInputs = async (deviceId: string, values: number[]): Promise<any> => {
  return insertData('digital_inputs', deviceId, values);
};

export const getAllDigitalInputs = async (): Promise<any[]> => {
  return getAllData('digital_inputs');
};

export const getLatestDigitalInputs = async (): Promise<any> => {
  return getLatestData('digital_inputs');
};

// Analyzer Data Functions
export const insertAnalyzerData = async (deviceId: string, values: number[]): Promise<any> => {
  return insertData('analyzer_data', deviceId, values);
};

export const getAllAnalyzerData = async (): Promise<any[]> => {
  return getAllData('analyzer_data');
};

export const getLatestAnalyzerData = async (): Promise<any> => {
  return getLatestData('analyzer_data');
};

// Analog Input Functions
export const insertAnalogInput = async (deviceId: string, values: number[]): Promise<any> => {
  return insertData('analog_input', deviceId, values);
};

export const getAllAnalogInput = async (): Promise<any[]> => {
  return getAllData('analog_input');
};

export const getLatestAnalogInput = async (): Promise<any> => {
  return getLatestData('analog_input');
};

// Device Data Functions
export const insertDeviceData = async (deviceId: string, values: number[]): Promise<any> => {
  return insertData('device_data', deviceId, values);
};

export const getAllDeviceData = async (): Promise<any[]> => {
  return getAllData('device_data');
};

export const getLatestDeviceData = async (): Promise<any> => {
  return getLatestData('device_data');
};

// Generic data functions (private)
const insertData = async (
  tableName: string,
  deviceId: string,
  values: number[]
): Promise<any> => {
  let conn;
  try {
    logger.debug(`Attempting to insert data into ${tableName}: id=${deviceId}, values=${safeStringify(values)}`);
    conn = await pool.getConnection();
    
    // Ensure we have 9 values, pad with zeros if needed
    const paddedValues = [...values];
    while (paddedValues.length < 9) {
      paddedValues.push(0);
    }
    
    const insertQuery = `
      INSERT INTO ${tableName} 
      (id, ip1, ip2, ip3, ip4, ip5, ip6, ip7, ip8, ip9) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await conn.query(
      insertQuery,
      [deviceId, ...paddedValues]
    );
    
    logger.debug(`Insert result: ${safeStringify(result)}`);
    return result;
  } catch (err) {
    logger.error(`Error inserting data into ${tableName}:`, err);
    logger.debug(`Database insert error details: ${safeStringify(err)}`);
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

const getAllData = async (tableName: string): Promise<any[]> => {
  let conn;
  try {
    logger.debug(`Attempting to retrieve all data from ${tableName}`);
    conn = await pool.getConnection();
    
    const query = `SELECT * FROM ${tableName} ORDER BY timestamp DESC`;
    const rows = await conn.query(query);
    
    logger.debug(`Query returned ${rows.length} rows from ${tableName}`);
    return rows;
  } catch (err) {
    logger.error(`Error getting data from ${tableName}:`, err);
    logger.debug(`Database query error details: ${safeStringify(err)}`);
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

const getLatestData = async (tableName: string): Promise<any> => {
  let conn;
  try {
    logger.debug(`Attempting to retrieve latest data from ${tableName}`);
    conn = await pool.getConnection();
    
    const query = `SELECT * FROM ${tableName} ORDER BY timestamp DESC LIMIT 1`;
    const rows = await conn.query(query);
    
    return rows[0] || null;
  } catch (err) {
    logger.error(`Error getting latest data from ${tableName}:`, err);
    logger.debug(`Database query error details: ${safeStringify(err)}`);
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

export default {
  initDatabase,
  // Digital Inputs
  insertDigitalInputs,
  getAllDigitalInputs,
  getLatestDigitalInputs,
  // Analyzer Data
  insertAnalyzerData,
  getAllAnalyzerData,
  getLatestAnalyzerData,
  // Analog Input
  insertAnalogInput,
  getAllAnalogInput,
  getLatestAnalogInput,
  // Device Data
  insertDeviceData,
  getAllDeviceData,
  getLatestDeviceData
}; 