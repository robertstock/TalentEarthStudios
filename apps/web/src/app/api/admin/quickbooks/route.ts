import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import { db } from "@/lib/db";
import { emptyQuickBooksOptions } from "@/lib/invoice-workflow";
import { invoiceError } from "@/lib/invoice-api";
import {
  quickBooksConfigured,
  quickBooksEnvironment,
  quickBooksQuery,
} from "@/lib/quickbooks";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const configured = quickBooksConfigured();
    const connection = configured
      ? await db.quickBooksConnection.findUnique({
          where: { id: "company" },
          select: { realmId: true, environment: true, defaults: true },
        })
      : null;
    const connected = Boolean(
      connection && connection.environment === quickBooksEnvironment(),
    );
    const status = {
      ...emptyQuickBooksOptions,
      configured,
      connected,
      environment: quickBooksEnvironment(),
      realmId: connected ? connection!.realmId : undefined,
      defaults: connection?.defaults || {},
    };
    if (!connected)
      return NextResponse.json(status, {
        headers: { "Cache-Control": "no-store" },
      });
    const [customers, vendors, accounts, items] = await Promise.all([
      quickBooksQuery("Customer"),
      quickBooksQuery("Vendor"),
      quickBooksQuery("Account"),
      quickBooksQuery("Item"),
    ]);
    const option = (item: (typeof customers)[number]) => ({
      id: item.Id,
      name: item.FullyQualifiedName || item.DisplayName || item.Name || item.Id,
      type: item.AccountType || item.Type,
    });
    return NextResponse.json(
      {
        ...status,
        customers: customers
          .filter(
            (item) => !item.CurrencyRef || item.CurrencyRef.value === "USD",
          )
          .map(option),
        vendors: vendors
          .filter(
            (item) => !item.CurrencyRef || item.CurrencyRef.value === "USD",
          )
          .map(option),
        accounts: accounts
          .filter(
            (item) => !item.CurrencyRef || item.CurrencyRef.value === "USD",
          )
          .map(option),
        items: items
          .filter((item) =>
            ["Service", "NonInventory"].includes(item.Type || ""),
          )
          .map(option),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return invoiceError(error);
  }
}
