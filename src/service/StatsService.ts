import { ReservationService } from './ReservationService.js';

export interface ReservationStats {
  totalReservations: number;
  activeReservations: number;
  cancelledReservations: number;
  mostBookedRoomId: string | null;
}

export class StatsService {
  private reservationService: ReservationService;

  constructor(reservationService: ReservationService) {
    this.reservationService = reservationService;
  }

  getStats(): ReservationStats {
    const reservations = this.reservationService.getReservations();

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
  }
}
