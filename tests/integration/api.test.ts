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
