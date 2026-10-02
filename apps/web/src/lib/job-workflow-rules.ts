import { createHash } from "node:crypto";

export class WorkflowError extends Error {
  status: number;
  constructor(message: string, status = 409) { super(message); this.status=status; }
}
export function businessDay(now: Date, timezone: string) {
  if (!timezone) throw new WorkflowError("Confirm and configure JOB_BUSINESS_TIMEZONE before accepting new jobs.", 503);
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const value = (key: string) => parts.find(p => p.type === key)!.value;
  return `${value("year")}_${value("month")}_${value("day")}`;
}
export function jobNumber(day: string, sequence: number) {
  if (!/^\d{4}_\d{2}_\d{2}$/.test(day) || !Number.isSafeInteger(sequence) || sequence < 1)
    throw new WorkflowError("Invalid daily job sequence.");
  // Minimum three digits; 1000 is never truncated or wrapped to 000.
  return `TE_${day}_${String(sequence).padStart(3, "0")}`;
}
export function canonicalHash(value: unknown): string {
  const canonical = (v: unknown): unknown => Array.isArray(v) ? v.map(canonical) : v && typeof v === "object"
    ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)).map(([k, x]) => [k, canonical(x)])) : v;
  return createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
}
export function fullJobNumbers(evidence: string[]) {
  const numbers = new Set<string>();
  for (const text of evidence) {
    for (const match of text.matchAll(/(?<![A-Za-z0-9_])TE_(\d{4})_(\d{2})_(\d{2})_([0-9]{3,})(?![A-Za-z0-9_])/gi)) {
      const iso = `${match[1]}-${match[2]}-${match[3]}`;
      const date = new Date(`${iso}T12:00:00Z`);
      if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso || (!Number.isSafeInteger(Number(match[4])) || Number(match[4]) < 1) || String(Number(match[4])).padStart(3,"0") !== match[4])
        throw new WorkflowError("Invalid full job number; review the source.");
      numbers.add(match[0].toUpperCase());
    }
  }
  return [...numbers];
}
export function productionFolderName(name: string, number: string) {
  if (fullJobNumbers([number])[0] !== number) throw new WorkflowError("Invalid job number.");
  const result = `${name.replace(/[\/:\0]/g, "_")} — ${number}`;
  if (!name || Buffer.byteLength(result, "utf8") > 255) throw new WorkflowError("Project name exceeds the Mac folder limit; review the name.");
  return result;
}
export const PRODUCTION_PARENT = "/Users/stockfamily/Desktop/****WIP/****In_Production";
export const CLAIM_SUBMISSION_SQL = `INSERT INTO "JobSubmission" (id, "requestHash", "submittedAt") VALUES ($1,$2,$3) ON CONFLICT (id) DO UPDATE SET id=EXCLUDED.id RETURNING *`;
export const NEXT_SEQUENCE_SQL = `INSERT INTO "DailyJobSequence" (day, sequence) VALUES ($1,1) ON CONFLICT (day) DO UPDATE SET sequence="DailyJobSequence".sequence+1 RETURNING sequence`;
