import { FastifyInstance } from 'fastify';
import { ReservationService } from '../service/ReservationService.js';
import { User, UserRole } from '../domain/User.js';
import { rooms } from './roomController.js';

const users: Map<string, User> = new Map();
const reservationService = new ReservationService();

export function reservationController(app: FastifyInstance) {
  app.post('/api/users', async (request, reply) => {
    const { name, email, role } = request.body as {
      name: string;
      email: string;
      role?: string;
    };

    const userRole = role === 'admin' ? UserRole.ADMIN : UserRole.USER;
    const user = new User(name, email, userRole);
    users.set(user.id, user);

    return reply.status(201).send(user);
  });

  app.get('/api/users', async () => {
    return Array.from(users.values());
  });

  app.post('/api/reservations', async (request, reply) => {
    const { roomId, userId, startTime, endTime } = request.body as {
      roomId: string;
      userId: string;
      startTime: string;
      endTime: string;
    };

    const room = rooms.get(roomId);
    if (!room) {
      return reply.status(404).send({ error: 'Room not found' });
    }

    const user = users.get(userId);
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    try {
      const reservation = reservationService.createReservation(
        room, user, new Date(startTime), new Date(endTime)
      );
      return reply.status(201).send(reservation);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return reply.status(400).send({ error: message });
    }
  });

  app.get('/api/reservations', async () => {
    return reservationService.getReservations();
  });

  app.get('/api/reservations/room/:roomId', async (request) => {
    const { roomId } = request.params as { roomId: string };
    return reservationService.getReservationsByRoom(roomId);
  });

  app.get('/api/reservations/user/:userId', async (request) => {
    const { userId } = request.params as { userId: string };
    return reservationService.getReservationsByUser(userId);
  });

  app.patch('/api/reservations/:id/cancel', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { userId } = request.body as { userId: string };

    const user = users.get(userId);
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    try {
      reservationService.cancelReservation(id, user);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return reply.status(400).send({ error: message });
    }
  });
}

export { users, reservationService };
