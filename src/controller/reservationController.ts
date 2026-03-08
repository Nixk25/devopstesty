import { FastifyInstance } from 'fastify';
import { prisma } from '../config/database.js';

export function reservationController(app: FastifyInstance) {
  app.post('/api/users', async (request, reply) => {
    const { name, email, role } = request.body as {
      name: string;
      email: string;
      role?: string;
    };

    if (!name || name.trim().length === 0) {
      return reply.status(400).send({ error: 'User name cannot be empty' });
    }

    const trimmedEmail = email?.trim() || '';
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return reply.status(400).send({ error: 'Invalid email format' });
    }

    const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } });
    if (existing) {
      return reply.status(409).send({ error: 'Email already exists' });
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: trimmedEmail,
        role: role === 'admin' ? 'admin' : 'user',
      },
    });

    return reply.status(201).send(user);
  });

  app.get('/api/users', async () => {
    return prisma.user.findMany();
  });

  app.post('/api/reservations', async (request, reply) => {
    const { roomId, userId, startTime, endTime } = request.body as {
      roomId: string;
      userId: string;
      startTime: string;
      endTime: string;
    };

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      return reply.status(404).send({ error: 'Room not found' });
    }

    if (!room.isActive) {
      return reply.status(400).send({ error: 'Cannot reserve an inactive room' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return reply.status(400).send({ error: 'Start time must be before end time' });
    }

    if (start < new Date()) {
      return reply.status(400).send({ error: 'Cannot create reservation in the past' });
    }

    const conflict = await prisma.reservation.findFirst({
      where: {
        roomId,
        status: 'confirmed',
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    if (conflict) {
      return reply.status(400).send({ error: 'Room is already reserved for this time slot' });
    }

    const reservation = await prisma.reservation.create({
      data: { roomId, userId, startTime: start, endTime: end },
    });

    return reply.status(201).send(reservation);
  });

  app.get('/api/reservations', async () => {
    return prisma.reservation.findMany();
  });

  app.get('/api/reservations/room/:roomId', async (request) => {
    const { roomId } = request.params as { roomId: string };
    return prisma.reservation.findMany({ where: { roomId } });
  });

  app.get('/api/reservations/user/:userId', async (request) => {
    const { userId } = request.params as { userId: string };
    return prisma.reservation.findMany({ where: { userId } });
  });

  app.get('/api/reservations/stats', async () => {
    const reservations = await prisma.reservation.findMany();
    const active = reservations.filter((r) => r.status === 'confirmed');
    const cancelled = reservations.filter((r) => r.status === 'cancelled');

    let mostBookedRoomId: string | null = null;
    if (active.length > 0) {
      const roomCounts = new Map<string, number>();
      for (const r of active) {
        roomCounts.set(r.roomId, (roomCounts.get(r.roomId) || 0) + 1);
      }
      let maxCount = 0;
      for (const [roomId, count] of roomCounts) {
        if (count > maxCount) {
          maxCount = count;
          mostBookedRoomId = roomId;
        }
      }
    }

    return {
      totalReservations: reservations.length,
      activeReservations: active.length,
      cancelledReservations: cancelled.length,
      mostBookedRoomId,
    };
  });

  app.patch('/api/reservations/:id/cancel', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { userId } = request.body as { userId: string };

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    const reservation = await prisma.reservation.findUnique({ where: { id } });
    if (!reservation) {
      return reply.status(404).send({ error: 'Reservation not found' });
    }

    if (reservation.status === 'cancelled') {
      return reply.status(400).send({ error: 'Reservation is already cancelled' });
    }

    if (reservation.userId !== userId && user.role !== 'admin') {
      return reply.status(403).send({ error: 'Only the owner or an admin can cancel a reservation' });
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    return updated;
  });
}
