import { describe, it, expect } from 'vitest';
import {
  validateNonEmpty,
  validatePositiveInteger,
  validateEmail,
  validateTimeRange,
  validateNotInPast,
} from '../../src/domain/validators.js';

describe('validators', () => {
  describe('validateNonEmpty', () => {
    it('should return trimmed value', () => {
      expect(validateNonEmpty('  hello  ', 'Name')).toBe('hello');
    });

    it('should throw for empty string', () => {
      expect(() => validateNonEmpty('', 'Name')).toThrow('Name cannot be empty');
    });

    it('should throw for whitespace only', () => {
      expect(() => validateNonEmpty('   ', 'Name')).toThrow('Name cannot be empty');
    });
  });

  describe('validatePositiveInteger', () => {
    it('should return valid positive integer', () => {
      expect(validatePositiveInteger(5, 'Count')).toBe(5);
    });

    it('should throw for zero', () => {
      expect(() => validatePositiveInteger(0, 'Count')).toThrow('Count must be a positive integer');
    });

    it('should throw for negative', () => {
      expect(() => validatePositiveInteger(-3, 'Count')).toThrow('Count must be a positive integer');
    });

    it('should throw for float', () => {
      expect(() => validatePositiveInteger(2.5, 'Count')).toThrow('Count must be a positive integer');
    });
  });

  describe('validateEmail', () => {
    it('should return trimmed valid email', () => {
      expect(validateEmail('  test@example.com  ')).toBe('test@example.com');
    });

    it('should throw for invalid email', () => {
      expect(() => validateEmail('notanemail')).toThrow('Invalid email format');
    });

    it('should throw for empty', () => {
      expect(() => validateEmail('')).toThrow('Invalid email format');
    });
  });

  describe('validateTimeRange', () => {
    it('should pass for valid range', () => {
      const start = new Date('2030-01-01T10:00:00');
      const end = new Date('2030-01-01T12:00:00');
      expect(() => validateTimeRange(start, end)).not.toThrow();
    });

    it('should throw when start equals end', () => {
      const date = new Date('2030-01-01T10:00:00');
      expect(() => validateTimeRange(date, date)).toThrow('Start time must be before end time');
    });

    it('should throw when start is after end', () => {
      const start = new Date('2030-01-01T14:00:00');
      const end = new Date('2030-01-01T10:00:00');
      expect(() => validateTimeRange(start, end)).toThrow('Start time must be before end time');
    });
  });

  describe('validateNotInPast', () => {
    it('should pass for future date', () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);
      expect(() => validateNotInPast(future)).not.toThrow();
    });

    it('should throw for past date', () => {
      const past = new Date('2020-01-01');
      expect(() => validateNotInPast(past)).toThrow('Cannot create reservation in the past');
    });
  });
});
