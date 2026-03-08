import { Room } from '../domain/Room.js';

export class RoomService {
  private rooms: Map<string, Room> = new Map();

  createRoom(name: string, capacity: number, equipment: string[] = []): Room {
    const existing = Array.from(this.rooms.values()).find(
      (r) => r.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (existing) {
      throw new Error('Room with this name already exists');
    }

    const room = new Room(name, capacity, equipment);
    this.rooms.set(room.id, room);
    return room;
  }

  getRoomById(id: string): Room | undefined {
    return this.rooms.get(id);
  }

  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  getActiveRooms(): Room[] {
    return Array.from(this.rooms.values()).filter((r) => r.isActive);
  }

  deactivateRoom(id: string): void {
    const room = this.rooms.get(id);
    if (!room) {
      throw new Error('Room not found');
    }
    room.deactivate();
  }
}
