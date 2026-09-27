import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import authRoutes from './routes/auth.routes.js';
import { env } from './config/env.js'
 

export function createApp() {
  const app = express();
  app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin header (curl, health checks) are allowed.
      if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
      callback(null, false);
    },
  })
);
  app.use(express.json());
  app.use(morgan('dev'));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use(notFoundHandler);
  app.use(errorHandler);
  app.use('/api/auth', authRoutes);
  return app;
}