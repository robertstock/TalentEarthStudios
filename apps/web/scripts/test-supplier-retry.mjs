import assert from "node:assert/strict";
import test from "node:test";
import { registerHooks, createRequire } from "node:module";
import { emptySupplierDetails } from "../src/lib/invoice-workflow.ts";

const require = createRequire(import.meta.url);
const state = {
  document: null,
  denied: false,
  conflict: false,
  updates: [],
  reads: 0,
};
globalThis.__supplierRetryTest = state;
state.db = {
  supplierInvoice: {
    async findFirst({ where }) {
      assert.deepEqual(where, { id: "invoice-1", projectId: "job-1" });
      return state.document;
    },
    async updateMany(args) {
      state.updates.push(args);
      if (state.conflict) return { count: 0 };
      Object.assign(state.document, args.data);
      return { count: 1 };
    },
  },
  vendorBill: {
    async createMany({ data }) {
      state.costs.push(...data);
    },
    async findMany() {
      return state.costs;
    },
  },
  async $transaction(callback) {
    return callback(state.db);
  },
};
const source = (code) => `data:text/javascript,${encodeURIComponent(code)}`;
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@/lib/auth-guards")
      return {
        shortCircuit: true,
        url: source(
          `export async function requireAdmin(){return {error:globalThis.__supplierRetryTest.denied ? Response.json({}, {status:401}) : null}}`,
        ),
      };
    if (specifier === "@/lib/db")
      return {
        shortCircuit: true,
        url: source(`export const db = globalThis.__supplierRetryTest.db;`),
      };
    if (specifier === "@/lib/supplier-extraction")
      return {
        shortCircuit: true,
        url: source(
          `export async function extractSupplierInvoice(){const s=globalThis.__supplierRetryTest;s.reads++;return {details:s.extracted,warning:'Details were read automatically.'}}`,
        ),
      };
    if (specifier === "next/server")
      return nextResolve(require.resolve("next/server.js"), context);
    if (specifier.startsWith("@/lib/"))
      return nextResolve(
        new URL(`../src/lib/${specifier.slice(6)}.ts`, import.meta.url).href,
        context,
      );
    return nextResolve(specifier, context);
  },
});
const { POST, PATCH } =
  await import("../src/app/api/admin/projects/[id]/supplier-invoices/[documentId]/route.ts");
const request = (origin) =>
  POST(
    new Request(
      "https://example.test/api/admin/projects/job-1/supplier-invoices/invoice-1",
      { method: "POST", headers: { origin: origin || "https://example.test" } },
    ),
    { params: Promise.resolve({ id: "job-1", documentId: "invoice-1" }) },
  );
const review = (action, currency) =>
  PATCH(
    new Request(
      "https://example.test/api/admin/projects/job-1/supplier-invoices/invoice-1",
      {
        method: "PATCH",
        headers: {
          origin: "https://example.test",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          details: { ...state.extracted, currency },
        }),
      },
    ),
    { params: Promise.resolve({ id: "job-1", documentId: "invoice-1" }) },
  );
function reset() {
  state.document = {
    id: "invoice-1",
    status: "DRAFT",
    project: { status: "COMPLETED" },
    updatedAt: new Date("2026-09-24T00:00:00Z"),
    details: emptySupplierDetails(),
  };
  state.extracted = {
    ...emptySupplierDetails(),
    supplier: "Example Supplier",
    invoiceNumber: "TEST-1",
    date: "2026-09-24",
    total: 115,
    lines: [{ description: "Panels", category: "OTHER", amount: 115 }],
  };
  state.denied = false;
  state.conflict = false;
  state.updates = [];
  state.reads = 0;
  state.costs = [];
}
test("saved-invoice retry guards and updates", async (t) => {
  t.after(() => {
    hooks.deregister();
    delete globalThis.__supplierRetryTest;
  });
  await t.test("rejects unauthenticated requests before reading", async () => {
    reset();
    state.denied = true;
    assert.equal((await request()).status, 401);
    assert.equal(state.reads, 0);
  });
  await t.test("rejects cross-origin requests", async () => {
    reset();
    assert.equal((await request("https://unrelated.test")).status, 403);
    assert.equal(state.reads, 0);
  });
  await t.test("rejects missing invoices", async () => {
    reset();
    state.document = null;
    assert.equal((await request()).status, 404);
  });
  await t.test("never reads or changes approved invoices", async () => {
    reset();
    state.document.status = "APPROVED";
    assert.equal((await request()).status, 409);
    assert.equal(state.reads, 0);
    assert.equal(state.updates.length, 0);
  });
  await t.test("rejects cancelled jobs", async () => {
    reset();
    state.document.project.status = "CANCELLED";
    assert.equal((await request()).status, 409);
    assert.equal(state.reads, 0);
  });
  await t.test(
    "fills saved blanks without adding any costs or replacing saved review",
    async () => {
      reset();
      state.document.details.supplier = "Reviewed name";
      const response = await request();
      assert.equal(response.status, 200);
      const result = await response.json();
      assert.equal(result.details.supplier, "Reviewed name");
      assert.equal(result.details.total, 115);
      assert.equal(state.updates.length, 1);
      assert.deepEqual(state.updates[0].where, {
        id: "invoice-1",
        status: "DRAFT",
        updatedAt: state.document.updatedAt,
      });
    },
  );
  await t.test("rejects a concurrent review/approval change", async () => {
    reset();
    state.conflict = true;
    assert.equal((await request()).status, 409);
  });
  await t.test(
    "saves an existing US$ review as USD without adding costs",
    async () => {
      reset();
      assert.equal((await review("save", "US$")).status, 200);
      assert.equal(state.document.details.currency, "USD");
      assert.equal(state.document.details.total, 115);
      assert.equal(state.costs.length, 0);
    },
  );
  await t.test(
    "approves an existing US$ invoice once with unchanged costs",
    async () => {
      reset();
      assert.equal((await review("approve", "US$")).status, 200);
      assert.equal(state.document.status, "APPROVED");
      assert.equal(state.document.details.currency, "USD");
      assert.equal(state.costs.length, 1);
      assert.equal(state.costs[0].amount, 115);
      assert.equal((await review("approve", "US$")).status, 200);
      assert.equal(state.costs.length, 1);
    },
  );
  await t.test(
    "rejects foreign and ambiguous currencies before any writes",
    async () => {
      for (const currency of ["CAD", "EUR", "$"]) {
        reset();
        assert.equal((await review("approve", currency)).status, 400);
        assert.equal(state.updates.length, 0);
        assert.equal(state.costs.length, 0);
      }
    },
  );
});
