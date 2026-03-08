import { Reservation } from '../domain/Reservation.js';
import { Room } from '../domain/Room.js';
import { User } from '../domain/User.js';

export class ReservationService {
  private reservations: Reservation[] = [];

  createReservation(room: Room, user: User, startTime: Date, endTime: Date): Reservation {
    if (!room.isActive) {
      throw new Error('Cannot reserve an inactive room');
    }

    const newReservation = new Reservation(room.id, user.id, startTime, endTime);

    const hasConflict = this.reservations.some(
      (existing) => existing.overlaps(newReservation)
    );

    if (hasConflict) {
      throw new Error('Room is already reserved for this time slot');
    }

    this.reservations.push(newReservation);
    return newReservation;
  }

  cancelReservation(reservationId: string, user: User): void {
    const reservation = this.reservations.find((r) => r.id === reservationId);

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (reservation.userId !== user.id && !user.isAdmin()) {
      throw new Error('Only the owner or an admin can cancel a reservation');
    }

    reservation.cancel();
  }

  getReservations(): Reservation[] {
    return [...this.reservations];
  }

  getReservationsByRoom(roomId: string): Reservation[] {
    return this.reservations.filter((r) => r.roomId === roomId);
  }

  getReservationsByUser(userId: string): Reservation[] {
    return this.reservations.filter((r) => r.userId === userId);
  }
}
