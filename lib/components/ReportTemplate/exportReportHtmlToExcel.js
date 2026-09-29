import ExcelJS from "exceljs";

const NUMBER_RE = /^-?[\d,]+(\.\d+)?$/;
const CURRENCY_RE = /^(rs\.?|lkr|usd|\$)\s*/i;
const SKIP_TEXT_RE =
  /^(print|convert to excel|download pdf|loading|powered by)/i;
const TITLE_HINT_RE =
  /invoice|quotation|order|voucher|receipt|grn|note|shipment|deposit|payment|cycle count|outstanding|summary|stock|cash|bank|profit|shift|day end|dispatch|adjustment/i;
const TITLE_WORDS = [
  "SALES",
  "INVOICE",
  "QUOTATION",
  "PURCHASE",
  "PAYMENT",
  "VOUCHER",
  "CREDIT",
  "DEBIT",
  "NOTE",
  "DEPOSIT",
  "SHIPMENT",
  "ORDER",
  "GOODS",
  "RECEIVED",
  "RETURN",
  "STOCK",
  "CYCLE",
  "COUNT",
  "RECEIPT",
  "OUTSTANDING",
  "DAILY",
  "CUSTOMER",
  "SERVICE",
  "SUMMARY",
  "BALANCE",
  "MOVEMENT",
  "PROFIT",
  "CASH",
  "BANK",
  "SHIFT",
  "GRN",
];
const ITEM_HEADER_RE =
  /^(item|product|code|item code|product code|qty|quantity|unit price|cost price|selling price|dis%|dis %|dis amt|discount|line total|amount|description|uom|rate|price|total|date|invoice no|customer|pay type|gross|net|paid|balance|remark)$/i;
const TOTAL_LABEL_RE =
  /^(gross\s*total|sub\s*total|subtotal|discount(?:\s*\(%\))?|net\s*total|payment\s*amount|balance|line\s*discount|order\s*discount|merchandise|tax|vat|total)\b/i;
const AMOUNT_HINT_RE =
  /price|amount|total|dis\s*amt|discount|balance|gross|net|cost|selling|tax|vat|paid|profit/i;
const QTY_HINT_RE = /^(qty|quantity|#)$/i;
const CODE_LABEL_RE = /\b(no|number|code|id|reference|ref)\b/i;
const GRID = "FFB0B7C3";
const THIN = { style: "thin", color: { argb: GRID } };
const CELL_BORDER = { top: THIN, left: THIN, bottom: THIN, right: THIN };

const THEMES = {
  sales: {
    primary: "FF1F4E79",
    soft: "FFE8EEF4",
    accent: "FF1D4ED8",
    alt: "FFF8FAFC",
  },
  inventory: {
    primary: "FF0F766E",
    soft: "FFCCFBF1",
    accent: "FF0D9488",
    alt: "FFF0FDFA",
  },
  finance: {
    primary: "FF166534",
    soft: "FFDCFCE7",
    accent: "FF15803D",
    alt: "FFF0FDF4",
  },
  service: {
    primary: "FF5B21B6",
    soft: "FFEDE9FE",
    accent: "FF7C3AED",
    alt: "FFF5F3FF",
  },
  profit: {
    primary: "FF9A3412",
    soft: "FFFFEDD5",
    accent: "FFC2410C",
    alt: "FFFFF7ED",
  },
};

const cellText = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();

const stripTags = (html) =>
  String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();

const getView = (root) =>
  root?.ownerDocument?.defaultView ||
  (typeof window !== "undefined" ? window : null);

const humanizeTitle = (text) => {
  const cleaned = String(text || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  if (/\s/.test(cleaned)) return cleaned.replace(/\s+\(CONT\.?\)$/i, "").trim();
  let spaced = cleaned;
  [...TITLE_WORDS]
    .sort((a, b) => b.length - a.length)
    .forEach((word) => {
      spaced = spaced.replace(new RegExp(`(${word})`, "gi"), " $1 ");
    });
  return spaced.replace(/\s+/g, " ").trim();
};

const looksLikeCode = (text) => {
  const value = String(text || "").trim();
  return /^0+\d+$/.test(value) || /^\d{8,}$/.test(value);
};

const keepAsText = (text, label) =>
  looksLikeCode(text) || CODE_LABEL_RE.test(label || "");

const toExcelValue = (raw, label = "") => {
  const text = String(raw ?? "").replace(/\s+/g, " ").trim();
  if (!text || text === "—" || text === "-") return text || "-";
  if (keepAsText(text, label)) return text;
  const stripped = text.replace(CURRENCY_RE, "").trim();
  if (NUMBER_RE.test(stripped)) {
    const numeric = Number(stripped.replace(/,/g, ""));
    if (!Number.isNaN(numeric)) return numeric;
  }
  return text;
};

const stackedTexts = (el) => {
  if (!el) return [];
  const html = el.innerHTML || "";
  if (/<br\s*\/?>/i.test(html)) {
    return html
      .split(/<br\s*\/?>/i)
      .map((part) => stripTags(part))
      .filter(Boolean);
  }
  const kids = Array.from(el.children || []).filter((child) => cellText(child));
  if (kids.length >= 2) {
    return kids.map((child) => cellText(child)).filter(Boolean);
  }
  const text = cellText(el);
  return text ? [text] : [];
};

const textChildren = (el) =>
  Array.from(el?.children || []).filter((child) => {
    const text = cellText(child);
    return text && !SKIP_TEXT_RE.test(text);
  });

const isRowLayout = (el, win) => {
  if (!el || !win?.getComputedStyle) return false;
  const style = win.getComputedStyle(el);
  const display = style.display || "";
  if (display.includes("flex") || display.includes("inline-flex")) {
    return (style.flexDirection || "row") !== "column";
  }
  return display.includes("grid");
};

const containsNestedRow = (el, win) =>
  Array.from(el.querySelectorAll("*")).some(
    (node) => node !== el && isRowLayout(node, win) && textChildren(node).length >= 2
  );

const resolveTheme = (title, downloadName) => {
  const hay = `${title || ""} ${downloadName || ""}`.toLowerCase();
  if (/profit/.test(hay)) return THEMES.profit;
  if (/service|job.?card|repair|intake|work.?auth/.test(hay)) return THEMES.service;
  if (
    /cash.?book|cash.?flow|bank.?history|payment_|\bpayments\b|daily.?deposit|cash.?in|cash.?out|supplier.?outstanding/.test(
      hay
    )
  ) {
    return THEMES.finance;
  }
  if (
    /grn|purchase.?order|\bpo[_-]|goods|stock|shipment(?! invoice)|dispatch|adjustment|cycle.?count/.test(
      hay
    )
  ) {
    return THEMES.inventory;
  }
  return THEMES.sales;
};

const collectHeadingTitle = (root) => {
  const explicit = root.querySelector(".doc-title, h1, h2, .report-title, .title");
  if (explicit) {
    const text = humanizeTitle(cellText(explicit));
    if (text && !SKIP_TEXT_RE.test(text)) return text;
  }

  const heading = Array.from(
    root.querySelectorAll("h1, h2, h3, h4, h5, h6, p, span, div")
  ).find((el) => {
    if (el.children.length > 0) return false;
    const text = cellText(el);
    return text && text.length > 6 && text.length < 80 && TITLE_HINT_RE.test(text);
  });
  return heading ? humanizeTitle(cellText(heading)) : "";
};

const collectCompanyLines = (root, win) => {
  const name = cellText(root.querySelector(".header .company .name, .company .name"));
  const extra = Array.from(
    root.querySelectorAll(
      ".header .company .line, .header .company .contact, .company .line, .company .contact"
    )
  )
    .map((el) => cellText(el))
    .filter((text) => text && !SKIP_TEXT_RE.test(text));
  if (name) return [name, ...extra];

  const header = Array.from(root.querySelectorAll("*")).find(
    (el) => isRowLayout(el, win) && el.querySelector("img") && textChildren(el).length >= 1
  );
  if (!header) return [];
  const textCol = Array.from(header.children).find(
    (child) => !child.querySelector("img") && cellText(child)
  );
  if (!textCol) return [];
  return Array.from(textCol.querySelectorAll("p, h1, h2, h3, h4, h5, h6, span, div"))
    .filter((el) => el.children.length === 0)
    .map((el) => cellText(el))
    .filter((text) => text && !SKIP_TEXT_RE.test(text) && !TITLE_HINT_RE.test(text))
    .slice(0, 6);
};

const parseLabeledRow = (row) => {
  const label = cellText(row.querySelector(".label"));
  if (label) {
    const full = cellText(row);
    const value = full.replace(label, "").replace(/^[\s:]*/, "").trim();
    return [label, value || "-"];
  }
  const kids = textChildren(row);
  const texts = kids.map((child) => cellText(child));
  if (texts.length === 3 && texts[1] === ":") return [texts[0], texts[2]];
  if (texts.length === 2) return [texts[0], texts[1]];
  return null;
};

const collectLabelValuePairs = (container, win) => {
  const pairs = [];
  container.querySelectorAll("*").forEach((el) => {
    if (!isRowLayout(el, win) || containsNestedRow(el, win)) return;
    const pair = parseLabeledRow(el);
    if (pair) pairs.push(pair);
  });
  return pairs;
};

const collectMetaColumns = (root, win) => {
  const cols = Array.from(root.querySelectorAll(".meta > .col"));
  const fromCol = (col) =>
    Array.from(col.querySelectorAll(".row")).map(parseLabeledRow).filter(Boolean);

  if (cols.length >= 2) {
    return { left: fromCol(cols[0]), right: fromCol(cols[1]) };
  }
  if (cols.length === 1) {
    return { left: fromCol(cols[0]), right: [] };
  }

  const pairedKids = Array.from(root.querySelectorAll(".meta, *")).find((el) => {
    if (!isRowLayout(el, win)) return false;
    const kids = Array.from(el.children).filter((child) => cellText(child));
    if (kids.length !== 2) return false;
    const left = collectLabelValuePairs(kids[0], win);
    const right = collectLabelValuePairs(kids[1], win);
    return left.length >= 2 && right.length >= 2;
  });
  if (pairedKids) {
    const kids = Array.from(pairedKids.children).filter((child) => cellText(child));
    return {
      left: collectLabelValuePairs(kids[0], win),
      right: collectLabelValuePairs(kids[1], win),
    };
  }
  return null;
};

const collectKpis = (root) =>
  Array.from(root.querySelectorAll(".summary-grid .item"))
    .map((item) => {
      const label = cellText(item.querySelector(".label")) || stackedTexts(item)[0];
      const full = cellText(item);
      const value = full.replace(label || "", "").trim();
      return label && value ? [label, value] : null;
    })
    .filter(Boolean);

const collectTemplateTotals = (root) =>
  Array.from(root.querySelectorAll(".totals .row, .totals-wrap .row"))
    .map((row) => {
      const spans = Array.from(row.querySelectorAll("span"))
        .map((el) => cellText(el))
        .filter(Boolean);
      if (spans.length >= 2) return [spans[0], spans[spans.length - 1]];
      const texts = stackedTexts(row);
      return texts.length >= 2 ? [texts[0], texts[texts.length - 1]] : null;
    })
    .filter(Boolean);

const headerTextsOf = (el) => textChildren(el).map((child) => cellText(child));

const isItemHeaderRow = (el, win) => {
  if (!isRowLayout(el, win) || containsNestedRow(el, win)) return false;
  const texts = headerTextsOf(el);
  if (texts.length < 3) return false;
  const hits = texts.filter((text) => ITEM_HEADER_RE.test(text)).length;
  return hits >= 3 || (hits >= 2 && /item|product|description/i.test(texts[0] || ""));
};

const extractItemValues = (el) => {
  const kids = textChildren(el);
  if (kids.length < 2 || /^no items/i.test(cellText(el))) return null;
  return kids.map((child, index) => (index === 0 ? stackedTexts(child) : cellText(child)));
};

const collectFlexItemTable = (root, win) => {
  const headerEls = Array.from(root.querySelectorAll("*")).filter((el) =>
    isItemHeaderRow(el, win)
  );
  if (!headerEls.length) return null;

  const headers = headerTextsOf(headerEls[0]);
  const dataRows = [];
  let totals = [];

  headerEls.forEach((headerEl) => {
    const siblings = Array.from(headerEl.parentElement?.children || []);
    const start = siblings.indexOf(headerEl);
    for (let i = start + 1; i < siblings.length; i += 1) {
      const el = siblings[i];
      if (isItemHeaderRow(el, win)) break;
      const pairs = collectLabelValuePairs(el, win).filter(([label]) =>
        TOTAL_LABEL_RE.test(label)
      );
      if (pairs.length || containsNestedRow(el, win)) {
        if (pairs.length) totals = pairs;
        break;
      }
      if (!isRowLayout(el, win)) continue;
      const row = extractItemValues(el);
      if (row) dataRows.push(row);
    }
  });

  return { headers, dataRows, totals };
};

const normalizeItemTable = (headers, dataRows) => {
  const firstIsItem = /^(item|product|description)$/i.test(headers[0] || "");
  const secondIsCode = /code/i.test(headers[1] || "");
  const needsSplit =
    firstIsItem &&
    !secondIsCode &&
    dataRows.some((row) => Array.isArray(row[0]) && row[0].length >= 2);

  const nextHeaders = needsSplit
    ? [headers[0], "Item Code", ...headers.slice(1)]
    : headers;

  const rows = dataRows.map((row) => {
    const cells = [];
    row.forEach((cell, index) => {
      if (needsSplit && index === 0) {
        const parts = Array.isArray(cell) ? cell : [cell];
        cells.push(parts[0] || "-", parts[1] || "");
        return;
      }
      cells.push(Array.isArray(cell) ? cell.filter(Boolean).join(" ") : cell);
    });
    return nextHeaders.map((header, index) => toExcelValue(cells[index], header));
  });

  return { headers: nextHeaders, rows };
};

const getTopLevelTables = (root) =>
  Array.from(root.querySelectorAll("table")).filter(
    (table) =>
      !table.parentElement?.closest("table") &&
      !table.classList.contains("nested-table")
  );

const rowValuesFromCells = (cells) => {
  const values = [];
  cells.forEach((cell) => {
    const parts = stackedTexts(cell);
    const span = Math.max(1, Number(cell.getAttribute("colspan")) || 1);
    values.push(parts.length > 1 ? parts : parts[0] || "");
    for (let i = 1; i < span; i += 1) values.push("");
  });
  return values;
};

const tableToSection = (table) => {
  const titleEl =
    table.closest(".items")?.previousElementSibling?.classList?.contains("section-title")
      ? table.closest(".items").previousElementSibling
      : table.previousElementSibling?.classList?.contains("section-title")
        ? table.previousElementSibling
        : null;
  const title = titleEl ? cellText(titleEl) : "";

  const theadRow = table.querySelector("thead tr");
  const bodyRows = [];
  let headers = [];

  if (theadRow) {
    headers = rowValuesFromCells(Array.from(theadRow.querySelectorAll("th, td"))).map(
      (cell) => String(Array.isArray(cell) ? cell[0] : cell || "")
    );
    table.querySelectorAll("tbody tr").forEach((tr) => {
      const values = rowValuesFromCells(Array.from(tr.querySelectorAll("th, td")));
      if (values.some((value) => (Array.isArray(value) ? value.join("") : value) !== "")) {
        bodyRows.push(values);
      }
    });
  } else {
    const rows = [];
    table.querySelectorAll("tr").forEach((tr) => {
      const values = rowValuesFromCells(Array.from(tr.querySelectorAll("th, td")));
      if (values.some((value) => (Array.isArray(value) ? value.join("") : value) !== "")) {
        rows.push(values);
      }
    });
    if (!rows.length) return null;
    headers = rows[0].map((cell) => String(Array.isArray(cell) ? cell[0] : cell || ""));
    bodyRows.push(...rows.slice(1));
  }

  const totals = [];
  table.querySelectorAll("tfoot tr").forEach((tr) => {
    const texts = Array.from(tr.querySelectorAll("th, td")).map((cell) => cellText(cell));
    if (texts.length >= 2) totals.push([texts[0], texts[texts.length - 1]]);
  });

  return { title, headers, dataRows: bodyRows, totals };
};

const looksLikeDetailsTable = (section) => {
  if (!section || section.headers.length > 3) return false;
  return (
    section.dataRows.length >= 1 &&
    section.dataRows.every((row) => row.length <= 3) &&
    !ITEM_HEADER_RE.test(section.headers[0] || "")
  );
};

const applyValueCell = (cell, value, label = "") => {
  if (typeof value === "number") {
    cell.value = value;
    cell.numFmt = AMOUNT_HINT_RE.test(label) || !Number.isInteger(value)
      ? "#,##0.00"
      : QTY_HINT_RE.test(label)
        ? "#,##0.##"
        : "#,##0";
    cell.alignment = { horizontal: "right", vertical: "middle" };
    return;
  }
  const text = value == null ? "" : String(value);
  cell.value = text;
  if (keepAsText(text, label)) cell.numFmt = "@";
  cell.alignment = AMOUNT_HINT_RE.test(label) || QTY_HINT_RE.test(label)
    ? { horizontal: "right", vertical: "middle" }
    : { vertical: "middle", wrapText: true };
};

const sanitizeSheetName = (name) => {
  const cleaned = String(name || "Report").replace(/[:\\/?*[\]]/g, " ").trim();
  return (cleaned || "Report").slice(0, 31);
};

const downloadWorkbook = async (workbook, downloadName) => {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${downloadName}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
};

const fillRange = (sheet, rowNumber, colCount, color) => {
  for (let i = 1; i <= colCount; i += 1) {
    sheet.getRow(rowNumber).getCell(i).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: color },
    };
  }
};

const emptyModel = () => ({
  theme: THEMES.sales,
  companyLines: [],
  title: "",
  detailsLeft: [],
  detailsRight: [],
  kpis: [],
  sections: [],
});

const parseHtmlToModel = (root, downloadName) => {
  const win = getView(root);
  const title = collectHeadingTitle(root);
  const theme = resolveTheme(title, downloadName);
  const companyLines = collectCompanyLines(root, win);
  const meta = collectMetaColumns(root, win);
  const allPairs = collectLabelValuePairs(root, win);
  const totalsFromPairs = allPairs.filter(([label]) => TOTAL_LABEL_RE.test(label));
  const detailPairs = allPairs.filter(([label]) => !TOTAL_LABEL_RE.test(label));

  let detailsLeft = meta?.left || [];
  let detailsRight = meta?.right || [];
  if (!meta && detailPairs.length) {
    const midpoint = Math.ceil(detailPairs.length / 2);
    detailsLeft = detailPairs.slice(0, midpoint);
    detailsRight = detailPairs.slice(midpoint);
  }

  const kpis = collectKpis(root);
  const templateTotals = collectTemplateTotals(root);
  const tableSections = getTopLevelTables(root)
    .map(tableToSection)
    .filter(Boolean);

  const sections = [];
  tableSections.forEach((section) => {
    if (looksLikeDetailsTable(section) && !detailsLeft.length) {
      const pairs = [
        ...section.dataRows.map((row) => [
          String(Array.isArray(row[0]) ? row[0][0] : row[0] || ""),
          String(Array.isArray(row[1]) ? row[1][0] : row[1] || ""),
        ]),
      ];
      const midpoint = Math.ceil(pairs.length / 2);
      detailsLeft = pairs.slice(0, midpoint);
      detailsRight = pairs.slice(midpoint);
      return;
    }
    const normalized = normalizeItemTable(section.headers, section.dataRows);
    sections.push({
      title: section.title,
      headers: normalized.headers,
      rows: normalized.rows,
      totals: section.totals,
    });
  });

  if (!sections.length) {
    const flexTable = collectFlexItemTable(root, win);
    if (flexTable) {
      const normalized = normalizeItemTable(flexTable.headers, flexTable.dataRows);
      sections.push({
        title: "",
        headers: normalized.headers,
        rows: normalized.rows,
        totals: flexTable.totals,
      });
    }
  }

  const lastSection = sections[sections.length - 1];
  const extraTotals = templateTotals.length
    ? templateTotals
    : lastSection?.totals?.length
      ? lastSection.totals
      : totalsFromPairs;
  if (lastSection && extraTotals.length && !lastSection.totals?.length) {
    lastSection.totals = extraTotals;
  } else if (lastSection && templateTotals.length) {
    lastSection.totals = templateTotals;
  }

  return {
    theme,
    companyLines,
    title,
    detailsLeft,
    detailsRight,
    kpis,
    sections,
  };
};

/**
 * Writes a structured workbook used by HTML report/document prints and
 * data-driven exports such as receipts.
 */
export async function writeOrganizedExcel(model, downloadName = "report") {
  const data = { ...emptyModel(), ...model };
  const theme = data.theme || THEMES.sales;
  const colCount = Math.max(
    6,
    ...data.sections.map((section) => section.headers?.length || 0),
    data.kpis.length ? Math.min(data.kpis.length * 2, 8) : 0
  );

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sanitizeSheetName(downloadName));
  for (let i = 1; i <= colCount; i += 1) {
    sheet.getColumn(i).width = i === 1 ? 28 : i === 2 ? 22 : 15;
  }

  data.companyLines.forEach((line, index) => {
    const row = sheet.addRow([line]);
    sheet.mergeCells(row.number, 1, row.number, colCount);
    row.getCell(1).font =
      index === 0
        ? { bold: true, size: 14, color: { argb: theme.primary } }
        : { size: 10, color: { argb: "FF334155" } };
    row.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
  });
  if (data.companyLines.length) sheet.addRow([]);

  if (data.title) {
    const row = sheet.addRow([humanizeTitle(data.title)]);
    sheet.mergeCells(row.number, 1, row.number, colCount);
    row.height = 26;
    row.getCell(1).font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
    row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    fillRange(sheet, row.number, colCount, theme.primary);
    sheet.addRow([]);
  }

  const detailCount = Math.max(data.detailsLeft.length, data.detailsRight.length);
  for (let i = 0; i < detailCount; i += 1) {
    const [leftLabel, leftValue] = data.detailsLeft[i] || ["", ""];
    const [rightLabel, rightValue] = data.detailsRight[i] || ["", ""];
    const leftParsed = toExcelValue(leftValue, leftLabel);
    const rightParsed = toExcelValue(rightValue, rightLabel);
    const row = sheet.addRow([leftLabel, leftParsed, "", rightLabel, rightParsed]);
    row.height = 18;
    row.getCell(1).font = { bold: true, color: { argb: "FF1E293B" } };
    row.getCell(4).font = { bold: true, color: { argb: "FF1E293B" } };
    row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: theme.soft } };
    row.getCell(4).fill = { type: "pattern", pattern: "solid", fgColor: { argb: theme.soft } };
    applyValueCell(row.getCell(2), leftParsed, leftLabel);
    applyValueCell(row.getCell(5), rightParsed, rightLabel);
  }
  if (detailCount) sheet.addRow([]);

  if (data.kpis.length) {
    const kpiRow = sheet.addRow([]);
    data.kpis.slice(0, 4).forEach((pair, index) => {
      const labelCol = index * 2 + 1;
      const valueCol = index * 2 + 2;
      kpiRow.getCell(labelCol).value = pair[0];
      kpiRow.getCell(labelCol).font = { bold: true, size: 9, color: { argb: theme.primary } };
      kpiRow.getCell(labelCol).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: theme.soft },
      };
      applyValueCell(kpiRow.getCell(valueCol), toExcelValue(pair[1], pair[0]), pair[0]);
      kpiRow.getCell(valueCol).font = { bold: true };
      kpiRow.getCell(valueCol).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: theme.soft },
      };
    });
    sheet.addRow([]);
  }

  let freezeRow = 1;
  data.sections.forEach((section, sectionIndex) => {
    if (sectionIndex > 0) sheet.addRow([]);
    if (section.title) {
      const titleRow = sheet.addRow([section.title]);
      sheet.mergeCells(titleRow.number, 1, titleRow.number, Math.max(section.headers.length, 2));
      titleRow.getCell(1).font = { bold: true, size: 12, color: { argb: theme.primary } };
    }

    if (section.headers?.length) {
      const headerRow = sheet.addRow(section.headers);
      headerRow.height = 20;
      freezeRow = headerRow.number;
      section.headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: theme.primary } };
        cell.border = CELL_BORDER;
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      });

      (section.rows || []).forEach((values, rowIndex) => {
        const row = sheet.addRow(values);
        row.height = 18;
        section.headers.forEach((header, index) => {
          const cell = row.getCell(index + 1);
          applyValueCell(cell, values[index], header);
          cell.border = CELL_BORDER;
          if (rowIndex % 2 === 1) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: theme.alt } };
          }
        });
      });
    }

    const totals = section.totals || [];
    if (totals.length) {
      sheet.addRow([]);
      const labelCol = Math.max((section.headers?.length || 3) - 1, 2);
      const valueCol = Math.max(section.headers?.length || 3, 3);
      totals.forEach(([label, value], index) => {
        const parsed = toExcelValue(value, label);
        const row = sheet.addRow([]);
        row.height = 18;
        row.getCell(labelCol).value = label;
        row.getCell(labelCol).font = { bold: true };
        row.getCell(labelCol).alignment = { horizontal: "right", vertical: "middle" };
        applyValueCell(row.getCell(valueCol), parsed, label);
        row.getCell(valueCol).font = { bold: true };
        if (typeof parsed === "number") row.getCell(valueCol).numFmt = "#,##0.00";
        if (index === totals.length - 1) {
          const medium = { style: "medium", color: { argb: theme.primary } };
          row.getCell(labelCol).border = { top: medium };
          row.getCell(valueCol).border = { top: medium, ...CELL_BORDER };
          row.getCell(valueCol).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: theme.soft },
          };
        }
      });
    }
  });

  if (freezeRow > 1) {
    sheet.views = [{ state: "frozen", ySplit: freezeRow }];
  }

  await downloadWorkbook(workbook, downloadName);
}

export default async function exportReportHtmlToExcel(source, downloadName = "report") {
  if (!source) {
    throw new Error("Nothing to export yet.");
  }

  const root =
    (typeof source.querySelector === "function" && source.querySelector(".page")) ||
    source.body ||
    (source.nodeType === 1 ? source : null);
  if (!root) {
    throw new Error("Nothing to export yet.");
  }

  const model = parseHtmlToModel(root, downloadName);
  const hasData =
    model.sections.some((section) => section.rows?.length || section.headers?.length) ||
    model.detailsLeft.length ||
    model.kpis.length ||
    model.title;

  if (!hasData) {
    throw new Error("No report data found to convert.");
  }

  await writeOrganizedExcel(model, downloadName);
}
