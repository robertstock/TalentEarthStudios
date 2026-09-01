import assert from "node:assert/strict";
import test from "node:test";

import {
    calculateProjectPricing,
    calculateRetailMultiplier,
    getRetailPriceRange,
    parseRetailPriceInput,
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

test("an exact retail price derives a precise multiplier while delivery remains at cost", () => {
    const markupEligibleCosts = 640;
    const deliveryCosts = 25;
    const requestedRetailPrice = 1_299.99;
    const multiplier = calculateRetailMultiplier(requestedRetailPrice, markupEligibleCosts, deliveryCosts);

    assert.equal(multiplier, 1.99217188);

    const pricing = calculateProjectPricing([
        { id: "delivery", amount: deliveryCosts, category: "COURIER_FREIGHT", vendorName: "Courier" },
        { id: "production", amount: markupEligibleCosts, category: "MATERIALS", vendorName: "Production" },
    ], multiplier!);

    assert.equal(pricing.deliveryCosts, 25);
    assert.equal(pricing.retailPrice, requestedRetailPrice);
});

test("retail price input accepts currency-style numbers and enforces the 0x to 10x range", () => {
    assert.equal(parseRetailPriceInput("1,299.99"), 1_299.99);
    assert.deepEqual(getRetailPriceRange(100, 25), {
        minimumRetailPrice: 25,
        maximumRetailPrice: 1_025,
    });
    assert.equal(calculateRetailMultiplier(24.99, 100, 25), null);
    assert.equal(calculateRetailMultiplier(1_025.01, 100, 25), null);
});

test("exact retail pricing remains exact across multiple rounded invoice line items", () => {
    const lines: ProjectPricingLine[] = [
        { id: "printing", amount: 333.33, category: "OUTSIDE_PRINTING", vendorName: "Printing" },
        { id: "materials", amount: 306.67, category: "MATERIALS", vendorName: "Materials" },
        { id: "delivery", amount: 25, category: "COURIER_FREIGHT", vendorName: "Courier" },
    ];
    const multiplier = calculateRetailMultiplier(1_299.99, 640, 25);
    assert.notEqual(multiplier, null);

    const pricing = calculateProjectPricing(lines, multiplier!);

    assert.equal(pricing.retailPrice, 1_299.99);
    assert.equal(
        pricing.customerLineItems.reduce((total, line) => total + line.amount, 0),
        1_299.99,
    );
    assert.equal(pricing.customerLineItems.find((line) => line.isDelivery)?.amount, 25);
});
