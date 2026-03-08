import { describe, it, expect, beforeEach } from 'vitest';
import { StatsService } from '../../src/service/StatsService.js';
import { ReservationService } from '../../src/service/ReservationService.js';
import { Room } from '../../src/domain/Room.js';
import { User } from '../../src/domain/User.js';

describe('StatsService', () => {
  let reservationService: ReservationService;
  let statsService: StatsService;
  let room1: Room;
  let room2: Room;
  let user: User;

  const tomorrow = (hour: number) => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(hour, 0, 0, 0);
    return d;
  };

  beforeEach(() => {
    reservationService = new ReservationService();
    statsService = new StatsService(reservationService);
    room1 = new Room('Room 1', 10);
    room2 = new Room('Room 2', 5);
    user = new User('Jan', 'jan@example.com');
  });

  it('should return zero stats when no reservations', () => {
    const stats = statsService.getStats();

    expect(stats.totalReservations).toBe(0);
    expect(stats.activeReservations).toBe(0);
    expect(stats.cancelledReservations).toBe(0);
  });

  it('should count total and active reservations', () => {
    reservationService.createReservation(room1, user, tomorrow(10), tomorrow(12));
    reservationService.createReservation(room2, user, tomorrow(14), tomorrow(16));

    const stats = statsService.getStats();

    expect(stats.totalReservations).toBe(2);
    expect(stats.activeReservations).toBe(2);
    expect(stats.cancelledReservations).toBe(0);
  });

  it('should count cancelled reservations', () => {
    const res = reservationService.createReservation(room1, user, tomorrow(10), tomorrow(12));
    reservationService.createReservation(room2, user, tomorrow(14), tomorrow(16));
    reservationService.cancelReservation(res.id, user);

    const stats = statsService.getStats();

    expect(stats.totalReservations).toBe(2);
    expect(stats.activeReservations).toBe(1);
    expect(stats.cancelledReservations).toBe(1);
  });

  it('should return most booked room', () => {
    reservationService.createReservation(room1, user, tomorrow(8), tomorrow(10));
    reservationService.createReservation(room1, user, tomorrow(10), tomorrow(12));
    reservationService.createReservation(room2, user, tomorrow(14), tomorrow(16));

    const stats = statsService.getStats();

    expect(stats.mostBookedRoomId).toBe(room1.id);
  });

  it('should return null for most booked room when no reservations', () => {
    const stats = statsService.getStats();

    expect(stats.mostBookedRoomId).toBeNull();
  });
});
