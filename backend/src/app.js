import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  return app;
}