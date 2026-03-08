import Fastify from 'fastify';
import cors from '@fastify/cors';
import { roomController } from './controller/roomController.js';
import { reservationController } from './controller/reservationController.js';

export function buildApp() {
  const app = Fastify({ logger: true });

  app.register(cors);

  app.get('/health', async () => {
    return { status: 'ok' };
  });

  roomController(app);
  reservationController(app);

  return app;
}
