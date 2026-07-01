import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique id (uses uuid v4).
 */
export function uid(): string {
  return uuidv4();
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
