const PASS_VERSION = 'v1';
const PASS_PREFIX = 'gymli';

/**
 * The digital pass is a self-issued, staff-verified identity code, not a
 * signed credential for third-party door hardware. Rotating the code on
 * every pass view limits reuse of a stale screenshot; it does not protect
 * against a user simply re-opening the app to get a fresh one.
 */
export function generatePassCode(): string {
  return Array.from({ length: 8 }, () => Math.floor(Math.random() * 36).toString(36))
    .join('')
    .toUpperCase();
}

export function generateMemberNumber(): string {
  const digits = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');
  return `GYM-${digits}`;
}

export function encodePassPayload(uid: string, passCode: string): string {
  return `${PASS_PREFIX}:${PASS_VERSION}:${uid}:${passCode}`;
}

export function decodePassPayload(payload: string): { uid: string; passCode: string } | null {
  const parts = payload.split(':');
  if (parts.length !== 4 || parts[0] !== PASS_PREFIX || parts[1] !== PASS_VERSION) {
    return null;
  }
  const [, , uid, passCode] = parts;
  if (!uid || !passCode) return null;
  return { uid, passCode };
}
