import { describe, it, expect } from 'vitest';
import { Reservation, ReservationStatus } from '../../src/domain/Reservation.js';

describe('Reservation', () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(12, 0, 0, 0);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayEnd = new Date(yesterday);
  yesterdayEnd.setHours(yesterday.getHours() + 2);

  it('should create a reservation with valid properties', () => {
    const reservation = new Reservation('room-1', 'user-1', tomorrow, tomorrowEnd);

    expect(reservation.roomId).toBe('room-1');
    expect(reservation.userId).toBe('user-1');
    expect(reservation.startTime).toEqual(tomorrow);
    expect(reservation.endTime).toEqual(tomorrowEnd);
    expect(reservation.status).toBe(ReservationStatus.CONFIRMED);
    expect(reservation.id).toBeDefined();
  });

  it('should throw error when start time is after end time', () => {
    expect(() => new Reservation('room-1', 'user-1', tomorrowEnd, tomorrow))
      .toThrow('Start time must be before end time');
  });

  it('should throw error when start time equals end time', () => {
    expect(() => new Reservation('room-1', 'user-1', tomorrow, tomorrow))
      .toThrow('Start time must be before end time');
  });

  it('should throw error when start time is in the past', () => {
    expect(() => new Reservation('room-1', 'user-1', yesterday, yesterdayEnd))
      .toThrow('Cannot create reservation in the past');
  });

  it('should throw error when roomId is empty', () => {
    expect(() => new Reservation('', 'user-1', tomorrow, tomorrowEnd))
      .toThrow('Room ID is required');
  });

  it('should throw error when userId is empty', () => {
    expect(() => new Reservation('room-1', '', tomorrow, tomorrowEnd))
      .toThrow('User ID is required');
  });

  it('should cancel a confirmed reservation', () => {
    const reservation = new Reservation('room-1', 'user-1', tomorrow, tomorrowEnd);
    reservation.cancel();

    expect(reservation.status).toBe(ReservationStatus.CANCELLED);
  });

  it('should not cancel an already cancelled reservation', () => {
    const reservation = new Reservation('room-1', 'user-1', tomorrow, tomorrowEnd);
    reservation.cancel();

    expect(() => reservation.cancel()).toThrow('Reservation is already cancelled');
  });

  it('should check if two reservations overlap', () => {
    const res1 = new Reservation('room-1', 'user-1', tomorrow, tomorrowEnd);

    const overlapStart = new Date(tomorrow);
    overlapStart.setHours(11, 0, 0, 0);
    const overlapEnd = new Date(tomorrow);
    overlapEnd.setHours(13, 0, 0, 0);
    const res2 = new Reservation('room-1', 'user-2', overlapStart, overlapEnd);

    expect(res1.overlaps(res2)).toBe(true);
  });

  it('should not overlap when times are adjacent', () => {
    const res1 = new Reservation('room-1', 'user-1', tomorrow, tomorrowEnd);

    const adjacentStart = new Date(tomorrowEnd);
    const adjacentEnd = new Date(tomorrowEnd);
    adjacentEnd.setHours(14, 0, 0, 0);
    const res2 = new Reservation('room-1', 'user-2', adjacentStart, adjacentEnd);

    expect(res1.overlaps(res2)).toBe(false);
  });

  it('should not overlap when for different rooms', () => {
    const res1 = new Reservation('room-1', 'user-1', tomorrow, tomorrowEnd);
    const res2 = new Reservation('room-2', 'user-2', tomorrow, tomorrowEnd);

    expect(res1.overlaps(res2)).toBe(false);
  });

  it('should not overlap with cancelled reservation', () => {
    const res1 = new Reservation('room-1', 'user-1', tomorrow, tomorrowEnd);
    res1.cancel();

    const res2 = new Reservation('room-1', 'user-2', tomorrow, tomorrowEnd);

    expect(res1.overlaps(res2)).toBe(false);
  });
});
