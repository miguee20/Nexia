import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { healthRouter } from './presentation/routes/health.route';
import { authRouter } from './presentation/routes/auth.routes';
import { tenantRouter } from './presentation/routes/tenant.routes';
import { errorHandler } from './presentation/middlewares/errorHandler';

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Presentation Routes
app.use('/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/tenants', tenantRouter);

// Global Error Handler
app.use(errorHandler);

// Start server
app.listen(env.PORT, () => {
  console.log(`[Nexia API] Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});
