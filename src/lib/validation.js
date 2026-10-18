// Small, dependency-free validators shared by the browser forms and the Express API
// (the server imports this file too, so both sides enforce the same rule).

// Accepts "9812345678", "+977 981-234-5678", "(01) 4412345": digits plus + space - ( ).
// Must contain 7 to 15 digits (E.164 maximum).
export function isValidPhone(value) {
  if (typeof value !== 'string') return false;
  const s = value.trim();
  if (s.length < 7 || s.length > 30) return false;
  if (!/^\+?[0-9\s\-()]+$/.test(s)) return false;
  const digits = s.replace(/\D/g, '').length;
  return digits >= 7 && digits <= 15;
}

export const PHONE_MESSAGE = 'Enter a valid phone number (7–15 digits, e.g. 98XXXXXXXX or +977 98XXXXXXXX).';

export function validateName(value) {
  const s = typeof value === 'string' ? value.trim() : '';
  if (s.length < 2) return 'Enter your full name (at least 2 characters).';
  if (s.length > 100) return 'Name must be 100 characters or fewer.';
  return '';
}

export function validatePhone(value) {
  return isValidPhone(value) ? '' : PHONE_MESSAGE;
}

export function validateRequired(value, label, max = 200) {
  const s = typeof value === 'string' ? value.trim() : '';
  if (!s) return `${label} is required.`;
  if (s.length > max) return `${label} must be ${max} characters or fewer.`;
  return '';
}

// Profile pictures are stored as a small JPEG data URI (or the https URL Google gave us).
export const MAX_AVATAR_FILE_BYTES = 8 * 1024 * 1024; // picked file, before the browser shrinks it
export const MAX_AVATAR_DATA_CHARS = 400_000;         // stored value
export const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
