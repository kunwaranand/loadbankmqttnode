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

// Initialize database tables
export const initDatabase = async (): Promise<void> => {
  let conn;
  try {
    conn = await pool.getConnection();
    logger.info('Connected to MariaDB database');

    // Create digital_inputs table
    await conn.query(`
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (record_id)
      )
    `);
    logger.debug('Digital inputs table initialized');

    // Create analyzer_data table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS analyzer_data (
        id VARCHAR(50),
        kw DOUBLE,
        kwr DOUBLE,
        kwy DOUBLE,
        kwb DOUBLE,
        vry DOUBLE,
        vyb DOUBLE,
        vbr DOUBLE,
        ir DOUBLE,
        iy DOUBLE,
        ib DOUBLE,
        fault VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY(id, created_at)
      )
    `);
    logger.debug('Analyzer data table initialized');

    // Create analog_inputs table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS analog_inputs (
        id VARCHAR(50),
        ai1 DOUBLE,
        ai2 DOUBLE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY(id, created_at)
      )
    `);
    logger.debug('Analog inputs table initialized');

    // Create device_data table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS device_data (
        id VARCHAR(50) PRIMARY KEY,
        ip_address VARCHAR(20),
        random_number INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    logger.debug('Device data table initialized');

    logger.info('All database tables initialized successfully');
  } catch (err) {
    logger.error('Error initializing database:', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

// Digital Inputs Functions
export const insertDigitalInputs = async (deviceId: string, values: number[]): Promise<any> => {
  let conn;
  try {
    conn = await pool.getConnection();
    const paddedValues = [...values];
    while (paddedValues.length < 9) paddedValues.push(0);

    const result = await conn.query(
      `INSERT INTO digital_inputs (id, ip1, ip2, ip3, ip4, ip5, ip6, ip7, ip8, ip9) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [deviceId, ...paddedValues]
    );
    return result;
  } catch (err) {
    logger.error('Error inserting digital inputs:', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

export const getAllDigitalInputs = async (): Promise<any[]> => {
  let conn;
  try {
    conn = await pool.getConnection();
    return await conn.query('SELECT * FROM digital_inputs ORDER BY created_at DESC');
  } catch (err) {
    logger.error('Error getting digital inputs:', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

export const getLatestDigitalInputs = async (): Promise<any[]> => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`
      SELECT di1.*
      FROM digital_inputs di1
      INNER JOIN (
        SELECT id, MAX(created_at) as max_created_at
        FROM digital_inputs
        GROUP BY id
      ) di2 ON di1.id = di2.id AND di1.created_at = di2.max_created_at
      ORDER BY di1.id
    `);
    return rows;
  } catch (err) {
    logger.error('Error getting latest digital inputs:', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

// Analyzer Data Functions
interface AnalyzerData {
  kw: number;
  kwr: number;
  kwy: number;
  kwb: number;
  vry: number;
  vyb: number;
  vbr: number;
  ir: number;
  iy: number;
  ib: number;
  fault: string;
}

export const insertAnalyzerData = async (deviceId: string, values: number[]): Promise<any> => {
  let conn;
  try {
    conn = await pool.getConnection();
    const data: AnalyzerData = {
      kw: values[0] || 0,
      kwr: values[1] || 0,
      kwy: values[2] || 0,
      kwb: values[3] || 0,
      vry: values[4] || 0,
      vyb: values[5] || 0,
      vbr: values[6] || 0,
      ir: values[7] || 0,
      iy: values[8] || 0,
      ib: values[9] || 0,
      fault: values[10]?.toString() || ''
    };

    const result = await conn.query(
      `INSERT INTO analyzer_data 
       (id, kw, kwr, kwy, kwb, vry, vyb, vbr, ir, iy, ib, fault) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [deviceId, data.kw, data.kwr, data.kwy, data.kwb, data.vry, data.vyb, 
       data.vbr, data.ir, data.iy, data.ib, data.fault]
    );
    return result;
  } catch (err) {
    logger.error('Error inserting analyzer data:', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

export const getAllAnalyzerData = async (): Promise<any[]> => {
  let conn;
  try {
    conn = await pool.getConnection();
    return await conn.query('SELECT * FROM analyzer_data ORDER BY created_at DESC');
  } catch (err) {
    logger.error('Error getting analyzer data:', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

export const getLatestAnalyzerData = async (): Promise<any> => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM analyzer_data ORDER BY created_at DESC LIMIT 1');
    return rows[0] || null;
  } catch (err) {
    logger.error('Error getting latest analyzer data:', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

// Analog Inputs Functions
interface AnalogInputs {
  ai1: number;
  ai2: number;
}

export const insertAnalogInputs = async (deviceId: string, values: number[]): Promise<any> => {
  let conn;
  try {
    conn = await pool.getConnection();
    const data: AnalogInputs = {
      ai1: values[0] || 0,
      ai2: values[1] || 0
    };

    const result = await conn.query(
      `INSERT INTO analog_inputs (id, ai1, ai2) 
       VALUES (?, ?, ?)`,
      [deviceId, data.ai1, data.ai2]
    );
    return result;
  } catch (err) {
    logger.error('Error inserting analog inputs:', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

export const getAllAnalogInputs = async (): Promise<any[]> => {
  let conn;
  try {
    conn = await pool.getConnection();
    return await conn.query('SELECT * FROM analog_inputs ORDER BY created_at DESC');
  } catch (err) {
    logger.error('Error getting analog inputs:', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

export const getLatestAnalogInputs = async (): Promise<any> => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM analog_inputs ORDER BY created_at DESC LIMIT 1');
    return rows[0] || null;
  } catch (err) {
    logger.error('Error getting latest analog inputs:', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

// Device Data Functions
interface DeviceData {
  ip_address: string;
  random_number: number;
}

export const insertDeviceData = async (deviceId: string, random_number: number = 0, ip="00.00.00.00"): Promise<any> => {
  let conn;
  try {
    conn = await pool.getConnection();
    const data: DeviceData = {
      ip_address: ip,
      random_number: random_number
    };

    const result = await conn.query(
      `INSERT INTO device_data (id, ip_address, random_number) 
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
       ip_address = VALUES(ip_address),
       random_number = VALUES(random_number)`,
      [deviceId, data.ip_address, data.random_number]
    );
    return result;
  } catch (err) {
    logger.error('Error inserting device data:', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

export const getAllDeviceData = async (): Promise<any[]> => {
  let conn;
  try {
    conn = await pool.getConnection();
    return await conn.query('SELECT * FROM device_data ORDER BY created_at DESC');
  } catch (err) {
    logger.error('Error getting device data:', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

export const getLatestDeviceData = async (): Promise<any> => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM device_data ORDER BY created_at DESC LIMIT 1');
    return rows[0] || null;
  } catch (err) {
    logger.error('Error getting latest device data:', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

export const getDevicesStatus = async (STATE?: string): Promise<{ [key: string]: number }> => {
  let conn;
  try {
    // Parse state string or default to all zeros
    const states: { [key: number]: number } = {};
    if (STATE) {
      STATE.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        const stateNum = parseInt(key.replace('state', ''));
        states[stateNum] = parseInt(value);
      });
    }

    
    conn = await pool.getConnection();
    const result = await conn.query(`
      SELECT 
        SUM(CASE WHEN di.ip1 = ${states[1] ?? 0} OR di.ip1 IS NULL THEN 1 ELSE 0 END) as count1,
        SUM(CASE WHEN di.ip2 = ${states[2] ?? 0} OR di.ip2 IS NULL THEN 1 ELSE 0 END) as count2,
        SUM(CASE WHEN di.ip3 = ${states[3] ?? 0} OR di.ip3 IS NULL THEN 1 ELSE 0 END) as count3,
        SUM(CASE WHEN di.ip4 = ${states[4] ?? 0} OR di.ip4 IS NULL THEN 1 ELSE 0 END) as count4,
        SUM(CASE WHEN di.ip5 = ${states[5] ?? 0} OR di.ip5 IS NULL THEN 1 ELSE 0 END) as count5,
        SUM(CASE WHEN di.ip6 = ${states[6] ?? 0} OR di.ip6 IS NULL THEN 1 ELSE 0 END) as count6,
        SUM(CASE WHEN di.ip7 = ${states[7] ?? 0} OR di.ip7 IS NULL THEN 1 ELSE 0 END) as count7,
        SUM(CASE WHEN di.ip8 = ${states[8] ?? 0} OR di.ip8 IS NULL THEN 1 ELSE 0 END) as count8,
        SUM(CASE WHEN di.ip9 = ${states[9] ?? 0} OR di.ip9 IS NULL THEN 1 ELSE 0 END) as count9
      FROM device_data d
      LEFT JOIN (
        SELECT di1.*
        FROM digital_inputs di1
        INNER JOIN (
          SELECT id, MAX(created_at) as max_created_at
          FROM digital_inputs
          GROUP BY id
        ) di2 ON di1.id = di2.id AND di1.created_at = di2.max_created_at
      ) di ON d.id = di.id
    `);
    return result[0];
  } catch (err) {
    logger.error('Error getting devices count with specified digital inputs:', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

export const getAverageKW = async (): Promise<any> => {
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(`
      SELECT AVG(latest_kw) as average_kw
      FROM (
        SELECT a1.kw as latest_kw
        FROM device_data d
        LEFT JOIN (
          SELECT a1.*
          FROM analyzer_data a1
          INNER JOIN (
            SELECT id, MAX(created_at) as max_created_at
            FROM analyzer_data
            GROUP BY id
          ) a2 ON a1.id = a2.id AND a1.created_at = a2.max_created_at
        ) a1 ON d.id = a1.id
        WHERE a1.kw IS NOT NULL
      ) latest_records
    `);
    return result[0];
  } catch (err) {
    logger.error('Error getting average KW:', err);
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
  getAverageKW,
  // Analog Inputs
  insertAnalogInputs,
  getAllAnalogInputs,
  getLatestAnalogInputs,
  // Device Data
  insertDeviceData,
  getAllDeviceData,
  getLatestDeviceData,
  getDevicesStatus,
}; 