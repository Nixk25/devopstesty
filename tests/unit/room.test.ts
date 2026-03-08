import { describe, it, expect } from 'vitest';
import { Room } from '../../src/domain/Room.js';

describe('Room', () => {
  it('should create a room with valid properties', () => {
    const room = new Room('Zasedačka A', 10, ['projektor', 'tabule']);

    expect(room.name).toBe('Zasedačka A');
    expect(room.capacity).toBe(10);
    expect(room.equipment).toEqual(['projektor', 'tabule']);
    expect(room.isActive).toBe(true);
    expect(room.id).toBeDefined();
  });

  it('should throw error when name is empty', () => {
    expect(() => new Room('', 10)).toThrow('Room name cannot be empty');
  });

  it('should throw error when name is only whitespace', () => {
    expect(() => new Room('   ', 10)).toThrow('Room name cannot be empty');
  });

  it('should throw error when capacity is zero', () => {
    expect(() => new Room('Test', 0)).toThrow('Capacity must be a positive integer');
  });

  it('should throw error when capacity is negative', () => {
    expect(() => new Room('Test', -5)).toThrow('Capacity must be a positive integer');
  });

  it('should throw error when capacity is not an integer', () => {
    expect(() => new Room('Test', 3.5)).toThrow('Capacity must be a positive integer');
  });

  it('should create a room with empty equipment by default', () => {
    const room = new Room('Učebna B', 20);

    expect(room.equipment).toEqual([]);
  });

  it('should deactivate a room', () => {
    const room = new Room('Zasedačka A', 10);
    room.deactivate();

    expect(room.isActive).toBe(false);
  });

  it('should activate a room', () => {
    const room = new Room('Zasedačka A', 10);
    room.deactivate();
    room.activate();

    expect(room.isActive).toBe(true);
  });
});
