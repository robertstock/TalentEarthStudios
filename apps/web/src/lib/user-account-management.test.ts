import assert from "node:assert/strict";
import test from "node:test";

import {
    getPermanentDeletionError,
    getProtectedAdministratorChangeError,
    isStatusAllowedForRole,
} from "./user-account-management.ts";

test("administrators can only be active or suspended", () => {
    assert.equal(isStatusAllowedForRole("ADMIN", "APPROVED"), true);
    assert.equal(isStatusAllowedForRole("ADMIN", "SUSPENDED"), true);
    assert.equal(isStatusAllowedForRole("ADMIN", "PENDING_REVIEW"), false);
});

test("talent accounts can use every workflow status", () => {
    assert.equal(isStatusAllowedForRole("TALENT", "DRAFT"), true);
    assert.equal(isStatusAllowedForRole("TALENT", "REJECTED"), true);
});

test("protects the acting administrator and final active administrator", () => {
    assert.match(
        getProtectedAdministratorChangeError({
            actingAdministratorId: "admin-1",
            targetUserId: "admin-1",
            targetRole: "ADMIN",
            targetStatus: "APPROVED",
            activeAdministratorCount: 2,
        }) || "",
        /your own/i,
    );

    assert.match(
        getProtectedAdministratorChangeError({
            actingAdministratorId: "admin-1",
            targetUserId: "admin-2",
            targetRole: "ADMIN",
            targetStatus: "APPROVED",
            activeAdministratorCount: 1,
        }) || "",
        /at least one/i,
    );
});

test("allows role or status changes for a different administrator when a backup remains", () => {
    assert.equal(
        getProtectedAdministratorChangeError({
            actingAdministratorId: "admin-1",
            targetUserId: "admin-2",
            targetRole: "ADMIN",
            targetStatus: "APPROVED",
            activeAdministratorCount: 2,
        }),
        null,
    );
});

test("blocks permanent deletion when linked history exists", () => {
    assert.match(
        getPermanentDeletionError({
            actingAdministratorId: "admin-1",
            targetUserId: "talent-1",
            targetRole: "TALENT",
            targetStatus: "APPROVED",
            activeAdministratorCount: 1,
            linkedHistoryCount: 1,
        }) || "",
        /linked work or audit history/i,
    );
});

test("allows permanent deletion of an unused account", () => {
    assert.equal(
        getPermanentDeletionError({
            actingAdministratorId: "admin-1",
            targetUserId: "talent-1",
            targetRole: "TALENT",
            targetStatus: "PENDING_REVIEW",
            activeAdministratorCount: 1,
            linkedHistoryCount: 0,
        }),
        null,
    );
});
