import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
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
  app.use(morgan('dev'));

  // 2. Routes
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRoutes);

  // 3. Nothing matched: 404, then any error that happened above
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}