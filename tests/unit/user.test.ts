import { describe, it, expect } from 'vitest';
import { User, UserRole } from '../../src/domain/User.js';

describe('User', () => {
  it('should create a user with valid properties', () => {
    const user = new User('Jan Novak', 'jan@example.com', UserRole.USER);

    expect(user.name).toBe('Jan Novak');
    expect(user.email).toBe('jan@example.com');
    expect(user.role).toBe(UserRole.USER);
    expect(user.id).toBeDefined();
  });

  it('should default role to USER', () => {
    const user = new User('Jan Novak', 'jan@example.com');

    expect(user.role).toBe(UserRole.USER);
  });

  it('should create an admin user', () => {
    const user = new User('Admin', 'admin@example.com', UserRole.ADMIN);

    expect(user.role).toBe(UserRole.ADMIN);
  });

  it('should throw error when name is empty', () => {
    expect(() => new User('', 'jan@example.com')).toThrow('User name cannot be empty');
  });

  it('should throw error when email is empty', () => {
    expect(() => new User('Jan', '')).toThrow('Invalid email format');
  });

  it('should throw error when email has invalid format', () => {
    expect(() => new User('Jan', 'not-an-email')).toThrow('Invalid email format');
  });

  it('should throw error when email has no domain', () => {
    expect(() => new User('Jan', 'jan@')).toThrow('Invalid email format');
  });

  it('should trim name and email', () => {
    const user = new User('  Jan Novak  ', '  jan@example.com  ');

    expect(user.name).toBe('Jan Novak');
    expect(user.email).toBe('jan@example.com');
  });

  it('should check if user is admin', () => {
    const admin = new User('Admin', 'admin@example.com', UserRole.ADMIN);
    const user = new User('User', 'user@example.com', UserRole.USER);

    expect(admin.isAdmin()).toBe(true);
    expect(user.isAdmin()).toBe(false);
  });
});
