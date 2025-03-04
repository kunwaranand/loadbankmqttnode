import { Router } from 'express';
import * as dataController from '../controllers/data.controller';

const router = Router();

// Health check route
router.get('/health', dataController.healthCheck);

// Digital Inputs routes
router.get('/digital-inputs', dataController.getAllDigitalInputs);
router.get('/digital-inputs/latest', dataController.getLatestDigitalInputs);

// Analyzer Data routes
router.get('/analyzer-data', dataController.getAllAnalyzerData);
router.get('/analyzer-data/latest', dataController.getLatestAnalyzerData);
router.get('/analyzer-data/latest-kw', dataController.getAverageKW);

// Analog Input routes
router.get('/analog-input', dataController.getAllAnalogInput);
router.get('/analog-input/latest', dataController.getLatestAnalogInput);

// Device Data routes
router.get('/device-data', dataController.getAllDeviceData);
router.get('/device-data/latest', dataController.getLatestDeviceData);
router.post("/device-status", dataController.getDeviceStatus)

export default router; 