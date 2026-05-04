import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requestLogger } from './middleware/requestLogger.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import routes from './routes/index.js';

const app = express();

// Global Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use(requestLogger);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Main API Routes
app.use('/api', routes);

// Global Error Handler
app.use(errorHandler);

export default app;
