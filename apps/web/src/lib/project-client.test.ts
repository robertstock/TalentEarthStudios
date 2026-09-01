import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeSubmittedProjectClientName,
  resolveProjectClientName,
  UNASSIGNED_PROJECT_CLIENT_NAME,
} from "./project-client.ts";

test("missing project clients use a generic label instead of the submitter's company", () => {
  assert.equal(normalizeSubmittedProjectClientName(""), UNASSIGNED_PROJECT_CLIENT_NAME);
  assert.equal(normalizeSubmittedProjectClientName("   "), UNASSIGNED_PROJECT_CLIENT_NAME);
});

test("an explicitly submitted project client is preserved", () => {
  assert.equal(normalizeSubmittedProjectClientName(" IN-N-OUT Chino "), "IN-N-OUT Chino");
});

test("legacy projects linked to the administrator's client profile display as unassigned", () => {
  assert.equal(resolveProjectClientName({
    clientNameOverride: null,
    linkedClientName: "Gallagher",
    linkedClientEmail: "robertstock@me.com",
    administratorEmail: "RobertStock@me.com",
  }), UNASSIGNED_PROJECT_CLIENT_NAME);
});

test("project-specific client names take precedence over linked profile names", () => {
  assert.equal(resolveProjectClientName({
    clientNameOverride: "The Actors Gang",
    linkedClientName: "Gallagher",
    linkedClientEmail: "robertstock@me.com",
    administratorEmail: "robertstock@me.com",
  }), "The Actors Gang");
});
