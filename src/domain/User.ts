import { randomUUID } from 'crypto';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export class User {
  public readonly id: string;
  public readonly name: string;
  public readonly email: string;
  public readonly role: UserRole;

  constructor(name: string, email: string, role: UserRole = UserRole.USER) {
    if (!name || name.trim().length === 0) {
      throw new Error('User name cannot be empty');
    }

    const trimmedEmail = email?.trim() || '';
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      throw new Error('Invalid email format');
    }

    this.id = randomUUID();
    this.name = name.trim();
    this.email = trimmedEmail;
    this.role = role;
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }
}
