import { randomUUID } from 'crypto';

export class Room {
  public readonly id: string;
  public readonly name: string;
  public readonly capacity: number;
  public readonly equipment: string[];
  private _isActive: boolean;

  constructor(name: string, capacity: number, equipment: string[] = []) {
    if (!name || name.trim().length === 0) {
      throw new Error('Room name cannot be empty');
    }

    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new Error('Capacity must be a positive integer');
    }

    this.id = randomUUID();
    this.name = name.trim();
    this.capacity = capacity;
    this.equipment = [...equipment];
    this._isActive = true;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  deactivate(): void {
    this._isActive = false;
  }

  activate(): void {
    this._isActive = true;
  }
}
