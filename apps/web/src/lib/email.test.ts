import assert from "node:assert/strict";
import test from "node:test";
import { buildProjectRequestNotificationEmail } from "./email.ts";

test("builds a project-specific dashboard link with useful request details", () => {
    const email = buildProjectRequestNotificationEmail({
        requestId: "request-123",
        projectId: "project-123",
        projectName: "Launch campaign",
        clientName: "Acme",
        contactName: "Ada Lovelace",
        contactEmail: "ada@example.com",
        projectType: "Film Production",
        timeline: "Six weeks",
        budgetRange: "$25k-$50k",
        description: "A new campaign film.",
        status: "SOW_DRAFT",
    }, "https://talentearth.com");

    assert.equal(email.subject, "New project request: Launch campaign");
    assert.equal(email.dashboardUrl, "https://talentearth.com/admin/projects?project=project-123");
    assert.match(email.html, /Ada Lovelace/);
    assert.match(email.html, /Sow Draft/);
    assert.match(email.text, /Review in dashboard: https:\/\/talentearth\.com\/admin\/projects\?project=project-123/);
});

test("escapes submitted content and strips newlines from the subject", () => {
    const email = buildProjectRequestNotificationEmail({
        requestId: "request-456",
        projectName: "Campaign\r\nBcc: attacker@example.com",
        clientName: "<script>alert('no')</script>",
        description: "<b>Untrusted brief</b>",
        dashboardPath: "/admin",
    }, "https://talentearth.com");

    assert.equal(email.subject, "New project request: Campaign Bcc: attacker@example.com");
    assert.doesNotMatch(email.html, /<script>/);
    assert.doesNotMatch(email.html, /<b>Untrusted brief<\/b>/);
    assert.match(email.html, /&lt;script&gt;/);
    assert.equal(email.dashboardUrl, "https://talentearth.com/admin");
});
