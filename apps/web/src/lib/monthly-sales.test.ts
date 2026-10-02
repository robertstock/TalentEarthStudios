import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMonthlySalesReport,
  completionMonth,
  monthlySalesCsv,
  type SalesProject,
} from "./monthly-sales.ts";
import { calculateProjectPricing } from "./project-pricing.ts";

const project = (overrides: Partial<SalesProject> = {}): SalesProject => ({
  id: "completed-project",
  name: "Completed project",
  client: "Example client",
  status: "COMPLETED",
  completedAt: "2026-09-15T12:00:00Z",
  sales: 100,
  costs: 60,
  costItemCount: 1,
  ...overrides,
});

test("monthly reports include only completed projects and the selected year", () => {
  const report = buildMonthlySalesReport(
    [
      project(),
      project({ id: "active", status: "SUBMITTED", sales: 9000 }),
      project({ id: "cancelled", status: "CANCELLED", sales: 8000 }),
      project({ id: "closed", status: "CLOSED", sales: 7000 }),
      project({
        id: "last-year",
        completedAt: "2025-09-15T12:00:00Z",
        sales: 400,
      }),
    ],
    2026,
  );
  assert.equal(report.totals.projectCount, 1);
  assert.equal(report.totals.sales, 100);
  assert.equal(report.months[8].projects[0].id, "completed-project");
  assert.deepEqual(report.years, [2026, 2025]);
});

test("completion month uses the reporting time zone at month and year boundaries", () => {
  assert.equal(completionMonth("2026-10-01T06:59:59Z"), "2026-09");
  assert.equal(completionMonth("2026-10-01T07:00:00Z"), "2026-10");
  assert.equal(completionMonth("2026-01-01T06:30:00Z"), "2025-12");
  const report = buildMonthlySalesReport(
    [project({ completedAt: "2026-01-01T06:30:00Z" })],
    2025,
  );
  assert.equal(report.months[11].projectCount, 1);
});

test("monthly and annual margins are weighted by sales, including losses", () => {
  const report = buildMonthlySalesReport(
    [
      project({ sales: 100, costs: 20 }),
      project({ id: "large", sales: 900, costs: 810 }),
      project({
        id: "loss",
        completedAt: "2026-08-15T12:00:00Z",
        sales: 100,
        costs: 150,
      }),
    ],
    2026,
  );
  assert.equal(report.months[8].grossProfit, 170);
  assert.equal(report.months[8].margin, 17);
  assert.equal(report.months[7].grossProfit, -50);
  assert.equal(report.months[7].margin, -50);
  assert.equal(report.totals.grossProfit, 120);
  assert.equal(report.totals.margin, (120 / 1100) * 100);
});

test("missing or invalid completion dates are visible separately and never guessed", () => {
  const report = buildMonthlySalesReport(
    [
      project({ id: "no-date", completedAt: null }),
      project({ id: "bad-date", completedAt: "not a date" }),
      project({ id: "active", completedAt: null, status: "DRAFT" }),
    ],
    2026,
  );
  assert.equal(report.totals.sales, 0);
  assert.equal(report.undated.length, 2);
  assert.equal(report.months.length, 12);
  assert.ok(
    report.months.every(
      (month) => month.projectCount === 0 && month.margin === null,
    ),
  );
});

test("zero sales preserve incurred costs and show an undefined margin", () => {
  const report = buildMonthlySalesReport(
    [project({ sales: 0, costs: 75 })],
    2026,
  );
  assert.equal(report.totals.grossProfit, -75);
  assert.equal(report.totals.margin, null);
  assert.equal(report.months[8].margin, null);
});

test("reports match tracker retail pricing, including delivery at cost and exact-price rounding", () => {
  const pricing = calculateProjectPricing(
    [
      {
        id: "print",
        amount: 333.33,
        category: "OUTSIDE_PRINTING",
        vendorName: "Printing",
      },
      {
        id: "material",
        amount: 306.67,
        category: "MATERIALS",
        vendorName: "Material",
      },
      {
        id: "delivery",
        amount: 25,
        category: "COURIER_FREIGHT",
        vendorName: "Delivery",
      },
    ],
    1.99217188,
  );
  const report = buildMonthlySalesReport(
    [
      project({
        sales: pricing.retailPrice,
        costs: pricing.totalCosts,
        costItemCount: 3,
      }),
    ],
    2026,
  );
  assert.equal(report.totals.sales, 1299.99);
  assert.equal(report.totals.costs, 665);
  assert.equal(report.totals.grossProfit, 634.99);
});

test("currency sums remain in cents and missing costs are flagged for the selected year", () => {
  const report = buildMonthlySalesReport(
    [
      project({ sales: 0.1, costs: 0.03 }),
      project({ id: "two", sales: 0.2, costs: 0.07 }),
      project({ id: "no-costs", sales: 0, costs: 0, costItemCount: 0 }),
      project({
        id: "old-empty",
        completedAt: "2025-08-02T12:00:00Z",
        costItemCount: 0,
      }),
    ],
    2026,
  );
  assert.equal(report.totals.sales, 0.3);
  assert.equal(report.totals.costs, 0.1);
  assert.equal(report.totals.grossProfit, 0.2);
  assert.equal(report.missingCosts, 1);
});

test("CSV includes every month and a reconciled year total with zero-sales margins blank", () => {
  const report = buildMonthlySalesReport([project()], 2026);
  const rows = monthlySalesCsv(report.months, report.totals, 2026)
    .trimEnd()
    .split("\r\n");
  assert.equal(rows.length, 14);
  assert.equal(rows[1], "2026-01,0,0.00,0.00,0.00,");
  assert.equal(rows[9], "2026-09,1,100.00,60.00,40.00,40.00");
  assert.equal(rows[13], "2026 total,1,100.00,60.00,40.00,40.00");
});
