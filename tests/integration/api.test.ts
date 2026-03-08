import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../src/app.js';
import { prisma } from '../../src/config/database.js';
import { FastifyInstance } from 'fastify';

describe('API Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  beforeEach(async () => {
    await prisma.reservation.deleteMany();
    await prisma.user.deleteMany();
    await prisma.room.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('GET /health should return ok', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('POST /api/rooms should create a room', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/rooms',
      payload: { name: 'Zasedacka A', capacity: 10, equipment: ['projektor'] },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.name).toBe('Zasedacka A');
    expect(body.capacity).toBe(10);
    expect(body.id).toBeDefined();
  });

  it('POST /api/rooms should return 400 for invalid data', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/rooms',
      payload: { name: '', capacity: 10 },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('Room name cannot be empty');
  });

  it('GET /api/rooms should return all rooms', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/rooms',
      payload: { name: 'Room 1', capacity: 5 },
    });

    const response = await app.inject({ method: 'GET', url: '/api/rooms' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveLength(1);
  });

  it('GET /api/rooms/:id should return 404 for unknown room', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/rooms/unknown' });

    expect(response.statusCode).toBe(404);
  });

  it('POST /api/users should create a user', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: { name: 'Jan Novak', email: 'jan@example.com' },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.name).toBe('Jan Novak');
    expect(body.email).toBe('jan@example.com');
    expect(body.role).toBe('user');
  });

  it('POST /api/users should reject duplicate email', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: { name: 'Jan', email: 'jan@example.com' },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: { name: 'Jan 2', email: 'jan@example.com' },
    });

    expect(response.statusCode).toBe(409);
  });

  it('should create and retrieve a reservation', async () => {
    const roomRes = await app.inject({
      method: 'POST',
      url: '/api/rooms',
      payload: { name: 'Testovaci mistnost', capacity: 5 },
    });
    const room = roomRes.json();

    const userRes = await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: { name: 'Test User', email: 'test@example.com' },
    });
    const user = userRes.json();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(12, 0, 0, 0);

    const resResponse = await app.inject({
      method: 'POST',
      url: '/api/reservations',
      payload: {
        roomId: room.id,
        userId: user.id,
        startTime: tomorrow.toISOString(),
        endTime: tomorrowEnd.toISOString(),
      },
    });

    expect(resResponse.statusCode).toBe(201);
    const reservation = resResponse.json();
    expect(reservation.roomId).toBe(room.id);
    expect(reservation.userId).toBe(user.id);

    const listRes = await app.inject({ method: 'GET', url: '/api/reservations' });
    expect(listRes.json()).toHaveLength(1);
  });

  it('should reject overlapping reservation', async () => {
    const roomRes = await app.inject({
      method: 'POST',
      url: '/api/rooms',
      payload: { name: 'Room overlap', capacity: 5 },
    });
    const room = roomRes.json();

    const user1Res = await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: { name: 'User 1', email: 'user1@example.com' },
    });
    const user1 = user1Res.json();

    const user2Res = await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: { name: 'User 2', email: 'user2@example.com' },
    });
    const user2 = user2Res.json();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(12, 0, 0, 0);

    await app.inject({
      method: 'POST',
      url: '/api/reservations',
      payload: {
        roomId: room.id,
        userId: user1.id,
        startTime: tomorrow.toISOString(),
        endTime: tomorrowEnd.toISOString(),
      },
    });

    const overlap = new Date(tomorrow);
    overlap.setHours(11, 0, 0, 0);
    const overlapEnd = new Date(tomorrow);
    overlapEnd.setHours(13, 0, 0, 0);

    const response = await app.inject({
      method: 'POST',
      url: '/api/reservations',
      payload: {
        roomId: room.id,
        userId: user2.id,
        startTime: overlap.toISOString(),
        endTime: overlapEnd.toISOString(),
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('Room is already reserved for this time slot');
  });

  it('GET /api/rooms/:id should return existing room', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/rooms',
      payload: { name: 'Find me', capacity: 8 },
    });
    const room = createRes.json();

    const response = await app.inject({ method: 'GET', url: `/api/rooms/${room.id}` });
    expect(response.statusCode).toBe(200);
    expect(response.json().name).toBe('Find me');
  });

  it('PATCH /api/rooms/:id/deactivate should deactivate room', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/rooms',
      payload: { name: 'Deactivate me', capacity: 5 },
    });
    const room = createRes.json();

    const response = await app.inject({ method: 'PATCH', url: `/api/rooms/${room.id}/deactivate` });
    expect(response.statusCode).toBe(200);
    expect(response.json().isActive).toBe(false);
  });

  it('PATCH /api/rooms/:id/activate should activate room', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/api/rooms',
      payload: { name: 'Activate me', capacity: 5 },
    });
    const room = createRes.json();

    await app.inject({ method: 'PATCH', url: `/api/rooms/${room.id}/deactivate` });
    const response = await app.inject({ method: 'PATCH', url: `/api/rooms/${room.id}/activate` });
    expect(response.statusCode).toBe(200);
    expect(response.json().isActive).toBe(true);
  });

  it('should reject reservation for inactive room', async () => {
    const roomRes = await app.inject({
      method: 'POST',
      url: '/api/rooms',
      payload: { name: 'Inactive room', capacity: 5 },
    });
    const room = roomRes.json();
    await app.inject({ method: 'PATCH', url: `/api/rooms/${room.id}/deactivate` });

    const userRes = await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: { name: 'User X', email: 'userx@example.com' },
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(12, 0, 0, 0);

    const response = await app.inject({
      method: 'POST',
      url: '/api/reservations',
      payload: {
        roomId: room.id,
        userId: userRes.json().id,
        startTime: tomorrow.toISOString(),
        endTime: tomorrowEnd.toISOString(),
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('Cannot reserve an inactive room');
  });

  it('should cancel a reservation', async () => {
    const roomRes = await app.inject({
      method: 'POST',
      url: '/api/rooms',
      payload: { name: 'Cancel room', capacity: 5 },
    });
    const userRes = await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: { name: 'Cancel user', email: 'cancel@example.com' },
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(12, 0, 0, 0);

    const resResponse = await app.inject({
      method: 'POST',
      url: '/api/reservations',
      payload: {
        roomId: roomRes.json().id,
        userId: userRes.json().id,
        startTime: tomorrow.toISOString(),
        endTime: tomorrowEnd.toISOString(),
      },
    });

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/reservations/${resResponse.json().id}/cancel`,
      payload: { userId: userRes.json().id },
    });

    expect(response.statusCode).toBe(200);
  });

  it('should get reservations by room', async () => {
    const roomRes = await app.inject({
      method: 'POST',
      url: '/api/rooms',
      payload: { name: 'Filter room', capacity: 5 },
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/reservations/room/${roomRes.json().id}`,
    });

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.json())).toBe(true);
  });

  it('should get reservations by user', async () => {
    const userRes = await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: { name: 'Filter user', email: 'filter@example.com' },
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/reservations/user/${userRes.json().id}`,
    });

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.json())).toBe(true);
  });

  it('POST /api/users should return 400 for invalid email', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: { name: 'Test', email: 'invalid' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('GET /api/users should return all users', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: { name: 'List user', email: 'list@example.com' },
    });

    const response = await app.inject({ method: 'GET', url: '/api/users' });
    expect(response.statusCode).toBe(200);
    expect(response.json().length).toBeGreaterThanOrEqual(1);
  });

  it('GET / should return API info', async () => {
    const response = await app.inject({ method: 'GET', url: '/' });

    expect(response.statusCode).toBe(200);
    expect(response.json().name).toBe('Room Reservation System');
    expect(response.json().endpoints).toBeDefined();
  });

  it('GET /metrics should return metrics', async () => {
    const response = await app.inject({ method: 'GET', url: '/metrics' });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.uptime_seconds).toBeDefined();
    expect(body.total_requests).toBeDefined();
    expect(body.database).toBe('up');
  });

  it('GET /api/reservations/stats should return stats', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/reservations/stats' });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.totalReservations).toBeDefined();
    expect(body.activeReservations).toBeDefined();
  });

  it('POST /api/users should return 400 for empty name', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: { name: '', email: 'test@test.com' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should reject reservation for non-existent user', async () => {
    const roomRes = await app.inject({
      method: 'POST',
      url: '/api/rooms',
      payload: { name: 'Room for fake user', capacity: 5 },
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(12, 0, 0, 0);

    const response = await app.inject({
      method: 'POST',
      url: '/api/reservations',
      payload: {
        roomId: roomRes.json().id,
        userId: 'fake-user',
        startTime: tomorrow.toISOString(),
        endTime: tomorrowEnd.toISOString(),
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error).toBe('User not found');
  });

  it('should reject reservation with invalid time range', async () => {
    const roomRes = await app.inject({
      method: 'POST',
      url: '/api/rooms',
      payload: { name: 'Time test room', capacity: 5 },
    });
    const userRes = await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: { name: 'Time user', email: 'time@test.com' },
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    const tomorrowEarlier = new Date(tomorrow);
    tomorrowEarlier.setHours(10, 0, 0, 0);

    const response = await app.inject({
      method: 'POST',
      url: '/api/reservations',
      payload: {
        roomId: roomRes.json().id,
        userId: userRes.json().id,
        startTime: tomorrow.toISOString(),
        endTime: tomorrowEarlier.toISOString(),
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should reject cancellation by non-owner non-admin', async () => {
    const roomRes = await app.inject({
      method: 'POST',
      url: '/api/rooms',
      payload: { name: 'Auth room', capacity: 5 },
    });
    const ownerRes = await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: { name: 'Owner', email: 'owner@test.com' },
    });
    const otherRes = await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: { name: 'Other', email: 'other@test.com' },
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(12, 0, 0, 0);

    const resResponse = await app.inject({
      method: 'POST',
      url: '/api/reservations',
      payload: {
        roomId: roomRes.json().id,
        userId: ownerRes.json().id,
        startTime: tomorrow.toISOString(),
        endTime: tomorrowEnd.toISOString(),
      },
    });

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/reservations/${resResponse.json().id}/cancel`,
      payload: { userId: otherRes.json().id },
    });

    expect(response.statusCode).toBe(403);
  });

  it('PATCH deactivate should return 404 for unknown room', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/rooms/unknown-id/deactivate',
    });
    expect(response.statusCode).toBe(404);
  });

  it('PATCH activate should return 404 for unknown room', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/rooms/unknown-id/activate',
    });
    expect(response.statusCode).toBe(404);
  });

  it('POST /api/rooms should return 400 for invalid capacity', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/rooms',
      payload: { name: 'Bad room', capacity: -5 },
    });
    expect(response.statusCode).toBe(400);
  });

  it('should reject cancellation for non-existent reservation', async () => {
    const userRes = await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: { name: 'Cancel test', email: 'canceltest@test.com' },
    });

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/reservations/fake-id/cancel',
      payload: { userId: userRes.json().id },
    });

    expect(response.statusCode).toBe(404);
  });

  it('should reject cancellation for non-existent user', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/reservations/some-id/cancel',
      payload: { userId: 'fake-user' },
    });

    expect(response.statusCode).toBe(404);
  });

  it('should reject reservation for non-existent room', async () => {
    const userRes = await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: { name: 'Another User', email: 'another@example.com' },
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(12, 0, 0, 0);

    const response = await app.inject({
      method: 'POST',
      url: '/api/reservations',
      payload: {
        roomId: 'fake-room',
        userId: userRes.json().id,
        startTime: tomorrow.toISOString(),
        endTime: tomorrowEnd.toISOString(),
      },
    });

    expect(response.statusCode).toBe(404);
  });
});
