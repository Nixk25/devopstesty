import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app.js';
import { FastifyInstance } from 'fastify';

describe('API Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
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

  it('POST /api/rooms should return 500 for invalid data', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/rooms',
      payload: { name: '', capacity: 10 },
    });

    expect(response.statusCode).toBe(500);
  });

  it('GET /api/rooms should return all rooms', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/rooms' });

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.json())).toBe(true);
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
    expect(listRes.json().length).toBeGreaterThanOrEqual(1);
  });

  it('should reject reservation for non-existent room', async () => {
    const userRes = await app.inject({
      method: 'POST',
      url: '/api/users',
      payload: { name: 'Another User', email: 'another@example.com' },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/reservations',
      payload: {
        roomId: 'fake-room',
        userId: userRes.json().id,
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
      },
    });

    expect(response.statusCode).toBe(404);
  });
});
