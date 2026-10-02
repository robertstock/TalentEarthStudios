"use client";

import { useState } from "react";
import Link from "next/link";
import {
  buildMonthlySalesReport,
  monthlySalesCsv,
  SALES_REPORT_TIME_ZONE,
  sumSalesProjects,
  type SalesProject,
} from "@/lib/monthly-sales";

const money = (amount: number) =>
  amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
const marginLabel = (margin: number | null) =>
  margin === null ? "—" : `${margin.toFixed(1)}%`;
const profitColor = (amount: number) =>
  amount < 0 ? "text-red-700" : "text-emerald-700";
const dateLabel = (date: string | null) =>
  date && Number.isFinite(Date.parse(date))
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: SALES_REPORT_TIME_ZONE,
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(date))
    : "Date missing";
const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

function ProjectTable({ projects }: { projects: SalesProject[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[780px] text-left text-sm">
        <caption className="sr-only">
          Completed projects and their individual sales, costs, gross profit,
          and margin
        </caption>
        <thead className="border-y border-slate-200 bg-slate-50 text-xs text-slate-600">
          <tr>
            <th scope="col" className="px-5 py-3 font-semibold">
              Project / Client
            </th>
            <th scope="col" className="px-5 py-3 font-semibold">
              Completed
            </th>
            <th scope="col" className="px-5 py-3 text-right font-semibold">
              Sales
            </th>
            <th scope="col" className="px-5 py-3 text-right font-semibold">
              Costs
            </th>
            <th scope="col" className="px-5 py-3 text-right font-semibold">
              Gross profit
            </th>
            <th scope="col" className="px-5 py-3 text-right font-semibold">
              Margin
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {projects.map((project) => {
            const totals = sumSalesProjects([project]);
            return (
              <tr key={project.id} className="align-top hover:bg-blue-50/50">
                <th scope="row" className="px-5 py-4 font-normal">
                  <Link
                    href={`/admin/projects?project=${encodeURIComponent(project.id)}`}
                    className="font-semibold text-blue-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600"
                  >
                    {project.name}
                  </Link>
                  <div className="mt-1 text-xs text-slate-600">
                    {project.client}
                  </div>
                  {project.costItemCount === 0 && (
                    <div className="mt-1 text-xs text-amber-800">
                      No costs recorded
                    </div>
                  )}
                </th>
                <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                  {dateLabel(project.completedAt)}
                </td>
                <td className="px-5 py-4 text-right tabular-nums">
                  {money(totals.sales)}
                </td>
                <td className="px-5 py-4 text-right tabular-nums text-slate-600">
                  {money(totals.costs)}
                </td>
                <td
                  className={`px-5 py-4 text-right font-semibold tabular-nums ${profitColor(totals.grossProfit)}`}
                >
                  {money(totals.grossProfit)}
                </td>
                <td
                  className={`px-5 py-4 text-right tabular-nums ${profitColor(totals.grossProfit)}`}
                >
                  {marginLabel(totals.margin)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function MonthlySalesClient({
  projects,
  currentYear,
}: {
  projects: SalesProject[];
  currentYear: number;
}) {
  const [year, setYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const report = buildMonthlySalesReport(projects, year);
  const years = [...new Set([currentYear, ...report.years])].sort(
    (a, b) => b - a,
  );
  const month = report.months.find((item) => item.key === selectedMonth);
  const visibleProjects =
    month?.projects ??
    [...report.projects].sort(
      (a, b) => Date.parse(b.completedAt!) - Date.parse(a.completedAt!),
    );
  const largestSales = Math.max(1, ...report.months.map((item) => item.sales));

  return (
    <div className="container mx-auto min-h-screen px-4 pb-12 pt-32 text-slate-900 [color-scheme:light] sm:px-6">
      <Link
        href="/admin"
        className="mb-5 inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"
      >
        ← Back to Dashboard
      </Link>
      <header className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-300">
            Completed projects
          </p>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Monthly Sales &amp; Margin
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
            See what each month earned, what it cost, and the gross profit your
            completed projects produced.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label
              htmlFor="sales-year"
              className="mb-1.5 block text-xs font-medium text-slate-300"
            >
              Reporting year
            </label>
            <select
              id="sales-year"
              value={year}
              onChange={(event) => {
                setYear(Number(event.target.value));
                setSelectedMonth(null);
              }}
              className={`${buttonClass} min-w-28`}
            >
              {years.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent("\uFEFF" + monthlySalesCsv(report.months, report.totals, year))}`}
            download={`completed-project-sales-${year}.csv`}
            className={buttonClass}
          >
            Export year CSV
          </a>
          <Link href="/admin/projects" className={buttonClass}>
            Project Tracker ↗
          </Link>
        </div>
      </header>

      <div
        className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-300"
        aria-live="polite"
      >
        <h2 className="font-semibold">{year} totals</h2>
        <p>
          {report.totals.projectCount} completed project
          {report.totals.projectCount === 1 ? "" : "s"} · USD
        </p>
      </div>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
            Total sales
          </p>
          <p className="mt-3 break-words text-3xl font-bold tabular-nums text-blue-900">
            {money(report.totals.sales)}
          </p>
          <p className="mt-2 text-xs text-blue-800">
            Saved project retail totals
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-[#f3f6fa] p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Project costs
          </p>
          <p className="mt-3 break-words text-3xl font-bold tabular-nums">
            {money(report.totals.costs)}
          </p>
          <p className="mt-2 text-xs text-slate-600">
            All recorded costs, paid and unpaid
          </p>
        </div>
        <div
          className={`rounded-xl border p-6 ${report.totals.grossProfit < 0 ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}
        >
          <p
            className={`text-xs font-semibold uppercase tracking-wider ${profitColor(report.totals.grossProfit)}`}
          >
            Gross profit
          </p>
          <p
            className={`mt-3 break-words text-3xl font-bold tabular-nums ${profitColor(report.totals.grossProfit)}`}
          >
            {money(report.totals.grossProfit)}
          </p>
          <p className="mt-2 text-xs text-slate-600">
            Sales minus project costs
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-[#f3f6fa] p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Gross margin
          </p>
          <p
            className={`mt-3 text-3xl font-bold tabular-nums ${profitColor(report.totals.grossProfit)}`}
          >
            {marginLabel(report.totals.margin)}
          </p>
          <p className="mt-2 text-xs text-slate-600">
            {report.totals.margin === null
              ? "Available when sales are above $0"
              : "Total gross profit ÷ total sales"}
          </p>
        </div>
      </div>

      {report.missingCosts > 0 && (
        <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {report.missingCosts} completed project
          {report.missingCosts === 1 ? " has" : "s have"} no recorded costs.
          Review those projects to ensure the report is complete.
        </p>
      )}
      {report.undated.length > 0 && (
        <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {report.undated.length} completed project
          {report.undated.length === 1 ? " is" : "s are"} missing a valid
          completion date and excluded from monthly totals.{" "}
          <a
            href="#undated-projects"
            className="font-semibold underline underline-offset-4"
          >
            View projects
          </a>
        </p>
      )}

      <section
        aria-labelledby="monthly-sales-heading"
        className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="bg-[#f3f6fa] p-5 sm:p-6">
          <h2 id="monthly-sales-heading" className="text-xl font-bold">
            Sales by month
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Choose a month to see the completed projects behind its totals.
          </p>
          {report.totals.projectCount === 0 && (
            <p className="mt-3 text-sm text-slate-700">
              No dated completed projects in {year}. Choose another year or
              complete a project to see sales here.
            </p>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <caption className="sr-only">
              Monthly sales and gross margin for completed projects in {year}
            </caption>
            <thead className="border-y border-slate-200 bg-slate-50 text-xs text-slate-600">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Completion month
                </th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">
                  Projects
                </th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">
                  Sales
                </th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">
                  Costs
                </th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">
                  Gross profit
                </th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">
                  Margin
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {report.months.map((item) => (
                <tr
                  key={item.key}
                  className={
                    selectedMonth === item.key
                      ? "bg-blue-50"
                      : "hover:bg-slate-50"
                  }
                >
                  <th scope="row" className="w-1/4 px-5 py-3 text-left">
                    <button
                      type="button"
                      aria-pressed={selectedMonth === item.key}
                      aria-controls="monthly-projects"
                      onClick={() => {
                        setSelectedMonth(item.key);
                        document
                          .getElementById("monthly-projects")
                          ?.scrollIntoView({ block: "start" });
                      }}
                      className="w-full rounded text-left font-semibold text-blue-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
                    >
                      {item.label}
                      <span
                        aria-hidden="true"
                        className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
                      >
                        <span
                          className="block h-full rounded-full bg-blue-500"
                          style={{
                            width: `${(item.sales / largestSales) * 100}%`,
                          }}
                        />
                      </span>
                    </button>
                  </th>
                  <td className="px-5 py-3 text-right tabular-nums text-slate-600">
                    {item.projectCount}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums">
                    {money(item.sales)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-slate-600">
                    {money(item.costs)}
                  </td>
                  <td
                    className={`px-5 py-3 text-right font-semibold tabular-nums ${profitColor(item.grossProfit)}`}
                  >
                    {money(item.grossProfit)}
                  </td>
                  <td
                    className={`px-5 py-3 text-right tabular-nums ${profitColor(item.grossProfit)}`}
                  >
                    {marginLabel(item.margin)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-200 bg-[#f3f6fa] font-bold">
              <tr>
                <th scope="row" className="px-5 py-4">
                  {year} total
                </th>
                <td className="px-5 py-4 text-right tabular-nums">
                  {report.totals.projectCount}
                </td>
                <td className="px-5 py-4 text-right tabular-nums">
                  {money(report.totals.sales)}
                </td>
                <td className="px-5 py-4 text-right tabular-nums">
                  {money(report.totals.costs)}
                </td>
                <td
                  className={`px-5 py-4 text-right tabular-nums ${profitColor(report.totals.grossProfit)}`}
                >
                  {money(report.totals.grossProfit)}
                </td>
                <td
                  className={`px-5 py-4 text-right tabular-nums ${profitColor(report.totals.grossProfit)}`}
                >
                  {marginLabel(report.totals.margin)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section
        id="monthly-projects"
        aria-labelledby="project-breakdown-heading"
        className="mb-8 scroll-mt-28 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#f3f6fa] p-5 sm:p-6">
          <div aria-live="polite">
            <h2 id="project-breakdown-heading" className="text-xl font-bold">
              {month ? `${month.label} ${year}` : `${year}`} completed projects
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {visibleProjects.length} project
              {visibleProjects.length === 1 ? "" : "s"} · Select a project to
              open its tracker.
            </p>
          </div>
          {month && (
            <button
              type="button"
              className={buttonClass}
              onClick={() => setSelectedMonth(null)}
            >
              Show full year
            </button>
          )}
        </div>
        {visibleProjects.length > 0 ? (
          <ProjectTable projects={visibleProjects} />
        ) : (
          <p className="p-8 text-center text-sm text-slate-600">
            No projects were completed in{" "}
            {month ? `${month.label} ${year}` : year}.
          </p>
        )}
      </section>

      {report.undated.length > 0 && (
        <details
          id="undated-projects"
          className="mb-8 scroll-mt-28 overflow-hidden rounded-2xl border border-amber-200 bg-white"
        >
          <summary className="cursor-pointer bg-amber-50 p-5 font-semibold text-amber-900">
            Completed projects without a completion date (
            {report.undated.length})
          </summary>
          <p className="px-5 py-4 text-sm text-slate-600">
            These projects appear here for review and are excluded from every
            reporting year until a valid completion date is recorded.
          </p>
          <ProjectTable projects={report.undated} />
        </details>
      )}

      <footer className="max-w-4xl space-y-2 text-xs leading-relaxed text-slate-300">
        <p>
          Sales use the saved retail totals from Project Tracker, with delivery
          passed through at cost. Gross profit subtracts all recorded project
          costs. Gross margin divides total gross profit by total sales; a dash
          means sales are zero.
        </p>
        <p>
          Only projects currently marked Completed are included. Totals update
          if saved project pricing or costs change. Payment status and business
          overhead are tracked separately.
        </p>
        <p>
          Completion dates use Mazatlán time (UTC−7). All amounts are in US
          dollars.
        </p>
      </footer>
    </div>
  );
}
