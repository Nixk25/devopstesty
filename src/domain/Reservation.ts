import { randomUUID } from 'crypto';
import { validateNonEmpty, validateTimeRange, validateNotInPast } from './validators.js';

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
    this.roomId = validateNonEmpty(roomId, 'Room ID');
    this.userId = validateNonEmpty(userId, 'User ID');
    validateTimeRange(startTime, endTime);
    validateNotInPast(startTime);

    this.id = randomUUID();
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
