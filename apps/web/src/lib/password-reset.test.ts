import assert from "node:assert/strict";
import test from "node:test";
import {
    createPasswordResetToken,
    hashPasswordResetToken,
    normalizeAccountEmail,
    PASSWORD_RESET_EXPIRY_MS,
} from "./password-reset.ts";

test("normalizes admin email addresses", () => {
    assert.equal(normalizeAccountEmail("  RobertStock@ME.com  "), "robertstock@me.com");
});

test("creates a one-hour, one-time password reset token", () => {
    const now = Date.UTC(2026, 7, 31, 23, 0, 0);
    const reset = createPasswordResetToken(now);

    assert.match(reset.token, /^[a-f0-9]{64}$/);
    assert.equal(reset.tokenHash, hashPasswordResetToken(reset.token));
    assert.notEqual(reset.token, reset.tokenHash);
    assert.equal(reset.expiresAt.getTime(), now + PASSWORD_RESET_EXPIRY_MS);
});

test("creates different reset tokens for separate requests", () => {
    assert.notEqual(createPasswordResetToken().token, createPasswordResetToken().token);
});
