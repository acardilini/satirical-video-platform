import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique ID for database entities
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Validate that a shot duration is within the 8-second limit
 */
export function validateShotDuration(seconds: number): boolean {
  return seconds > 0 && seconds <= 8;
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if a string is empty or whitespace only
 */
export function isEmptyOrWhitespace(str: string | undefined | null): boolean {
  return !str || str.trim().length === 0;
}

/**
 * Generate a schema-compliant prompt for Veo3
 */
export function generateVeo3Prompt(briefData: {
  shotType: string;
  subject: string;
  action: string;
  cameraAngle: string;
  lighting: string;
  mood: string;
  style: string;
  duration: number;
}): string {
  return `For Veo3: ${briefData.shotType} shot of ${briefData.subject} ${briefData.action}, ` +
         `${briefData.cameraAngle} camera angle, ${briefData.lighting} lighting, ` +
         `${briefData.mood} mood, ${briefData.style} style, ${briefData.duration}s duration`;
}

/**
 * Truncate text to specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Convert camelCase to Title Case
 */
export function camelToTitle(camelCase: string): string {
  return camelCase
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}