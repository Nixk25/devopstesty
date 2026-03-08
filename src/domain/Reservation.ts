import { randomUUID } from 'crypto';

export enum ReservationStatus {
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

export class Reservation {
  public readonly id: string;
  public readonly roomId: string;
  public readonly userId: string;
  public readonly startTime: Date;
  public readonly endTime: Date;
  private _status: ReservationStatus;

  constructor(roomId: string, userId: string, startTime: Date, endTime: Date) {
    if (!roomId || roomId.trim().length === 0) {
      throw new Error('Room ID is required');
    }

    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    if (startTime >= endTime) {
      throw new Error('Start time must be before end time');
    }

    if (startTime < new Date()) {
      throw new Error('Cannot create reservation in the past');
    }

    this.id = randomUUID();
    this.roomId = roomId;
    this.userId = userId;
    this.startTime = new Date(startTime);
    this.endTime = new Date(endTime);
    this._status = ReservationStatus.CONFIRMED;
  }

  get status(): ReservationStatus {
    return this._status;
  }

  cancel(): void {
    if (this._status === ReservationStatus.CANCELLED) {
      throw new Error('Reservation is already cancelled');
    }
    this._status = ReservationStatus.CANCELLED;
  }

  overlaps(other: Reservation): boolean {
    if (this.roomId !== other.roomId) return false;
    if (this._status === ReservationStatus.CANCELLED) return false;
    if (other._status === ReservationStatus.CANCELLED) return false;

    return this.startTime < other.endTime && this.endTime > other.startTime;
  }
}
