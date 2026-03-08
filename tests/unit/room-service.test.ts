import { describe, it, expect, beforeEach } from 'vitest';
import { RoomService } from '../../src/service/RoomService.js';

describe('RoomService', () => {
  let service: RoomService;

  beforeEach(() => {
    service = new RoomService();
  });

  it('should create a room', () => {
    const room = service.createRoom('Zasedacka A', 10, ['projektor']);

    expect(room.name).toBe('Zasedacka A');
    expect(service.getAllRooms()).toHaveLength(1);
  });

  it('should find room by id', () => {
    const room = service.createRoom('Zasedacka A', 10);
    const found = service.getRoomById(room.id);

    expect(found).toBeDefined();
    expect(found!.name).toBe('Zasedacka A');
  });

  it('should return undefined for unknown id', () => {
    expect(service.getRoomById('unknown')).toBeUndefined();
  });

  it('should not allow duplicate room names', () => {
    service.createRoom('Zasedacka A', 10);

    expect(() => service.createRoom('Zasedacka A', 5))
      .toThrow('Room with this name already exists');
  });

  it('should deactivate a room', () => {
    const room = service.createRoom('Zasedacka A', 10);
    service.deactivateRoom(room.id);

    expect(service.getRoomById(room.id)!.isActive).toBe(false);
  });

  it('should throw when deactivating unknown room', () => {
    expect(() => service.deactivateRoom('unknown'))
      .toThrow('Room not found');
  });

  it('should get only active rooms', () => {
    service.createRoom('Room 1', 10);
    const room2 = service.createRoom('Room 2', 5);
    service.deactivateRoom(room2.id);

    const active = service.getActiveRooms();
    expect(active).toHaveLength(1);
    expect(active[0].name).toBe('Room 1');
  });
});
