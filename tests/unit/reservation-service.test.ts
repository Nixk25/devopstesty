import { describe, it, expect, beforeEach } from 'vitest';
import { ReservationService } from '../../src/service/ReservationService.js';
import { Room } from '../../src/domain/Room.js';
import { User, UserRole } from '../../src/domain/User.js';

describe('ReservationService', () => {
  let service: ReservationService;
  let room: Room;
  let user: User;
  let admin: User;

  const tomorrow = (hour: number) => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(hour, 0, 0, 0);
    return d;
  };

  beforeEach(() => {
    service = new ReservationService();
    room = new Room('Zasedacka A', 10);
    user = new User('Jan Novak', 'jan@example.com');
    admin = new User('Admin', 'admin@example.com', UserRole.ADMIN);
  });

  it('should create a reservation', () => {
    const reservation = service.createReservation(room, user, tomorrow(10), tomorrow(12));

    expect(reservation.roomId).toBe(room.id);
    expect(reservation.userId).toBe(user.id);
    expect(service.getReservations()).toHaveLength(1);
  });

  it('should reject reservation for inactive room', () => {
    room.deactivate();

    expect(() => service.createReservation(room, user, tomorrow(10), tomorrow(12)))
      .toThrow('Cannot reserve an inactive room');
  });

  it('should reject overlapping reservation for same room', () => {
    service.createReservation(room, user, tomorrow(10), tomorrow(12));

    const otherUser = new User('Petra', 'petra@example.com');
    expect(() => service.createReservation(room, otherUser, tomorrow(11), tomorrow(13)))
      .toThrow('Room is already reserved for this time slot');
  });

  it('should allow reservation for different room at same time', () => {
    const room2 = new Room('Ucebna B', 20);
    service.createReservation(room, user, tomorrow(10), tomorrow(12));
    service.createReservation(room2, user, tomorrow(10), tomorrow(12));

    expect(service.getReservations()).toHaveLength(2);
  });

  it('should allow reservation after cancelled one', () => {
    const res = service.createReservation(room, user, tomorrow(10), tomorrow(12));
    service.cancelReservation(res.id, user);

    const otherUser = new User('Petra', 'petra@example.com');
    const newRes = service.createReservation(room, otherUser, tomorrow(10), tomorrow(12));

    expect(newRes).toBeDefined();
    expect(service.getReservations()).toHaveLength(2);
  });

  it('should cancel own reservation', () => {
    const res = service.createReservation(room, user, tomorrow(10), tomorrow(12));
    service.cancelReservation(res.id, user);

    expect(res.status).toBe('cancelled');
  });

  it('should allow admin to cancel any reservation', () => {
    const res = service.createReservation(room, user, tomorrow(10), tomorrow(12));
    service.cancelReservation(res.id, admin);

    expect(res.status).toBe('cancelled');
  });

  it('should reject cancellation by different non-admin user', () => {
    const res = service.createReservation(room, user, tomorrow(10), tomorrow(12));
    const otherUser = new User('Petra', 'petra@example.com');

    expect(() => service.cancelReservation(res.id, otherUser))
      .toThrow('Only the owner or an admin can cancel a reservation');
  });

  it('should throw when cancelling non-existent reservation', () => {
    expect(() => service.cancelReservation('fake-id', user))
      .toThrow('Reservation not found');
  });

  it('should get reservations by room', () => {
    const room2 = new Room('Ucebna B', 20);
    service.createReservation(room, user, tomorrow(10), tomorrow(12));
    service.createReservation(room2, user, tomorrow(10), tomorrow(12));
    service.createReservation(room, user, tomorrow(14), tomorrow(16));

    const roomReservations = service.getReservationsByRoom(room.id);
    expect(roomReservations).toHaveLength(2);
  });

  it('should get reservations by user', () => {
    const otherUser = new User('Petra', 'petra@example.com');
    service.createReservation(room, user, tomorrow(10), tomorrow(12));
    service.createReservation(room, otherUser, tomorrow(14), tomorrow(16));

    const userReservations = service.getReservationsByUser(user.id);
    expect(userReservations).toHaveLength(1);
  });
});
