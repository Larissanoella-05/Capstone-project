import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import faultRoutes from './routes/faults.routes.js';
import technicianRoutes from './routes/technicians.routes.js';
import notificationRoutes from './routes/notifications.routes.js';
import deviceRoutes from './routes/devices.routes.js';
import miscRoutes from './routes/misc.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

export function createApp() {
  const app = express();

  // 1. Settings that apply to every request
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
        callback(null, false);
      },
    })
  );
  app.use(express.json({ limit: '2mb' }));
  if (env.nodeEnv !== 'test') app.use(morgan('dev')); // keep automated test output readable

  // 2. Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/faults', faultRoutes);
  app.use('/api/technicians', technicianRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/devices', deviceRoutes);
  app.use('/api', miscRoutes);

  // 3. Nothing matched: 404, then any error that happened above
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
