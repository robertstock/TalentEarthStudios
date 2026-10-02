import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";

export const CODE_TTL_MS = 10 * 60 * 1000;
export const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000;
export const MAX_CODE_ATTEMPTS = 5;
export const MAX_AUDIO_BYTES = 3_500_000;
export const MAX_RECORDING_SECONDS = 600;

export function normalizeMobileEmail(email: string) {
  return email.trim().toLowerCase();
}
export function newCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}
export function newSessionToken() {
  return randomBytes(32).toString("hex");
}
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export function hashCode(challengeId: string, code: string, secret: string) {
  return createHmac("sha256", secret)
    .update(`${challengeId}:${code}`)
    .digest("hex");
}
export function matchesCode(
  challengeId: string,
  code: string,
  digest: string,
  secret: string,
) {
  if (!/^\d{6}$/.test(code) || !/^[a-f0-9]{64}$/.test(digest)) return false;
  return timingSafeEqual(
    Buffer.from(hashCode(challengeId, code, secret), "hex"),
    Buffer.from(digest, "hex"),
  );
}
export function rateLimitKey(
  scope: string,
  identity: string,
  windowMs: number,
  now = Date.now(),
) {
  const window = Math.floor(now / windowMs);
  return {
    key: `${scope}:${hashToken(identity)}:${window}`,
    expiresAt: new Date((window + 1) * windowMs),
  };
}
