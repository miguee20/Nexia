import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { healthRouter } from './presentation/routes/health.route';
import { authRouter } from './presentation/routes/auth.routes';
import { tenantRouter } from './presentation/routes/tenant.routes';
import propertyRouter from './presentation/routes/property.routes';
import vehicleRouter from './presentation/routes/vehicle.routes';
import marbeteRouter from './presentation/routes/marbete.routes';
import gateRouter from './presentation/routes/gate.routes';
import { errorHandler } from './presentation/middlewares/errorHandler';

const app = express();

// Global Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Presentation Routes
app.use('/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/tenants', tenantRouter);
app.use('/api/properties', propertyRouter);
app.use('/api/vehicles', vehicleRouter);
app.use('/api/marbetes', marbeteRouter);
app.use('/api/gate', gateRouter);

// Global Error Handler
app.use(errorHandler);

// Start server
app.listen(env.PORT, () => {
  console.log(`[Nexia API] Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});
