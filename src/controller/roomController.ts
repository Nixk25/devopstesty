import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database.js';

export function roomController(app: FastifyInstance) {
  app.post('/api/rooms', async (request, reply) => {
    const { name, capacity, equipment } = request.body as {
      name: string;
      capacity: number;
      equipment?: string[];
    };

    if (!name || name.trim().length === 0) {
      return reply.status(400).send({ error: 'Room name cannot be empty' });
    }

    if (!Number.isInteger(capacity) || capacity <= 0) {
      return reply.status(400).send({ error: 'Capacity must be a positive integer' });
    }

    const room = await prisma.room.create({
      data: {
        name: name.trim(),
        capacity,
        equipment: JSON.stringify(equipment || []),
      },
    });

    return reply.status(201).send({
      ...room,
      equipment: JSON.parse(room.equipment),
    });
  });

  app.get('/api/rooms', async () => {
    const rooms = await prisma.room.findMany();
    return rooms.map((r) => ({ ...r, equipment: JSON.parse(r.equipment) }));
  });

  app.get('/api/rooms/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const room = await prisma.room.findUnique({ where: { id } });

    if (!room) {
      return reply.status(404).send({ error: 'Room not found' });
    }

    return { ...room, equipment: JSON.parse(room.equipment) };
  });

  app.patch('/api/rooms/:id/deactivate', async (request, reply) => {
    const { id } = request.params as { id: string };
    const room = await prisma.room.findUnique({ where: { id } });

    if (!room) {
      return reply.status(404).send({ error: 'Room not found' });
    }

    const updated = await prisma.room.update({
      where: { id },
      data: { isActive: false },
    });

    return { ...updated, equipment: JSON.parse(updated.equipment) };
  });

  app.patch('/api/rooms/:id/activate', async (request, reply) => {
    const { id } = request.params as { id: string };
    const room = await prisma.room.findUnique({ where: { id } });

    if (!room) {
      return reply.status(404).send({ error: 'Room not found' });
    }

    const updated = await prisma.room.update({
      where: { id },
      data: { isActive: true },
    });

    return { ...updated, equipment: JSON.parse(updated.equipment) };
  });
}
