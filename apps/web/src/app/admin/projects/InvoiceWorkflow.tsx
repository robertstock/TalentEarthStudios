"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { PROJECT_COST_CATEGORIES } from "@/lib/project-costs";
import {
  emptyQuickBooksOptions,
  fillSupplierDetails,
  normalizeInvoiceCurrency,
  MAX_INVOICE_BYTES,
  type CustomerDraft,
  type QuickBooksOption,
  type QuickBooksOptions,
  type SupplierDetails,
  type SupplierDocument,
} from "@/lib/invoice-workflow";

type Cost = {
  id: string;
  amount: number;
  vendorName: string;
  category: string;
  status: string;
  date: string;
  supplierInvoiceId?: string | null;
  documentUrl?: string | null;
};
type Preview = {
  projectName: string;
  customerName: string;
  customerId: string;
  realmId: string | null;
  subtotal: number;
  pricingVersion: string;
  lines: {
    id: string;
    description: string;
    amount: number;
    taxable: boolean;
  }[];
  draft: CustomerDraft | null;
  pending: boolean;
  invoice: { id: string; amount: number; status: string; url: string } | null;
};
const fieldClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-400 focus:outline-none disabled:opacity-60";
const buttonClass =
  "rounded-lg border border-current/20 px-4 py-2.5 text-sm font-semibold transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-40";
const money = (amount: number) =>
  amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      body.message || "This request could not be completed. Please try again.",
    );
  return body;
}
const json = (body: unknown, method = "POST"): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-xs font-medium text-slate-600">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
function Select({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: QuickBooksOption[];
  disabled?: boolean;
}) {
  return (
    <Field label={label}>
      <select
        className={fieldClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        <option value="">Choose…</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </Field>
  );
}
function Modal({
  title,
  onClose,
  busy,
  children,
}: {
  title: string;
  onClose: () => void;
  busy: boolean;
  children: ReactNode;
}) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    container.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div
        ref={container}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-300 bg-[#f3f6fa] text-slate-900 [color-scheme:light] p-5 shadow-2xl md:p-7"
        onKeyDown={(event) => {
          if (event.key === "Escape" && !busy) onClose();
          if (event.key !== "Tab") return;
          const focusable = Array.from(
            container.current?.querySelectorAll<HTMLElement>(
              'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
            ) || [],
          );
          const first = focusable[0],
            last = focusable.at(-1);
          if (
            event.shiftKey &&
            (document.activeElement === first ||
              document.activeElement === container.current)
          ) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            className={buttonClass}
            disabled={busy}
            onClick={onClose}
            aria-label="Close invoice window"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export default function InvoiceWorkflow({
  projectId,
  projectName,
  retailPrice,
  pricingValid,
  pricingDirty,
  cancelled,
  onCostsChanged,
}: {
  projectId: string;
  projectName: string;
  retailPrice: number;
  pricingValid: boolean;
  pricingDirty: boolean;
  cancelled: boolean;
  onCostsChanged: (costs: Cost[]) => void;
}) {
  const base = `/api/admin/projects/${projectId}`;
  const [mode, setMode] = useState<"supplier" | "customer" | null>(null);
  const [documents, setDocuments] = useState<SupplierDocument[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [details, setDetails] = useState<SupplierDetails | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [draft, setDraft] = useState<CustomerDraft | null>(null);
  const [qbo, setQbo] = useState<QuickBooksOptions>(emptyQuickBooksOptions);
  const [busy, setBusy] = useState(false);
  const [loadingQbo, setLoadingQbo] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [expenseAccountId, setExpenseAccountId] = useState("");
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [sendCost, setSendCost] = useState(true);
  const fileInput = useRef<HTMLInputElement>(null);
  const selected = documents.find((document) => document.id === selectedId);
  const approved = selected?.status === "APPROVED";

  const loadDocuments = useCallback(async () => {
    const result = await request<{ documents: SupplierDocument[] }>(
      `${base}/supplier-invoices`,
    );
    setDocuments(result.documents);
    return result.documents;
  }, [base]);
  useEffect(() => {
    let active = true;
    request<{ documents: SupplierDocument[] }>(`${base}/supplier-invoices`)
      .then((result) => {
        if (active) setDocuments(result.documents);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [base]);
  async function loadQuickBooks() {
    setLoadingQbo(true);
    try {
      const options = await request<QuickBooksOptions>("/api/admin/quickbooks");
      setQbo(options);
      return options;
    } catch (err) {
      setQbo({
        ...emptyQuickBooksOptions,
        configured: true,
        message: err instanceof Error ? err.message : "Reconnect QuickBooks.",
      });
      return emptyQuickBooksOptions;
    } finally {
      setLoadingQbo(false);
    }
  }
  function chooseDocument(document: SupplierDocument) {
    setSelectedId(document.id);
    setDetails({
      ...structuredClone(document.details),
      currency: normalizeInvoiceCurrency(document.details.currency),
    });
    setVendorId(
      qbo.vendors.find(
        (vendor) =>
          vendor.name.toLowerCase() === document.details.supplier.toLowerCase(),
      )?.id || "",
    );
    setError("");
    setNotice("");
  }
  async function openSupplier(document?: SupplierDocument) {
    setError("");
    setNotice("");
    setMode("supplier");
    if (document) chooseDocument(document);
    else {
      setSelectedId("");
      setDetails(null);
    }
    const [options, data] = await Promise.all([
      loadQuickBooks(),
      request<Preview>(`${base}/quickbooks-invoice`).catch(() => null),
    ]);
    setExpenseAccountId(
      options.accounts.some(
        (item) => item.id === options.defaults?.expenseAccountId,
      )
        ? options.defaults!.expenseAccountId!
        : "",
    );
    setPaymentAccountId(
      options.accounts.some(
        (item) => item.id === options.defaults?.paymentAccountId,
      )
        ? options.defaults!.paymentAccountId!
        : "",
    );
    if (data?.realmId === options.realmId)
      setCustomerId(data?.customerId || "");
    if (document)
      setVendorId(
        options.vendors.find(
          (vendor) =>
            vendor.name.toLowerCase() ===
            document.details.supplier.toLowerCase(),
        )?.id || "",
      );
  }
  async function upload(file?: File) {
    if (!file) return;
    if (file.size > MAX_INVOICE_BYTES) {
      setError("Choose a PDF, PNG, or JPG smaller than 4 MB.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("Reading your invoice and saving the original…");
    try {
      const form = new FormData();
      form.append("file", file);
      const result = await request<{ documentId: string; duplicate?: boolean }>(
        `${base}/supplier-invoices`,
        { method: "POST", body: form },
      );
      const all = await loadDocuments();
      const document = all.find((item) => item.id === result.documentId);
      if (document) chooseDocument(document);
      setNotice(
        result.duplicate
          ? "This file is already saved. Here is the existing invoice."
          : "Original saved. Review the details below.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setNotice("");
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }
  async function syncSupplier() {
    await request(
      `${base}/supplier-invoices/${selectedId}/quickbooks`,
      json({ customerId, vendorId, expenseAccountId, paymentAccountId }),
    );
  }
  async function readAgain() {
    if (!details || !selectedId) return;
    setBusy(true);
    setError("");
    setNotice("Reading the saved invoice…");
    try {
      const result = await request<{
        details: SupplierDetails;
        warning: string;
      }>(`${base}/supplier-invoices/${selectedId}`, { method: "POST" });
      setDetails((current) =>
        current ? fillSupplierDetails(current, result.details) : result.details,
      );
      await loadDocuments();
      setNotice(
        "Reading finished. Review the details below; any fields you entered have been kept.",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not read the invoice.",
      );
      setNotice("");
    } finally {
      setBusy(false);
    }
  }
  async function saveSupplier(action: "save" | "approve" | "sync") {
    if (!details || !selectedId) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (action !== "sync") {
        const result = await request<{ bills: Cost[] }>(
          `${base}/supplier-invoices/${selectedId}`,
          json({ action, details }, "PATCH"),
        );
        onCostsChanged(result.bills);
        await loadDocuments();
        setNotice(
          action === "approve" ? "Costs added to this job." : "Review saved.",
        );
      }
      if (
        action === "sync" ||
        (action === "approve" && qbo.connected && sendCost)
      ) {
        await syncSupplier();
        setNotice("Cost and original invoice saved in QuickBooks.");
        await loadDocuments();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "The invoice could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function removeUpload() {
    setBusy(true);
    setError("");
    try {
      await request(`${base}/supplier-invoices/${selectedId}`, {
        method: "DELETE",
      });
      await loadDocuments();
      setSelectedId("");
      setDetails(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove upload.");
    } finally {
      setBusy(false);
    }
  }
  async function openCustomer() {
    setMode("customer");
    setBusy(true);
    setError("");
    setNotice("");
    setPreview(null);
    setDraft(null);
    try {
      const [initialPreview, options] = await Promise.all([
        request<Preview>(`${base}/quickbooks-invoice`),
        loadQuickBooks(),
      ]);
      let data = initialPreview;
      // Keep already submitted invoices frozen; only save explicitly edited prices.
      if (pricingDirty && !data.invoice && !data.pending) {
        await request(`${base}/pricing`, json({ retailPrice }, "PATCH"));
        data = await request<Preview>(`${base}/quickbooks-invoice`);
      }
      setPreview(data);
      const date = today();
      const due = new Date(`${date}T12:00:00`);
      due.setDate(due.getDate() + 30);
      const saved =
        data.draft?.pricingVersion === data.pricingVersion ? data.draft : null;
      setDraft(
        saved || {
          date,
          dueDate: `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}-${String(due.getDate()).padStart(2, "0")}`,
          customerId: data.realmId === options.realmId ? data.customerId : "",
          itemId: options.items.some(
            (item) => item.id === options.defaults?.itemId,
          )
            ? options.defaults!.itemId!
            : "",
          pricingVersion: data.pricingVersion,
          lines: data.lines.map((line) => ({
            id: line.id,
            description: line.description,
            taxable: false,
          })),
        },
      );
      if (data.draft && !saved)
        setNotice(
          "The job price changed, so this preview uses the latest costs and selling price.",
        );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not prepare invoice.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function saveCustomer(action: "draft" | "create") {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await request(`${base}/quickbooks-invoice`, json({ action, draft }));
      setNotice(
        action === "draft"
          ? "Invoice draft saved. You can return to it later."
          : "Invoice created in QuickBooks. Open it there to check tax and send it.",
      );
      setPreview(await request<Preview>(`${base}/quickbooks-invoice`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save invoice.");
      const current = await request<Preview>(
        `${base}/quickbooks-invoice`,
      ).catch(() => null);
      if (current) setPreview(current);
    } finally {
      setBusy(false);
    }
  }
  async function connect() {
    setBusy(true);
    setError("");
    try {
      const result = await request<{ url: string }>(
        "/api/admin/quickbooks/connect",
        json({ projectId }),
      );
      window.location.assign(result.url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not connect QuickBooks.",
      );
      setBusy(false);
    }
  }
  const connection = (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="font-semibold text-slate-900">QuickBooks</span>
          <p className="mt-1 text-xs text-slate-600">
            {loadingQbo
              ? "Checking connection…"
              : qbo.connected
                ? `Connected${qbo.environment === "sandbox" ? " to a test company" : ""}`
                : qbo.message ||
                  (qbo.configured
                    ? "Connect your company to send approved invoices."
                    : "One-time QuickBooks setup is needed. Uploads and invoice drafts can be saved now.")}
          </p>
        </div>
        {!qbo.connected && qbo.configured && (
          <button
            type="button"
            className={buttonClass}
            disabled={busy || loadingQbo}
            onClick={connect}
          >
            Connect QuickBooks
          </button>
        )}
      </div>
    </div>
  );
  const feedback = (
    <>
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700"
        >
          {notice}
        </p>
      )}
    </>
  );
  const canSync =
    qbo.connected &&
    (Boolean(selected?.export) ||
      Boolean(
        customerId &&
        vendorId &&
        expenseAccountId &&
        (details?.paymentStatus !== "PAID" || paymentAccountId),
      ));
  return (
    <section className="rounded-xl border border-emerald-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-900">
            Invoices for this job
          </h3>
          <p className="mt-1 text-xs text-slate-600">
            Upload a supplier invoice once. Review costs here, then prepare your
            customer invoice.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void openSupplier()}
            disabled={cancelled}
            className={`${buttonClass} border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-200`}
          >
            Upload Supplier Invoice
          </button>
          <button
            type="button"
            onClick={() => void openCustomer()}
            disabled={cancelled || retailPrice <= 0 || !pricingValid}
            className={`${buttonClass} border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-200`}
          >
            Prepare QuickBooks Invoice
          </button>
        </div>
      </div>
      {!mode && error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {documents.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-200">
          {documents.map((document) => (
            <li
              key={document.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
            >
              <button
                type="button"
                className="max-w-[70%] truncate text-left text-blue-700 hover:underline"
                onClick={() => void openSupplier(document)}
              >
                {document.details.supplier || document.fileName}
                {document.details.invoiceNumber
                  ? ` · ${document.details.invoiceNumber}`
                  : ""}
              </button>
              <span className="text-xs text-slate-600">
                {document.export?.attachmentId
                  ? "In QuickBooks"
                  : document.export?.remoteId
                    ? "PDF upload pending"
                    : document.status === "APPROVED"
                      ? "Cost saved · QuickBooks pending"
                      : "Needs review"}
              </span>
            </li>
          ))}
        </ul>
      )}
      {mode && (
        <Modal
          title={
            mode === "supplier"
              ? "Upload Supplier Invoice"
              : "Prepare QuickBooks Invoice"
          }
          busy={busy}
          onClose={() => {
            setMode(null);
            setError("");
            setNotice("");
          }}
        >
          <div className="space-y-5">
            <p className="text-sm text-slate-600">{projectName}</p>
            {connection}
            {feedback}
            {mode === "supplier" && (
              <>
                <input
                  ref={fileInput}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg"
                  className="hidden"
                  aria-label="Supplier invoice file"
                  onChange={(event) => void upload(event.target.files?.[0])}
                  disabled={busy}
                />
                {!selected && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => fileInput.current?.click()}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (!busy) void upload(event.dataTransfer.files[0]);
                    }}
                    className="w-full rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 px-5 py-10 text-center text-blue-700 hover:bg-blue-100"
                  >
                    <span className="block text-lg font-semibold">
                      {busy
                        ? "Reading invoice…"
                        : "Drop your invoice here or choose a file"}
                    </span>
                    <span className="mt-2 block text-xs text-slate-600">
                      PDF, PNG, or JPG · up to 4 MB · original saved privately
                      with this job
                    </span>
                  </button>
                )}
                {selected && details && (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <a
                        className="text-sm text-blue-700 underline"
                        href={`${base}/supplier-invoices/${selected.id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View original: {selected.fileName}
                      </a>
                      {!approved && (
                        <button
                          type="button"
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-100 disabled:opacity-50"
                          disabled={busy}
                          onClick={() => void readAgain()}
                        >
                          {busy ? "Reading…" : "Read invoice again"}
                        </button>
                      )}
                      {!approved && (
                        <button
                          type="button"
                          className="text-xs text-slate-600 hover:text-red-900"
                          disabled={busy}
                          onClick={() => void removeUpload()}
                        >
                          Remove unapproved upload
                        </button>
                      )}
                    </div>
                    {selected.warning && !approved && (
                      <p className="text-xs text-amber-800">
                        {selected.warning}
                      </p>
                    )}
                    <fieldset disabled={busy || approved} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Supplier">
                          <input
                            className={fieldClass}
                            value={details.supplier}
                            onChange={(event) =>
                              setDetails({
                                ...details,
                                supplier: event.target.value,
                              })
                            }
                          />
                        </Field>
                        <Field label="Supplier invoice / receipt number">
                          <input
                            className={fieldClass}
                            maxLength={21}
                            value={details.invoiceNumber}
                            onChange={(event) =>
                              setDetails({
                                ...details,
                                invoiceNumber: event.target.value,
                              })
                            }
                          />
                        </Field>
                        <Field label="Invoice date">
                          <input
                            type="date"
                            className={fieldClass}
                            value={details.date}
                            onChange={(event) =>
                              setDetails({
                                ...details,
                                date: event.target.value,
                              })
                            }
                          />
                        </Field>
                        <Field label="Due date (optional)">
                          <input
                            type="date"
                            className={fieldClass}
                            value={details.dueDate}
                            onChange={(event) =>
                              setDetails({
                                ...details,
                                dueDate: event.target.value,
                              })
                            }
                          />
                        </Field>
                        <Field label="Payment status">
                          <select
                            className={fieldClass}
                            value={details.paymentStatus}
                            onChange={(event) =>
                              setDetails({
                                ...details,
                                paymentStatus: event.target
                                  .value as SupplierDetails["paymentStatus"],
                              })
                            }
                          >
                            <option value="UNPAID">
                              Unpaid — supplier bill
                            </option>
                            <option value="PAID">Already paid — expense</option>
                          </select>
                        </Field>
                        <Field label={`Invoice total (${details.currency})`}>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            className={fieldClass}
                            value={details.total || ""}
                            onChange={(event) =>
                              setDetails({
                                ...details,
                                total: Number(event.target.value),
                              })
                            }
                          />
                        </Field>
                      </div>
                      <div>
                        <h3 className="mb-3 text-sm font-semibold text-slate-900">
                          Costs to add to this job
                        </h3>
                        <p className="mb-3 text-xs text-slate-600">
                          Separate delivery and freight so they pass through at
                          cost. Include supplier tax in these amounts.
                        </p>
                        {details.lines.map((line, index) => (
                          <div
                            key={index}
                            className="mb-3 grid items-end gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-[1fr_180px_110px_32px]"
                          >
                            <Field label={`Description ${index + 1}`}>
                              <input
                                className={fieldClass}
                                value={line.description}
                                onChange={(event) =>
                                  setDetails({
                                    ...details,
                                    lines: details.lines.map((item, i) =>
                                      i === index
                                        ? {
                                            ...item,
                                            description: event.target.value,
                                          }
                                        : item,
                                    ),
                                  })
                                }
                              />
                            </Field>
                            <Field label={`Category ${index + 1}`}>
                              <select
                                className={fieldClass}
                                value={line.category}
                                onChange={(event) =>
                                  setDetails({
                                    ...details,
                                    lines: details.lines.map((item, i) =>
                                      i === index
                                        ? {
                                            ...item,
                                            category: event.target
                                              .value as typeof line.category,
                                          }
                                        : item,
                                    ),
                                  })
                                }
                              >
                                {PROJECT_COST_CATEGORIES.map((category) => (
                                  <option
                                    key={category.value}
                                    value={category.value}
                                  >
                                    {category.label}
                                  </option>
                                ))}
                              </select>
                            </Field>
                            <Field label={`Amount ${index + 1}`}>
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                className={fieldClass}
                                value={line.amount || ""}
                                onChange={(event) =>
                                  setDetails({
                                    ...details,
                                    lines: details.lines.map((item, i) =>
                                      i === index
                                        ? {
                                            ...item,
                                            amount: Number(event.target.value),
                                          }
                                        : item,
                                    ),
                                  })
                                }
                              />
                            </Field>
                            <button
                              type="button"
                              disabled={details.lines.length === 1}
                              className="p-2 text-slate-600 hover:text-red-900 disabled:opacity-30"
                              aria-label={`Remove cost line ${index + 1}`}
                              onClick={() =>
                                setDetails({
                                  ...details,
                                  lines: details.lines.filter(
                                    (_, i) => i !== index,
                                  ),
                                })
                              }
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm">
                          <button
                            type="button"
                            className="text-blue-700 disabled:opacity-40"
                            disabled={details.lines.length >= 100}
                            onClick={() =>
                              setDetails({
                                ...details,
                                lines: [
                                  ...details.lines,
                                  {
                                    description: "",
                                    category: "OTHER",
                                    amount: 0,
                                  },
                                ],
                              })
                            }
                          >
                            + Add cost line
                          </button>
                          <span
                            className={
                              Math.round(
                                details.lines.reduce(
                                  (sum, line) => sum + line.amount,
                                  0,
                                ) * 100,
                              ) === Math.round(details.total * 100)
                                ? "text-slate-700"
                                : "text-amber-700"
                            }
                          >
                            Lines total:{" "}
                            {money(
                              details.lines.reduce(
                                (sum, line) => sum + line.amount,
                                0,
                              ),
                            )}
                          </span>
                        </div>
                      </div>
                    </fieldset>
                    {qbo.connected && !selected.export && (
                      <fieldset
                        disabled={busy}
                        className="space-y-4 rounded-xl border border-slate-200 p-4"
                      >
                        <legend className="px-2 text-sm text-slate-700">
                          QuickBooks details
                        </legend>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Select
                            label="QuickBooks customer / job"
                            value={customerId}
                            onChange={setCustomerId}
                            options={qbo.customers}
                          />
                          <Select
                            label="QuickBooks supplier"
                            value={vendorId}
                            onChange={setVendorId}
                            options={qbo.vendors}
                          />
                          <Select
                            label="Expense account"
                            value={expenseAccountId}
                            onChange={setExpenseAccountId}
                            options={qbo.accounts.filter((account) =>
                              [
                                "Expense",
                                "Cost of Goods Sold",
                                "Other Expense",
                              ].includes(account.type || ""),
                            )}
                          />
                          {details.paymentStatus === "PAID" && (
                            <Select
                              label="Paid from"
                              value={paymentAccountId}
                              onChange={setPaymentAccountId}
                              options={qbo.accounts.filter((account) =>
                                ["Bank", "Credit Card"].includes(
                                  account.type || "",
                                ),
                              )}
                            />
                          )}
                        </div>
                        {!approved && (
                          <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={sendCost}
                              onChange={(event) =>
                                setSendCost(event.target.checked)
                              }
                            />
                            Send to QuickBooks when I approve
                          </label>
                        )}
                      </fieldset>
                    )}
                    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-4">
                      {!approved ? (
                        <>
                          <button
                            type="button"
                            className={buttonClass}
                            disabled={busy}
                            onClick={() => void saveSupplier("save")}
                          >
                            Save review
                          </button>
                          <button
                            type="button"
                            className={`${buttonClass} bg-emerald-700 text-white hover:bg-emerald-800`}
                            disabled={
                              busy || (qbo.connected && sendCost && !canSync)
                            }
                            onClick={() => void saveSupplier("approve")}
                          >
                            {busy
                              ? "Saving…"
                              : qbo.connected && sendCost
                                ? "Approve & Send to QuickBooks"
                                : "Approve & Add Costs"}
                          </button>
                        </>
                      ) : (
                        <>
                          {selected.export?.url && (
                            <a
                              className={buttonClass}
                              href={selected.export.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open in QuickBooks
                            </a>
                          )}
                          {!selected.export?.attachmentId && (
                            <button
                              type="button"
                              className={`${buttonClass} bg-emerald-700 text-white hover:bg-emerald-800`}
                              disabled={busy || !canSync}
                              onClick={() => void saveSupplier("sync")}
                            >
                              {busy
                                ? "Sending…"
                                : selected.export
                                  ? "Retry QuickBooks Sync"
                                  : "Send to QuickBooks"}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
            {mode === "customer" && preview && draft && (
              <>
                <div className="flex flex-wrap justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <div>
                    <p className="text-xs text-slate-600">Customer invoice</p>
                    <p className="mt-1 font-semibold text-slate-900">
                      {preview.customerName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-600">
                      Selling price before tax
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-blue-700">
                      {money(preview.subtotal)}
                    </p>
                  </div>
                </div>
                {preview.invoice ? (
                  <div className="space-y-4">
                    <p className="text-sm text-emerald-700">
                      This job already has a QuickBooks invoice. Status:{" "}
                      {preview.invoice.status.toLowerCase()} · Total:{" "}
                      {money(preview.invoice.amount)}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <a
                        className={`${buttonClass} bg-blue-600 text-white hover:bg-blue-700`}
                        href={preview.invoice.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open QuickBooks Invoice
                      </a>
                      <button
                        type="button"
                        className={buttonClass}
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true);
                          setError("");
                          try {
                            setPreview(
                              await request<Preview>(
                                `${base}/quickbooks-invoice?refresh=1`,
                              ),
                            );
                          } catch (err) {
                            setError(
                              err instanceof Error
                                ? err.message
                                : "Could not refresh payment status.",
                            );
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        Refresh payment status
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {preview.pending && (
                      <p className="text-sm text-amber-800">
                        A previous submission needs confirmation. Retry checks
                        QuickBooks using the original details and avoids
                        creating a second invoice.
                      </p>
                    )}
                    <fieldset
                      disabled={busy || preview.pending}
                      className="space-y-4"
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Invoice date">
                          <input
                            type="date"
                            className={fieldClass}
                            value={draft.date}
                            onChange={(event) =>
                              setDraft({ ...draft, date: event.target.value })
                            }
                          />
                        </Field>
                        <Field label="Due date">
                          <input
                            type="date"
                            className={fieldClass}
                            value={draft.dueDate}
                            onChange={(event) =>
                              setDraft({
                                ...draft,
                                dueDate: event.target.value,
                              })
                            }
                          />
                        </Field>
                        {qbo.connected && (
                          <>
                            <Select
                              label="QuickBooks customer / job"
                              value={draft.customerId}
                              onChange={(customerId) =>
                                setDraft({ ...draft, customerId })
                              }
                              options={qbo.customers}
                            />
                            <Select
                              label="Product / service on invoice"
                              value={draft.itemId}
                              onChange={(itemId) =>
                                setDraft({ ...draft, itemId })
                              }
                              options={qbo.items}
                            />
                          </>
                        )}
                      </div>
                      <div className="space-y-3">
                        {draft.lines.map((line, index) => (
                          <div
                            key={line.id}
                            className="grid items-end gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-[1fr_90px_110px]"
                          >
                            <Field label={`Customer description ${index + 1}`}>
                              <textarea
                                rows={2}
                                className={fieldClass}
                                value={line.description}
                                onChange={(event) =>
                                  setDraft({
                                    ...draft,
                                    lines: draft.lines.map((item) =>
                                      item.id === line.id
                                        ? {
                                            ...item,
                                            description: event.target.value,
                                          }
                                        : item,
                                    ),
                                  })
                                }
                              />
                            </Field>
                            <label className="flex items-center gap-2 pb-3 text-xs text-slate-700">
                              <input
                                type="checkbox"
                                checked={line.taxable}
                                onChange={(event) =>
                                  setDraft({
                                    ...draft,
                                    lines: draft.lines.map((item) =>
                                      item.id === line.id
                                        ? {
                                            ...item,
                                            taxable: event.target.checked,
                                          }
                                        : item,
                                    ),
                                  })
                                }
                              />
                              Taxable
                            </label>
                            <div className="pb-3 text-right text-sm font-semibold text-slate-900">
                              {money(
                                preview.lines.find(
                                  (item) => item.id === line.id,
                                )?.amount || 0,
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </fieldset>
                    <p className="text-xs text-slate-600">
                      QuickBooks calculates applicable sales tax. Check the
                      final invoice there before sending. Supplier PDFs,
                      internal costs, and margins stay private.
                    </p>
                    <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4">
                      <button
                        type="button"
                        className={buttonClass}
                        disabled={busy || preview.pending}
                        onClick={() => void saveCustomer("draft")}
                      >
                        Save Draft
                      </button>
                      <button
                        type="button"
                        className={`${buttonClass} bg-blue-600 text-white hover:bg-blue-700`}
                        disabled={
                          busy ||
                          !qbo.connected ||
                          (!preview.pending &&
                            (!draft.customerId || !draft.itemId))
                        }
                        onClick={() => void saveCustomer("create")}
                      >
                        {busy
                          ? "Saving…"
                          : preview.pending
                            ? "Retry QuickBooks Invoice"
                            : "Create in QuickBooks"}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
            {mode === "customer" && busy && !preview && (
              <p
                role="status"
                className="py-8 text-center text-sm text-slate-600"
              >
                Preparing your invoice…
              </p>
            )}
          </div>
        </Modal>
      )}
    </section>
  );
}
