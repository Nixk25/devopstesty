import { FastifyInstance } from 'fastify';
import { Room } from '../domain/Room.js';

const rooms: Map<string, Room> = new Map();

export function roomController(app: FastifyInstance) {
  app.post('/api/rooms', async (request, reply) => {
    const { name, capacity, equipment } = request.body as {
      name: string;
      capacity: number;
      equipment?: string[];
    };

    try {
      const room = new Room(name, capacity, equipment);
      rooms.set(room.id, room);
      return reply.status(201).send(room);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return reply.status(400).send({ error: message });
    }
  });

  app.get('/api/rooms', async () => {
    return Array.from(rooms.values());
  });

  app.get('/api/rooms/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const room = rooms.get(id);

    if (!room) {
      return reply.status(404).send({ error: 'Room not found' });
    }

    return room;
  });

  app.patch('/api/rooms/:id/deactivate', async (request, reply) => {
    const { id } = request.params as { id: string };
    const room = rooms.get(id);

    if (!room) {
      return reply.status(404).send({ error: 'Room not found' });
    }

    room.deactivate();
    return room;
  });

  app.patch('/api/rooms/:id/activate', async (request, reply) => {
    const { id } = request.params as { id: string };
    const room = rooms.get(id);

    if (!room) {
      return reply.status(404).send({ error: 'Room not found' });
    }

    room.activate();
    return room;
  });
}

export { rooms };
