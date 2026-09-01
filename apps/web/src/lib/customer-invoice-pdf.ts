export interface CustomerInvoiceLineItem {
  description: string;
  amount: number;
}

export interface CustomerInvoicePdfInput {
  projectId: string;
  projectName: string;
  customerName: string;
  invoiceDate: Date;
  dueDate: Date;
  lineItems: CustomerInvoiceLineItem[];
}

interface RenderRow extends CustomerInvoiceLineItem {
  descriptionLines: string[];
  height: number;
}

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const LEFT = 48;
const RIGHT = 564;

function sanitizePdfText(value: string) {
  return value
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .trim();
}

function escapePdfText(value: string) {
  return sanitizePdfText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(value: string, maxCharacters = 54) {
  const clean = sanitizePdfText(value) || "Project service";
  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (word.length > maxCharacters) {
      if (current) {
        lines.push(current);
        current = "";
      }
      for (let index = 0; index < word.length; index += maxCharacters) {
        lines.push(word.slice(index, index + maxCharacters));
      }
      continue;
    }

    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharacters) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function money(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function dateLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

function textCommand(x: number, y: number, size: number, value: string, font = "F1") {
  return `BT /${font} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${escapePdfText(value)}) Tj ET\n`;
}

function rightAlignedTextCommand(right: number, y: number, size: number, value: string, font = "F1") {
  const estimatedWidth = sanitizePdfText(value).length * size * 0.52;
  return textCommand(right - estimatedWidth, y, size, value, font);
}

function paginateRows(rows: RenderRow[]) {
  const pages: RenderRow[][] = [[]];
  let pageIndex = 0;
  let remainingHeight = 350;

  for (const row of rows) {
    if (row.height > remainingHeight && pages[pageIndex].length > 0) {
      pages.push([]);
      pageIndex += 1;
      remainingHeight = 530;
    }
    pages[pageIndex].push(row);
    remainingHeight -= row.height;
  }

  return pages;
}

function renderPage(
  input: CustomerInvoicePdfInput,
  rows: RenderRow[],
  pageIndex: number,
  pageCount: number,
  invoiceNumber: string,
  total: number,
) {
  const firstPage = pageIndex === 0;
  const lastPage = pageIndex === pageCount - 1;
  let content = "";

  content += "q 1 1 1 rg 0 0 612 792 re f Q\n";
  content += "0.08 0.12 0.18 rg\n";
  content += "q 0.23 0.55 0.95 rg 48 748 54 4 re f Q\n";
  content += textCommand(LEFT, 720, 22, "TalentEarth Studios", "F2");
  content += rightAlignedTextCommand(RIGHT, 720, 24, firstPage ? "INVOICE" : "INVOICE - CONTINUED", "F2");
  content += "q 0.78 0.82 0.88 RG 1 w 48 700 m 564 700 l S Q\n";

  let tableTop: number;
  if (firstPage) {
    content += textCommand(LEFT, 660, 9, "BILL TO", "F2");
    content += textCommand(LEFT, 638, 16, input.customerName, "F2");
    content += textCommand(LEFT, 610, 9, "PROJECT", "F2");
    for (const [index, line] of wrapText(input.projectName, 58).entries()) {
      content += textCommand(LEFT, 590 - index * 14, 11, line);
    }

    content += textCommand(400, 660, 9, "INVOICE NUMBER", "F2");
    content += rightAlignedTextCommand(RIGHT, 644, 10, invoiceNumber);
    content += textCommand(400, 620, 9, "INVOICE DATE", "F2");
    content += rightAlignedTextCommand(RIGHT, 604, 10, dateLabel(input.invoiceDate));
    content += textCommand(400, 580, 9, "DUE DATE", "F2");
    content += rightAlignedTextCommand(RIGHT, 564, 10, dateLabel(input.dueDate));
    content += textCommand(400, 540, 9, "TERMS", "F2");
    content += rightAlignedTextCommand(RIGHT, 524, 10, "Net 30");
    tableTop = 490;
  } else {
    content += textCommand(LEFT, 670, 10, `Invoice ${invoiceNumber} for ${input.customerName}`);
    tableTop = 638;
  }

  content += `q 0.88 0.93 0.99 rg ${LEFT} ${tableTop} ${RIGHT - LEFT} 28 re f Q\n`;
  content += textCommand(LEFT + 12, tableTop + 9, 9, "DESCRIPTION", "F2");
  content += textCommand(445, tableTop + 9, 9, "QTY", "F2");
  content += rightAlignedTextCommand(RIGHT - 10, tableTop + 9, 9, "AMOUNT", "F2");

  let y = tableTop;
  rows.forEach((row, rowIndex) => {
    y -= row.height;
    if (rowIndex % 2 === 1) {
      content += `q 0.96 0.97 0.99 rg ${LEFT} ${y} ${RIGHT - LEFT} ${row.height} re f Q\n`;
    }
    row.descriptionLines.forEach((line, lineIndex) => {
      content += textCommand(LEFT + 12, y + row.height - 18 - lineIndex * 12, 10, line);
    });
    content += textCommand(450, y + row.height - 18, 10, "1");
    content += rightAlignedTextCommand(RIGHT - 10, y + row.height - 18, 10, money(row.amount));
    content += `q 0.82 0.85 0.90 RG 0.5 w ${LEFT} ${y} m ${RIGHT} ${y} l S Q\n`;
  });

  if (lastPage) {
    const totalY = Math.max(92, y - 48);
    content += `q 0.23 0.55 0.95 RG 1.5 w 372 ${totalY + 26} m ${RIGHT} ${totalY + 26} l S Q\n`;
    content += textCommand(372, totalY, 11, "TOTAL DUE", "F2");
    content += rightAlignedTextCommand(RIGHT, totalY - 2, 16, money(total), "F2");
  }

  content += textCommand(LEFT, 34, 8, "Thank you for your business.");
  content += rightAlignedTextCommand(RIGHT, 34, 8, `Page ${pageIndex + 1} of ${pageCount}`);
  return content;
}

export function createCustomerInvoicePdf(input: CustomerInvoicePdfInput) {
  if (input.lineItems.length === 0) {
    throw new Error("At least one invoice line item is required.");
  }

  const rows: RenderRow[] = input.lineItems.map((line) => {
    if (!Number.isFinite(line.amount) || line.amount < 0) {
      throw new Error("Invoice line amounts must be valid non-negative numbers.");
    }
    const descriptionLines = wrapText(line.description);
    return {
      ...line,
      descriptionLines,
      height: Math.max(30, 18 + descriptionLines.length * 12),
    };
  });
  const pages = paginateRows(rows);
  const invoiceNumber = `TES-${input.projectId.slice(-8).toUpperCase()}`;
  const total = input.lineItems.reduce((sum, line) => sum + line.amount, 0);

  const objects: string[] = [""];
  const pageObjectNumbers = pages.map((_, index) => 5 + index * 2);
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Count ${pages.length} /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(" ")}] >>`;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

  pages.forEach((pageRows, index) => {
    const pageObjectNumber = 5 + index * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    const content = renderPage(input, pageRows, index, pages.length, invoiceNumber, total);
    objects[pageObjectNumber] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`;
    objects[contentObjectNumber] = `<< /Length ${content.length} >>\nstream\n${content}endstream`;
  });

  let pdf = "%PDF-1.4\n%TalentEarth\n";
  const offsets: number[] = [0];
  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = pdf.length;
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index < objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return new Blob([new TextEncoder().encode(pdf)], { type: "application/pdf" });
}

export function getCustomerInvoicePdfFilename(projectName: string, projectId: string) {
  const safeProjectName = projectName.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  return `Invoice-${safeProjectName || projectId}.pdf`;
}
