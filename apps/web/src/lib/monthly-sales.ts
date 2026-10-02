// Use the owner's reporting time zone consistently on the server, in the UI,
// and in CSV exports so completion dates near midnight keep the same month.
export const SALES_REPORT_TIME_ZONE = "America/Mazatlan";

export interface SalesProject {
  id: string;
  name: string;
  client: string;
  status: string;
  completedAt: string | null;
  sales: number;
  costs: number;
  costItemCount: number;
}

export interface SalesTotals {
  projectCount: number;
  sales: number;
  costs: number;
  grossProfit: number;
  margin: number | null;
}

export interface SalesMonth extends SalesTotals {
  key: string;
  label: string;
  projects: SalesProject[];
}

const completionFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: SALES_REPORT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
});

export function completionMonth(completedAt: string | null) {
  if (!completedAt) return null;
  const date = new Date(completedAt);
  if (!Number.isFinite(date.getTime())) return null;
  const parts = completionFormatter.formatToParts(date);
  return `${parts.find((part) => part.type === "year")!.value}-${parts.find((part) => part.type === "month")!.value}`;
}

export function sumSalesProjects(projects: SalesProject[]): SalesTotals {
  // Sum rounded cents, and calculate a weighted margin from the combined totals.
  const salesCents = projects.reduce(
    (total, project) =>
      total + Math.round((project.sales + Number.EPSILON) * 100),
    0,
  );
  const costCents = projects.reduce(
    (total, project) =>
      total + Math.round((project.costs + Number.EPSILON) * 100),
    0,
  );
  return {
    projectCount: projects.length,
    sales: salesCents / 100,
    costs: costCents / 100,
    grossProfit: (salesCents - costCents) / 100,
    margin:
      salesCents > 0 ? ((salesCents - costCents) / salesCents) * 100 : null,
  };
}

export function buildMonthlySalesReport(
  projects: SalesProject[],
  year: number,
) {
  const completed = projects.filter(
    (project) => project.status === "COMPLETED",
  );
  const dated = completed.map((project) => ({
    project,
    month: completionMonth(project.completedAt),
  }));
  const months: SalesMonth[] = Array.from({ length: 12 }, (_, index) => {
    const key = `${year}-${String(index + 1).padStart(2, "0")}`;
    const monthProjects = dated
      .filter((entry) => entry.month === key)
      .map((entry) => entry.project)
      .sort(
        (a, b) =>
          Date.parse(b.completedAt!) - Date.parse(a.completedAt!) ||
          a.name.localeCompare(b.name),
      );
    return {
      key,
      label: new Intl.DateTimeFormat("en-US", {
        month: "long",
        timeZone: "UTC",
      }).format(new Date(Date.UTC(year, index, 1))),
      projects: monthProjects,
      ...sumSalesProjects(monthProjects),
    };
  });
  const yearProjects = months.flatMap((month) => month.projects);
  return {
    months,
    totals: sumSalesProjects(yearProjects),
    projects: yearProjects,
    years: [
      ...new Set([
        year,
        ...dated.flatMap((entry) =>
          entry.month ? [Number(entry.month.slice(0, 4))] : [],
        ),
      ]),
    ].sort((a, b) => b - a),
    undated: dated
      .filter((entry) => !entry.month)
      .map((entry) => entry.project),
    missingCosts: yearProjects.filter((project) => project.costItemCount === 0)
      .length,
  };
}

export function monthlySalesCsv(
  months: SalesMonth[],
  totals: SalesTotals,
  year: number,
) {
  const values = (row: SalesTotals) => [
    row.projectCount,
    row.sales.toFixed(2),
    row.costs.toFixed(2),
    row.grossProfit.toFixed(2),
    row.margin === null ? "" : row.margin.toFixed(2),
  ];
  return (
    [
      [
        "Completion month (America/Mazatlan)",
        "Completed projects",
        "Sales (USD)",
        "Project costs (USD)",
        "Gross profit (USD)",
        "Gross margin (%)",
      ],
      ...months.map((month) => [month.key, ...values(month)]),
      [`${year} total`, ...values(totals)],
    ]
      .map((row) => row.join(","))
      .join("\r\n") + "\r\n"
  );
}
