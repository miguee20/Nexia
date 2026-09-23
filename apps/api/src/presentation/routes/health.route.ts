import { Router } from 'express';
import { prisma } from '../../infrastructure/database/prisma/client';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  let dbStatus = 'disconnected';
  
  try {
    // Attempt a simple query to verify DB connection
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'error';
    console.error('[HealthCheck] DB Connection Error:', error);
  }

  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db: dbStatus,
  });
});
