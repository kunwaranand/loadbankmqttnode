import { Request, Response } from 'express';
import dbService from '../services/db.service';
import logger from '../config/logger';

// Helper function to safely stringify objects containing BigInt
const safeStringify = (obj: any): string => {
  return JSON.stringify(obj, (_, value) =>
    typeof value === 'bigint' ? value.toString() : value
  );
};

// Digital Inputs Controllers
export const getAllDigitalInputs = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.debug(`Received request for all digital inputs: ${req.method} ${req.originalUrl}`);
    const data = await dbService.getAllDigitalInputs();
    
    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    logger.error('Error getting digital inputs:', err);
    logger.debug(`Error details: ${safeStringify(err)}`);
    
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

export const getLatestDigitalInputs = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.debug(`Received request for latest digital inputs: ${req.method} ${req.originalUrl}`);
    const data = await dbService.getLatestDigitalInputs();
    
    if (!data) {
      res.status(404).json({
        success: false,
        error: 'No data found',
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    logger.error('Error getting latest digital inputs:', err);
    logger.debug(`Error details: ${safeStringify(err)}`);
    
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Analyzer Data Controllers
export const getAllAnalyzerData = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.debug(`Received request for all analyzer data: ${req.method} ${req.originalUrl}`);
    const data = await dbService.getAllAnalyzerData();
    
    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    logger.error('Error getting analyzer data:', err);
    logger.debug(`Error details: ${safeStringify(err)}`);
    
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

export const getLatestAnalyzerData = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.debug(`Received request for latest analyzer data: ${req.method} ${req.originalUrl}`);
    const data = await dbService.getLatestAnalyzerData();
    
    if (!data) {
      res.status(404).json({
        success: false,
        error: 'No data found',
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    logger.error('Error getting latest analyzer data:', err);
    logger.debug(`Error details: ${safeStringify(err)}`);
    
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Analog Input Controllers
export const getAllAnalogInput = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.debug(`Received request for all analog input: ${req.method} ${req.originalUrl}`);
    const data = await dbService.getAllAnalogInput();
    
    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    logger.error('Error getting analog input:', err);
    logger.debug(`Error details: ${safeStringify(err)}`);
    
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

export const getLatestAnalogInput = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.debug(`Received request for latest analog input: ${req.method} ${req.originalUrl}`);
    const data = await dbService.getLatestAnalogInput();
    
    if (!data) {
      res.status(404).json({
        success: false,
        error: 'No data found',
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    logger.error('Error getting latest analog input:', err);
    logger.debug(`Error details: ${safeStringify(err)}`);
    
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Device Data Controllers
export const getAllDeviceData = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.debug(`Received request for all device data: ${req.method} ${req.originalUrl}`);
    const data = await dbService.getAllDeviceData();
    
    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    logger.error('Error getting device data:', err);
    logger.debug(`Error details: ${safeStringify(err)}`);
    
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

export const getLatestDeviceData = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.debug(`Received request for latest device data: ${req.method} ${req.originalUrl}`);
    const data = await dbService.getLatestDeviceData();
    
    if (!data) {
      res.status(404).json({
        success: false,
        error: 'No data found',
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    logger.error('Error getting latest device data:', err);
    logger.debug(`Error details: ${safeStringify(err)}`);
    
    res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

// Health check endpoint
export const healthCheck = (req: Request, res: Response): void => {
  logger.debug(`Received health check request: ${req.method} ${req.originalUrl}`);
  logger.debug(`Request headers: ${safeStringify(req.headers)}`);
  
  const timestamp = new Date().toISOString();
  logger.debug(`Health check timestamp: ${timestamp}`);
  logger.debug('Sending health check response with status 200');
  
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp,
  });
  
  logger.debug('Health check response sent successfully');
};

export default {
  // Digital Inputs
  getAllDigitalInputs,
  getLatestDigitalInputs,
  // Analyzer Data
  getAllAnalyzerData,
  getLatestAnalyzerData,
  // Analog Input
  getAllAnalogInput,
  getLatestAnalogInput,
  // Device Data
  getAllDeviceData,
  getLatestDeviceData,
  // Health Check
  healthCheck,
}; 