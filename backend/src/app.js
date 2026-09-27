import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler, notFoundHandler } from './middleware/error.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}