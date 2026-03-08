import { randomUUID } from 'crypto';
import { validateNonEmpty, validatePositiveInteger } from './validators.js';

export class Room {
  public readonly id: string;
  public readonly name: string;
  public readonly capacity: number;
  public readonly equipment: string[];
  private _isActive: boolean;

  constructor(name: string, capacity: number, equipment: string[] = []) {
    this.name = validateNonEmpty(name, 'Room name');
    this.capacity = validatePositiveInteger(capacity, 'Capacity');
    this.id = randomUUID();
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
