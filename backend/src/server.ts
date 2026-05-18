import express from 'express';
import cors from 'cors';
import pino from 'pino';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bodyParser from 'body-parser';

import { errorHandler } from './utils/errorHandler';
import { authRouter } from './routes/auth';
import { propertiesRouter } from './routes/properties';
import { rentRouter } from './routes/rent';
import { paymentsRouter } from './routes/payments';
import { aiRouter } from './routes/ai';

export function createServer(){
  const app = express();
  const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

  app.use(helmet());
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  }));
  app.use(express.json());

  // rate limiter
  const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
  app.use(apiLimiter);

  // Health check
  app.get('/', (req, res) => {
    res.json({ success: true, message: 'RentFlow API is live', timestamp: new Date().toISOString() });
  });

  app.use('/auth', authRouter);
  app.use('/properties', propertiesRouter);
  app.use('/rent', rentRouter);
  app.use('/payments', paymentsRouter);
  app.use('/ai', aiRouter);

  // stripe webhook route needs raw body - already handled inside payments router

  app.use(errorHandler);

  return app;
}
