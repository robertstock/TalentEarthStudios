import assert from "node:assert/strict";
import test from "node:test";
import {
    administratorInviteSchema,
    getAdministratorDeactivationError,
} from "./admin-management.ts";

test("normalizes a valid administrator invitation", () => {
    const result = administratorInviteSchema.parse({
        firstName: "  Robert ",
        lastName: " Stock  ",
        email: "  New.Admin@TalentEarth.com ",
    });

    assert.deepEqual(result, {
        firstName: "Robert",
        lastName: "Stock",
        email: "new.admin@talentearth.com",
    });
});

test("rejects incomplete or invalid administrator invitations", () => {
    assert.equal(
        administratorInviteSchema.safeParse({ firstName: "", lastName: "Admin", email: "not-an-email" }).success,
        false,
    );
});

test("prevents administrators from deactivating themselves", () => {
    assert.equal(
        getAdministratorDeactivationError("admin-1", "admin-1", 2),
        "You cannot deactivate your own administrator account.",
    );
});

test("prevents deactivating the final active administrator", () => {
    assert.equal(
        getAdministratorDeactivationError("admin-1", "admin-2", 1),
        "At least one active administrator account is required.",
    );
});

test("allows another administrator to be deactivated when a backup remains", () => {
    assert.equal(getAdministratorDeactivationError("admin-1", "admin-2", 2), null);
});
