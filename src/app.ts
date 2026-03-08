import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { roomController } from './controller/roomController.js';
import { reservationController } from './controller/reservationController.js';
import { metricsController } from './controller/metricsController.js';

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(helmet);
  app.register(cors);
  app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  app.get('/', async () => {
    return {
      name: 'Room Reservation System',
      version: '0.1.0',
      endpoints: {
        health: 'GET /health',
        rooms: 'GET /api/rooms',
        users: 'GET /api/users',
        reservations: 'GET /api/reservations',
        stats: 'GET /api/reservations/stats',
        metrics: 'GET /metrics',
      },
    };
  });

  app.get('/health', async () => {
    return { status: 'ok' };
  });

  metricsController(app);
  roomController(app);
  reservationController(app);

  return app;
}
