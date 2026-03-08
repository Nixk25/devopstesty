import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database.js';

let requestCount = 0;
let errorCount = 0;
const startTime = Date.now();

export function metricsController(app: FastifyInstance) {
  app.addHook('onRequest', async () => {
    requestCount++;
  });

  app.addHook('onResponse', async (_request, reply) => {
    if (reply.statusCode >= 400) {
      errorCount++;
    }
  });

  app.get('/metrics', async () => {
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
    const memoryUsage = process.memoryUsage();

    let dbStatus = 'up';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'down';
    }

    return {
      uptime_seconds: uptimeSeconds,
      total_requests: requestCount,
      error_requests: errorCount,
      error_rate: requestCount > 0 ? (errorCount / requestCount * 100).toFixed(2) + '%' : '0%',
      memory: {
        rss_mb: (memoryUsage.rss / 1024 / 1024).toFixed(2),
        heap_used_mb: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
        heap_total_mb: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
      },
      database: dbStatus,
      node_version: process.version,
    };
  });
}
