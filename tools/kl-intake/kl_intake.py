"""Bounded K&L intake preparation. No Mail access, network client, or scheduler.

The caller supplies authorized EML bytes, a PDF-text extractor and a fresh scoped
website snapshot. Live import requires an explicitly supplied authorized app
transport; it never uses database credentials, environment tokens or cookies.
"""
import argparse
from dataclasses import dataclass, asdict
from datetime import datetime
from email import policy
from email.parser import BytesParser
from email.utils import parseaddr
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import stat

ACCOUNT = "robertstock@me.com"
SENDER = "quickbooks@notification.intuit.com"
VENDOR = "K&L WIDE FORMAT DIGITAL PRINTING"
WIP = Path("/Users/stockfamily/Desktop/****WIP")
MAX_PDF = 4_000_000
MAX_EMAIL = 8_000_000
SCHEDULE = {"time": "09:00", "timezone": "America/Los_Angeles", "enabled": False}

class ReviewRequired(ValueError):
    pass


def normalized(value):
    return " ".join(value.casefold().split())


@dataclass(frozen=True)
class Invoice:
    message_id: str
    invoice_number: str
    date: str
    due_date: str
    reference: str
    total_cents: int
    sha256: str

    @property
    def key(self):
        return normalized(VENDOR) + "|" + self.invoice_number.casefold()

    def details(self):
        # This first supported template is a single printing line, with no tax/freight.
        # Other layouts stop for review; don't silently guess a cost allocation.
        return {"supplier": VENDOR, "invoiceNumber": self.invoice_number,
                "date": self.date, "dueDate": self.due_date, "currency": "USD",
                "paymentStatus": "UNPAID", "total": self.total_cents / 100,
                "lines": [{"description": VENDOR + " — " + self.reference,
                           "category": "OUTSIDE_PRINTING", "amount": self.total_cents / 100}]}


def cents(value):
    if not re.fullmatch(r"[0-9]+(?:,[0-9]{3})*\.[0-9]{2}", value):
        raise ReviewRequired("Unrecognized money amount")
    return int(value.replace(",", "").replace(".", ""))


def parse_email(raw, extract_text, account):
    if account.casefold() != ACCOUNT or len(raw) > MAX_EMAIL:
        raise ReviewRequired("Wrong account or message too large")
    mail = BytesParser(policy=policy.default).parsebytes(raw)
    if mail.defects or len(mail.get_all("From", [])) != 1 or len(mail.get_all("Message-ID", [])) != 1:
        raise ReviewRequired("Malformed or ambiguous message headers")
    display, sender = parseaddr(str(mail["From"]))
    if sender.casefold() != SENDER or normalized(display) != normalized(VENDOR):
        raise ReviewRequired("Sender/vendor not K&L")
    message_id = str(mail["Message-ID"]).strip()
    if not message_id or len(message_id) > 500:
        raise ReviewRequired("Missing or invalid Message-ID")
    subject_numbers = re.findall(r"\binvoice\s+(\d{1,21})\b", str(mail.get("Subject", "")), re.I)
    if len(set(subject_numbers)) != 1:
        raise ReviewRequired("Missing or ambiguous invoice number")
    attachments = list(mail.iter_attachments())
    if len(attachments) > 20:
        raise ReviewRequired("Too many attachments")
    pdfs = []
    for part in attachments:
        data = part.get_payload(decode=True) or b""
        if data.startswith(b"%PDF-"):
            if not data or len(data) > MAX_PDF:
                raise ReviewRequired("PDF exceeds application limit")
            pdfs.append(data)
    if len(pdfs) != 1:
        raise ReviewRequired("Expected one actual PDF; payment links are not attachments")
    pdf = pdfs[0]
    text = extract_text(pdf)
    if not isinstance(text, str) or len(text) > 64_000:
        raise ReviewRequired("Missing or oversized PDF extraction")
    if not normalized(text).startswith(normalized(VENDOR)) or "TalentEarth, Inc." not in text:
        raise ReviewRequired("PDF vendor or billed company does not match")
    # The supported QuickBooks PDF table verified on invoice 48139.
    rows = re.findall(r"(?m)^\s*(\d{1,21})\s+(\d{2}/\d{2}/\d{4})\s+\$([\d,]+\.\d{2})\s+(\d{2}/\d{2}/\d{4})\s+Due on receipt\s*$", text)
    po = re.findall(r"P\.O\. NUMBER\s*\n([^\n]+)", text)
    balance = re.findall(r"BALANCE DUE\s*\$([\d,]+\.\d{2})", text)
    tax = re.findall(r"(?m)^TAX\s+([\d,]+\.\d{2})\s*$", text)
    total = re.findall(r"(?m)^TOTAL\s+([\d,]+\.\d{2})\s*$", text)
    if len(rows) != 1 or len(po) != 1 or len(balance) != 1 or len(tax) != 1 or len(total) != 1:
        raise ReviewRequired("Invoice layout needs review")
    number, date, amount, due = rows[0]
    if number != subject_numbers[0] or not 0 < cents(amount) == cents(balance[0]) == cents(total[0]):
        raise ReviewRequired("Invoice number or totals conflict")
    if cents(tax[0]) != 0 or "Banner:Banner" not in text or re.search(r"(?m)^\s*(freight|delivery|courier|credit memo|deposit)\b", text, re.I):
        raise ReviewRequired("Tax, freight, credit or unfamiliar line allocation needs review")
    try:
        date = datetime.strptime(date, "%m/%d/%Y").date().isoformat()
        due = datetime.strptime(due, "%m/%d/%Y").date().isoformat()
    except ValueError:
        raise ReviewRequired("Invalid invoice dates") from None
    if due < date:
        raise ReviewRequired("Due date precedes invoice date")
    return Invoice(message_id, number, date, due, po[0].strip(), cents(amount), hashlib.sha256(pdf).hexdigest()), pdf


def resolve_job(invoice, jobs):
    raise ReviewRequired("Legacy PO/name matching is retired. Use the numbered job workflow; invoice 48139 requires explicit review.")


def prepare(invoice, jobs, receipts=()):
    job = resolve_job(invoice, jobs)
    prior_receipt = False
    for receipt in receipts:
        if receipt.get("messageId") == invoice.message_id or receipt.get("invoiceKey") == invoice.key:
            if receipt.get("sha256") != invoice.sha256 or receipt.get("projectId") != job["id"]:
                raise ReviewRequired("Previously processed invoice conflicts with this file/job")
            prior_receipt = True
            # Receipts never replace live confirmation.
    matching = []
    for item in job.get("documents", []):
        details = item.get("details", {})
        same_key = normalized(details.get("supplier", "")) == normalized(VENDOR) and str(details.get("invoiceNumber", "")).casefold() == invoice.invoice_number.casefold()
        same_hash = item.get("sha256") == invoice.sha256
        if same_key or same_hash:
            if not item.get("id"):
                raise ReviewRequired("Existing supplier document is missing its identity")
            if details != invoice.details():
                raise ReviewRequired("Existing document details differ; do not overwrite or reapprove")
            if item.get("sha256") and not same_hash:
                raise ReviewRequired("Same invoice has different PDF bytes")
            matching.append(item)
    if len(matching) > 1:
        raise ReviewRequired("Multiple existing supplier documents need review")
    for cost in job.get("costs", []):
        if not cost.get("supplierInvoiceId") and (
            str(invoice.invoice_number) in str(cost.get("vendorName", "")) or
            (round(float(cost.get("amount", 0)) * 100) == invoice.total_cents and str(cost.get("date", "")).startswith(invoice.date))):
            raise ReviewRequired("Possible existing manual ledger cost; review before importing")
    existing = matching[0] if matching else None
    if prior_receipt and not existing:
        raise ReviewRequired("Previously confirmed import is absent from the live snapshot")
    if existing and existing.get("status") not in {"DRAFT", "APPROVED"}:
        raise ReviewRequired("Unexpected existing document status")
    if existing and existing.get("status") == "APPROVED":
        linked = [c for c in job.get("costs", []) if c.get("supplierInvoiceId") == existing["id"]]
        if len(linked) != 1 or round(float(linked[0].get("amount", 0)) * 100) != invoice.total_cents:
            raise ReviewRequired("Approved document and ledger do not reconcile")
    return {"action": "already_imported" if existing and existing.get("status") == "APPROVED" else "prepare_import",
            "projectId": job["id"], "wipPath": job["wipPath"],
            "costFolder": job.get("costFolder", "**Outside_Costs"),
            "documentId": existing["id"] if existing else None,
            "invoice": asdict(invoice), "invoiceKey": invoice.key, "details": invoice.details()}


def directory_fd(root, relative):
    parts = PurePosixPath(relative).parts
    if not parts or PurePosixPath(relative).is_absolute() or any(p in {"..", "."} for p in parts) or len(parts) > 8:
        raise ReviewRequired("Unsafe WIP-relative job path")
    fd = os.open(root, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        for part in parts:
            child = os.open(part, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=fd)
            os.close(fd)
            fd = child
        return fd
    except BaseException:
        os.close(fd)
        raise


def save_pdf(plan, pdf, root=WIP, allow_create=False):
    """Never overwrite. Reuse equal bytes; conflicting invoice files need review.

    Disabled by default; actual WIP writes are not part of the source dry run.
    """
    if hashlib.sha256(pdf).hexdigest() != plan["invoice"]["sha256"] or not pdf.startswith(b"%PDF-") or len(pdf) > MAX_PDF:
        raise ReviewRequired("PDF changed since review")
    folder = plan["costFolder"]
    if folder not in {"**Outside_Costs", "Outside Costs", "Outside_Costs"}:
        raise ReviewRequired("Unrecognized cost-folder convention")
    job_fd = directory_fd(root, plan["wipPath"])
    try:
        if allow_create:
            try:
                os.mkdir(folder, dir_fd=job_fd)
            except FileExistsError:
                pass
        cost_fd = os.open(folder, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=job_fd)
    finally:
        os.close(job_fd)
    number = plan["invoice"]["invoice_number"]
    if not re.fullmatch(r"\d{1,21}", number):
        os.close(cost_fd)
        raise ReviewRequired("Invalid invoice filename identity")
    name = "Invoice_" + number + "_from_KL_WIDE_FORMAT_DIGITAL_PRINTING.pdf"
    temp_name = None
    try:
        entries = os.listdir(cost_fd)
        if len(entries) > 50:
            raise ReviewRequired("Cost folder needs a narrower duplicate review")
        reuse = None
        for existing in entries:
            if re.search(r"(?<!\d)" + re.escape(number) + r"(?!\d)", existing) and existing.lower().endswith(".pdf"):
                fd = os.open(existing, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=cost_fd)
                with os.fdopen(fd, "rb") as source:
                    if not stat.S_ISREG(os.fstat(source.fileno()).st_mode):
                        raise ReviewRequired("Expected ordinary PDF file")
                    saved = source.read(MAX_PDF + 1)
                if hashlib.sha256(saved).hexdigest() == plan["invoice"]["sha256"]:
                    reuse = existing
                else:
                    raise ReviewRequired("Existing invoice filename has different bytes; preserve both for review")
        if reuse:
            return {"action": "reuse", "fileName": reuse}
        if not allow_create:
            return {"action": "would_save", "fileName": name}
        temp_name = ".kl-invoice-" + os.urandom(12).hex()
        fd = os.open(temp_name, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600, dir_fd=cost_fd)
        with os.fdopen(fd, "wb") as target:
            target.write(pdf)
            target.flush()
            os.fsync(target.fileno())
        # Atomic no-clobber publication, including simultaneous worker runs.
        os.link(temp_name, name, src_dir_fd=cost_fd, dst_dir_fd=cost_fd, follow_symlinks=False)
        os.fsync(cost_fd)
        return {"action": "saved", "fileName": name}
    except FileExistsError:
        raise ReviewRequired("A concurrent save occurred; re-read before retrying") from None
    finally:
        if temp_name:
            os.unlink(temp_name, dir_fd=cost_fd)
        os.close(cost_fd)


def import_website_cost(invoice, pdf, backend, expected_project_id):
    """Preparatory adapter; caller must explicitly supply an approved scoped client.

    backend exposes fresh_jobs(), upload(project_id, bytes),
    approve(project_id, document_id, details). No QBO or invoice-create capability.
    Never mark an email processed until the refreshed ledger confirms success.
    """
    plan = prepare(invoice, backend.fresh_jobs())
    if plan["projectId"] != expected_project_id:
        raise ReviewRequired("Job mapping changed since review")
    if hashlib.sha256(pdf).hexdigest() != invoice.sha256:
        raise ReviewRequired("PDF changed since review")
    if plan["action"] != "already_imported":
        document_id = plan["documentId"]
        if not document_id:
            result = backend.upload(plan["projectId"], pdf)
            document_id = result.get("documentId")
            if not document_id:
                raise ReviewRequired("Upload outcome uncertain; reconcile before retrying")
        # Re-read after upload, including the server's extracted/reviewed details.
        after_upload = prepare(invoice, backend.fresh_jobs())
        if after_upload["projectId"] != expected_project_id or after_upload["documentId"] != document_id:
            raise ReviewRequired("Uploaded draft or job could not be reconciled")
        if after_upload["action"] != "already_imported":
            backend.approve(expected_project_id, document_id, invoice.details())
    verified = prepare(invoice, backend.fresh_jobs())
    if verified["action"] != "already_imported" or verified["projectId"] != expected_project_id:
        raise ReviewRequired("Import outcome uncertain; reconcile before retrying")
    return {"messageId": invoice.message_id, "invoiceKey": invoice.key,
            "sha256": invoice.sha256, "projectId": expected_project_id,
            "documentId": verified["documentId"]}


def main():
    parser = argparse.ArgumentParser(description="Dry-run only; never reads Mail or sends requests")
    parser.add_argument("eml", type=Path)
    parser.add_argument("evidence", type=Path, help="Digest-keyed text from an authorized PDF extractor")
    parser.add_argument("jobs", type=Path, help="Fresh authorized job mapping/ledger snapshot")
    args = parser.parse_args()
    evidence = json.loads(args.evidence.read_text())
    jobs = json.loads(args.jobs.read_text())
    try:
        invoice, _pdf = parse_email(args.eml.read_bytes(), lambda b: evidence[hashlib.sha256(b).hexdigest()], ACCOUNT)
        result = prepare(invoice, jobs)
        print(json.dumps({"dryRun": True, "schedule": SCHEDULE, "plan": result}, indent=2))
    except (ReviewRequired, KeyError) as error:
        print(json.dumps({"dryRun": True, "status": "review_required", "reason": str(error)}))
        return 2
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
