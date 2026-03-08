import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService } from '../../src/service/NotificationService.js';
import { ReservationService } from '../../src/service/ReservationService.js';
import { Room } from '../../src/domain/Room.js';
import { User } from '../../src/domain/User.js';

describe('ReservationService with mocked NotificationService', () => {
  let service: ReservationService;
  let mockNotification: NotificationService;
  let room: Room;
  let user: User;

  const tomorrow = (hour: number) => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(hour, 0, 0, 0);
    return d;
  };

  beforeEach(() => {
    mockNotification = {
      sendReservationConfirmation: vi.fn().mockResolvedValue(undefined),
      sendCancellationNotice: vi.fn().mockResolvedValue(undefined),
    };

    service = new ReservationService(mockNotification);
    room = new Room('Zasedacka A', 10);
    user = new User('Jan Novak', 'jan@example.com');
  });

  it('should send confirmation when reservation is created', async () => {
    await service.createReservation(room, user, tomorrow(10), tomorrow(12));

    expect(mockNotification.sendReservationConfirmation).toHaveBeenCalledOnce();
    expect(mockNotification.sendReservationConfirmation).toHaveBeenCalledWith(
      'jan@example.com',
      'Zasedacka A',
      tomorrow(10),
      tomorrow(12),
    );
  });

  it('should send cancellation notice when reservation is cancelled', async () => {
    const res = await service.createReservation(room, user, tomorrow(10), tomorrow(12));
    await service.cancelReservation(res.id, user);

    expect(mockNotification.sendCancellationNotice).toHaveBeenCalledOnce();
    expect(mockNotification.sendCancellationNotice).toHaveBeenCalledWith(
      'jan@example.com',
      'Zasedacka A',
    );
  });

  it('should not send notification when reservation fails', () => {
    room.deactivate();

    expect(() => service.createReservation(room, user, tomorrow(10), tomorrow(12)))
      .toThrow('Cannot reserve an inactive room');

    expect(mockNotification.sendReservationConfirmation).not.toHaveBeenCalled();
  });

  it('should work without notification service', () => {
    const serviceWithout = new ReservationService();
    const res = serviceWithout.createReservation(room, user, tomorrow(10), tomorrow(12));

    expect(res).toBeDefined();
  });
});
