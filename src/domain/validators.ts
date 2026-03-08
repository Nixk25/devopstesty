export function validateNonEmpty(value: string, fieldName: string): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`${fieldName} cannot be empty`);
  }
  return value.trim();
}

export function validatePositiveInteger(value: number, fieldName: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer`);
  }
  return value;
}

export function validateEmail(email: string): string {
  const trimmed = email?.trim() || '';
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    throw new Error('Invalid email format');
  }
  return trimmed;
}

export function validateTimeRange(start: Date, end: Date): void {
  if (start >= end) {
    throw new Error('Start time must be before end time');
  }
}

export function validateNotInPast(date: Date): void {
  if (date < new Date()) {
    throw new Error('Cannot create reservation in the past');
  }
}
