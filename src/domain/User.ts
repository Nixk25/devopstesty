import { randomUUID } from 'crypto';
import { validateNonEmpty, validateEmail } from './validators.js';

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
    this.name = validateNonEmpty(name, 'User name');
    this.email = validateEmail(email);
    this.id = randomUUID();
    this.role = role;
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }
}
