import assert from "node:assert/strict";
import test from "node:test";
import {
  hashCode,
  hashToken,
  matchesCode,
  newCode,
  newSessionToken,
  normalizeMobileEmail,
  rateLimitKey,
} from "./mobile-security.ts";
import { mobileProjectData, mobileProjectInput } from "./mobile-projects.ts";

test("codes are bound to a challenge and secret, with strict six-digit comparison", () => {
  const digest = hashCode("challenge-a", "000123", "test-secret");
  assert.equal(
    matchesCode("challenge-a", "000123", digest, "test-secret"),
    true,
  );
  for (const [challenge, code, secret] of [
    ["challenge-b", "000123", "test-secret"],
    ["challenge-a", "000123", "wrong-secret"],
    ["challenge-a", "123", "test-secret"],
    ["challenge-a", "000124", "test-secret"],
  ]) {
    assert.equal(matchesCode(challenge, code, digest, secret), false);
  }
  assert.equal(
    matchesCode("challenge-a", "000123", "invalid", "test-secret"),
    false,
  );
});
test("sessions are unpredictable and only their hashes need storage", () => {
  const tokens = new Set(Array.from({ length: 100 }, () => newSessionToken()));
  assert.equal(tokens.size, 100);
  for (const token of tokens) {
    assert.match(token, /^[a-f0-9]{64}$/);
    assert.notEqual(hashToken(token), token);
  }
  assert.match(newCode(), /^\d{6}$/);
  assert.equal(normalizeMobileEmail(" Ada@Example.COM "), "ada@example.com");
});
test("rate counters keep identities private and share a window across instances", () => {
  const first = rateLimitKey("email", "ada@example.com", 60_000, 60_100);
  assert.equal(
    first.key,
    rateLimitKey("email", "ada@example.com", 60_000, 119_999).key,
  );
  assert.notEqual(
    first.key,
    rateLimitKey("email", "ada@example.com", 60_000, 120_000).key,
  );
  assert.ok(!first.key.includes("ada@example.com"));
  assert.equal(first.expiresAt.getTime(), 120_000);
});
test("mobile projects enter Incoming with an editable SOW and preserve exact customer wording", () => {
  const input = mobileProjectInput.parse({
    submissionId: "8a41bc11-994d-4a39-8b61-0388d31b7b28",
    name: "  Launch film  ",
    summary: "A launch film for our new product. Budget is not decided.",
    transcript: "We need a launch film. Not sure of the budget yet.",
    status: "APPROVED_FOR_SOW",
    createdById: "attacker",
  });
  const data = mobileProjectData(input, "client-1", "admin-1");
  assert.equal(data.name, "Launch film");
  assert.equal(data.status, "SOW_DRAFT");
  assert.equal(data.createdById, "admin-1");
  assert.equal(data.isAutoRouted, false);
  assert.equal(data.requiresRpmReview, true);
  assert.equal(data.sows.create.bodyRichText, input.summary);
  assert.equal(data.meetingNotes?.create.content, input.transcript);
});
test("project submission requires a stable id, meaningful summary and bounded fields", () => {
  const valid = {
    submissionId: "8a41bc11-994d-4a39-8b61-0388d31b7b28",
    name: "Launch",
    summary: "A launch film for our product.",
  };
  for (const change of [
    { submissionId: "" },
    { name: " " },
    { summary: " " },
    { name: "a".repeat(161) },
    { transcript: "a".repeat(40_001) },
  ])
    assert.equal(
      mobileProjectInput.safeParse({ ...valid, ...change }).success,
      false,
    );
});
