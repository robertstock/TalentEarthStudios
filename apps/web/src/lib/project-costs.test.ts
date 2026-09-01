import assert from "node:assert/strict";
import test from "node:test";

import {
    normalizeProjectCostAmountInput,
    parseProjectCostAmount,
} from "./project-costs.ts";

test("accepts whole-dollar and decimal currency input identically", () => {
    assert.equal(parseProjectCostAmount("360"), 360);
    assert.equal(parseProjectCostAmount("360.00"), 360);
    assert.equal(parseProjectCostAmount(360), 360);
});

test("normalizes valid cost input to two decimal places", () => {
    assert.equal(normalizeProjectCostAmountInput("360"), "360.00");
    assert.equal(normalizeProjectCostAmountInput("1,234.5"), "1234.50");
    assert.equal(normalizeProjectCostAmountInput("360.125"), "360.13");
});

test("rejects blank, zero, negative, and nonnumeric cost input", () => {
    assert.equal(parseProjectCostAmount(""), null);
    assert.equal(parseProjectCostAmount("0"), null);
    assert.equal(parseProjectCostAmount("-1"), null);
    assert.equal(parseProjectCostAmount("not-a-number"), null);
});
