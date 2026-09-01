import assert from "node:assert/strict";
import test from "node:test";

import {
    calculateProjectPricing,
    removeProjectCostLine,
    upsertProjectCostLine,
    type ProjectPricingLine,
} from "./project-pricing.ts";

const startingLines: ProjectPricingLine[] = [
    { id: "cost-1", amount: 54, category: "MATERIALS", vendorName: "Material" },
];

test("the existing $54 cost at 1x produces $54 retail and $0 gross profit", () => {
    const pricing = calculateProjectPricing(startingLines, 1);

    assert.equal(pricing.totalCosts, 54);
    assert.equal(pricing.retailPrice, 54);
    assert.equal(pricing.grossProfit, 0);
    assert.equal(pricing.grossMargin, 0);
});

test("editing a saved cost immediately recalculates totals", () => {
    const updatedLines = upsertProjectCostLine(startingLines, {
        ...startingLines[0],
        amount: 360,
    });
    const pricing = calculateProjectPricing(updatedLines, 2);

    assert.equal(updatedLines.length, 1);
    assert.equal(pricing.totalCosts, 360);
    assert.equal(pricing.retailPrice, 720);
    assert.equal(pricing.grossProfit, 360);
    assert.equal(pricing.grossMargin, 50);
});

test("deleting a saved cost immediately removes it from every total", () => {
    const remainingLines = removeProjectCostLine(startingLines, "cost-1");
    const pricing = calculateProjectPricing(remainingLines, 10);

    assert.deepEqual(remainingLines, []);
    assert.equal(pricing.totalCosts, 0);
    assert.equal(pricing.retailPrice, 0);
    assert.equal(pricing.grossProfit, 0);
    assert.equal(pricing.grossMargin, 0);
});

test("delivery remains pass-through while other costs use the multiplier", () => {
    const pricing = calculateProjectPricing([
        { id: "delivery", amount: 50, category: "COURIER_FREIGHT", vendorName: "Courier" },
        { id: "materials", amount: 100, category: "MATERIALS", vendorName: "Materials" },
    ], 3);

    assert.equal(pricing.deliveryCosts, 50);
    assert.equal(pricing.markupEligibleCosts, 100);
    assert.equal(pricing.totalCosts, 150);
    assert.equal(pricing.retailPrice, 350);
    assert.equal(pricing.grossProfit, 200);
});
