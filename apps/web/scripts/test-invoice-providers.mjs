// Test-only process preload. Never enable on a deployed server.
import fs from "node:fs";
if (
  new URL(process.env.DATABASE_URL).hostname !== "127.0.0.1" ||
  new URL(process.env.DATABASE_URL).pathname !== "/invoice_workflow_test"
)
  throw new Error(
    "Invoice provider mocks require the isolated localhost invoice_workflow_test database.",
  );
process.env.QUICKBOOKS_TOKEN_KEY = Buffer.alloc(32, 7).toString("base64");
const statePath = "/private/tmp/finley-invoice-provider-state.json";
const nativeFetch = globalThis.fetch;
const initial = {
  Bill: [],
  Purchase: [],
  Invoice: [],
  attachments: [],
  calls: [],
};
if (!fs.existsSync(statePath))
  fs.writeFileSync(statePath, JSON.stringify(initial));
const response = (value) =>
  new Response(JSON.stringify(value), {
    headers: { "Content-Type": "application/json" },
  });
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url,
  );
  if (
    url.hostname === "api.openai.com" &&
    JSON.parse(fs.readFileSync(statePath, "utf8")).failExtraction
  )
    return new Response("{}", { status: 503 });
  if (url.hostname === "api.openai.com")
    return response({
      output: [
        {
          content: [
            {
              type: "output_text",
              text: JSON.stringify({
                supplier: "Sample Print Shop",
                invoiceNumber: "INV-101",
                date: "2026-09-21",
                dueDate: "2026-10-21",
                currency: "USD",
                paymentStatus: "UNPAID",
                total: 115,
                lines: [
                  {
                    description: "Printed panels",
                    category: "OUTSIDE_PRINTING",
                    amount: 100,
                  },
                  {
                    description: "Delivery",
                    category: "COURIER_FREIGHT",
                    amount: 15,
                  },
                ],
              }),
            },
          ],
        },
      ],
    });
  if (url.hostname === "oauth.platform.intuit.com")
    return response({
      access_token: "test-access",
      refresh_token: "test-refresh",
      expires_in: 3600,
    });
  if (url.hostname !== "sandbox-quickbooks.api.intuit.com")
    return nativeFetch(input, init);
  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  const save = () => fs.writeFileSync(statePath, JSON.stringify(state));
  const entity = url.pathname.split("/").at(-1);
  const refs = {
    Customer: [
      {
        Id: "1",
        DisplayName: "Sample Client:Panel job",
        Active: true,
        CurrencyRef: { value: "USD" },
      },
    ],
    Vendor: [
      {
        Id: "2",
        DisplayName: "Sample Print Shop",
        Active: true,
        CurrencyRef: { value: "USD" },
      },
    ],
    Account: [
      {
        Id: "3",
        Name: "Outside production",
        AccountType: "Cost of Goods Sold",
        Active: true,
      },
      { Id: "4", Name: "Operating bank", AccountType: "Bank", Active: true },
    ],
    Item: [
      { Id: "5", Name: "Project services", Type: "Service", Active: true },
    ],
  };
  if (entity === "query") {
    const query = url.searchParams.get("query");
    const type = query.match(/from (\w+)/)[1];
    return response({
      QueryResponse: { [type]: refs[type] || state[type] || [] },
    });
  }
  if (url.pathname.includes("/companyinfo/"))
    return response({ CompanyInfo: { Country: "US" } });
  if (
    init.method === "POST" &&
    ["bill", "purchase", "invoice"].includes(entity)
  ) {
    const type = { bill: "Bill", purchase: "Purchase", invoice: "Invoice" }[
      entity
    ];
    const payload = JSON.parse(init.body);
    const prior = state[type].find(
      (item) => item.PrivateNote === payload.PrivateNote,
    );
    if (prior) return response({ [type]: prior });
    const record = {
      ...payload,
      Id: String(state[type].length + 100),
      TotalAmt: payload.Line.reduce((sum, line) => sum + line.Amount, 0),
      Balance: payload.Line.reduce((sum, line) => sum + line.Amount, 0),
    };
    state[type].push(record);
    state.calls.push({ type, payload });
    save();
    if (state.failAfterAccept === type) {
      delete state.failAfterAccept;
      save();
      throw new Error("Simulated connection lost after acceptance");
    }
    return response({ [type]: record });
  }
  if (entity === "upload") {
    if (state.failAttachment) {
      delete state.failAttachment;
      save();
      return new Response("{}", { status: 503 });
    }
    const metadata = JSON.parse(await init.body.get("file_metadata_01").text());
    state.attachments.push(metadata);
    save();
    return response({
      AttachableResponse: [
        { Attachable: { Id: String(state.attachments.length + 800) } },
      ],
    });
  }
  const type = url.pathname.split("/").at(-2);
  const key = Object.keys(refs).find((key) => key.toLowerCase() === type);
  if (key)
    return response({ [key]: refs[key].find((item) => item.Id === entity) });
  if (type === "invoice")
    return response({
      Invoice: state.Invoice.find((item) => item.Id === entity),
    });
  throw new Error(`Unexpected mocked QuickBooks endpoint: ${url.pathname}`);
};
