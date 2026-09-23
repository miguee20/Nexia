import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { healthRouter } from './presentation/routes/health.route';

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());

// Presentation Routes
app.use('/health', healthRouter);

// Start server
app.listen(env.PORT, () => {
  console.log(`[Nexia API] Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});
