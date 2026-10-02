import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const { teamRoster, teamSchema, teamSlug } = createRequire(import.meta.url)(
  "./team-management.ts",
);

const valid = {
  name: " Film Team ",
  leaderUserId: "leader",
  members: [{ userId: "member", roleInTeam: " Producer " }],
};
test("normalizes fields and includes the leader exactly once", () => {
  const parsed = teamSchema.parse(valid);
  assert.equal(parsed.name, "Film Team");
  assert.deepEqual(teamRoster(parsed), [
    { userId: "leader", roleInTeam: "Team Leader" },
    { userId: "member", roleInTeam: "Producer" },
  ]);
  const withLeader = teamSchema.parse({
    ...valid,
    members: [{ userId: "leader", roleInTeam: "Director" }],
  });
  assert.deepEqual(teamRoster(withLeader), [
    { userId: "leader", roleInTeam: "Director" },
  ]);
});
test("rejects missing leadership, blank names, duplicate members and oversized rosters", () => {
  for (const input of [
    { ...valid, leaderUserId: "" },
    { ...valid, name: "   " },
    { ...valid, members: [valid.members[0], valid.members[0]] },
    {
      ...valid,
      members: Array.from({ length: 100 }, (_, index) => ({
        userId: `member-${index}`,
      })),
    },
  ]) {
    assert.equal(teamSchema.safeParse(input).success, false);
  }
});
test("leader-only teams and blank member roles are supported", () => {
  assert.deepEqual(teamRoster(teamSchema.parse({ ...valid, members: [] })), [
    { userId: "leader", roleInTeam: "Team Leader" },
  ]);
  const roster = teamRoster(
    teamSchema.parse({
      ...valid,
      members: [{ userId: "member", roleInTeam: " " }],
    }),
  );
  assert.equal(roster[1].roleInTeam, "Member");
});
test("names generate URL-safe bases, including non-Latin names", () => {
  assert.equal(teamSlug("Café & Film / Studio"), "cafe-film-studio");
  assert.equal(teamSlug("東京"), "team");
});
