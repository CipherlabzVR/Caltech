import { escapeHtml } from "./applyTemplate";

/** Per-unit freight duty: prefer persisted FreightDutyCost, else legacy AdditionalCost / derive. */
export const getFreightDutyCost = (item) => {
  const freightStored = Number(
    item?.freightDutyCost ?? item?.FreightDutyCost
  );
  const hasExplicitSplit =
    item?.freightDutyCost != null ||
    item?.FreightDutyCost != null ||
    item?.localTransportCost != null ||
    item?.LocalTransportCost != null;

  if (hasExplicitSplit && Number.isFinite(freightStored)) {
    return freightStored;
  }

  if (Number.isFinite(freightStored) && Math.abs(freightStored) > 0.0001) {
    return freightStored;
  }

  if (!hasExplicitSplit) {
    const stored = Number(item?.additionalCost);
    if (Number.isFinite(stored) && Math.abs(stored) > 0.0001) {
      return stored;
    }
  }

  const qty = Number(item?.qty) || 0;
  const free = Number(item?.free) || 0;
  const unitPrice = Number(item?.unitPrice) || 0;
  const lineTotal = Number(item?.lineTotal) || 0;
  const discountRate = Number(item?.discountRate) || 0;
  const lineDiscountAmount = (unitPrice * qty * discountRate) / 100;
  const qtyPlusFree = qty + free;

  if (qty > 0 && free === 0) {
    return (lineTotal - unitPrice * qty + lineDiscountAmount) / qty;
  }

  const costPrice = Number(item?.costPrice) || 0;
  if (costPrice > 0 && qtyPlusFree > 0) {
    return costPrice - (unitPrice * qty - lineDiscountAmount) / qtyPlusFree;
  }

  return 0;
};

/** Per-unit overseas transport. */
export const getOverseasTransportCost = (item) => {
  const stored = Number(
    item?.overseasTransportCost ??
      item?.OverseasTransportCost ??
      item?.additionalCost ??
      item?.AdditionalCost
  );
  return Number.isFinite(stored) ? stored : 0;
};

/** Per-unit local transport. */
export const getLocalTransportCost = (item) => {
  const stored = Number(
    item?.localTransportCost ?? item?.LocalTransportCost
  );
  return Number.isFinite(stored) ? stored : 0;
};

const formatQty = (value) => {
  const numericValue = Number(value ?? 0);
  if (Number.isNaN(numericValue)) return "0";
  return Number.isInteger(numericValue)
    ? numericValue.toString()
    : numericValue.toFixed(2);
};

const formatAmount = (value) => {
  const numericValue = Number(value ?? 0);
  if (Number.isNaN(numericValue)) return "0.00";
  return numericValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Build the token map for one GRN line.
 * `formatDisplayDate` is injected so callers can share their date helper.
 */
export const buildGrnLineTokenMap = (item, { formatDisplayDate } = {}) => {
  const fmtDate =
    typeof formatDisplayDate === "function"
      ? formatDisplayDate
      : (v) => (v ? String(v) : "-");

  return {
    productName: item?.productName || "-",
    productCode: item?.productCode || "",
    batch: item?.batch || "-",
    expDate: fmtDate(item?.expDate),
    qty: formatQty(item?.qty),
    free: formatQty(item?.free),
    unitPrice: formatAmount(item?.unitPrice),
    costPrice: formatAmount(item?.costPrice),
    sellingPrice: formatAmount(item?.sellingPrice),
    maximumSellingPrice: formatAmount(item?.maximumSellingPrice),
    freightDuty: formatAmount(getFreightDutyCost(item)),
    overseasCost: formatAmount(getOverseasTransportCost(item)),
    localTransportCost: formatAmount(getLocalTransportCost(item)),
    additionalCost: formatAmount(getOverseasTransportCost(item)),
    discountRate: formatAmount(item?.discountRate),
    discountAmount: formatAmount(item?.discountAmount),
    lineTotal: formatAmount(item?.lineTotal),
    profit: formatAmount(item?.profit),
    profitMargin: formatAmount(item?.profitMargin),
    averageCostPrice: formatAmount(item?.averageCostPrice),
    remark: item?.remark || "-",
    status: item?.status || "-",
    warehouseName: item?.warehouseName || "-",
    warehouseCode: item?.warehouseCode || "-",
    purchaseOrderNo: item?.purchaseOrderNo || "-",
    orderedQty: formatQty(item?.orderedQty),
    receivedQty: formatQty(item?.receivedQty),
    poQty: formatQty(item?.poQty),
    sequenceNumber:
      item?.sequenceNumber != null && item?.sequenceNumber !== ""
        ? String(item.sequenceNumber)
        : "",
  };
};

/** User-facing line fields shown in the GRN template editor. */
export const GRN_LINE_FIELD_GROUPS = [
  {
    id: "item",
    title: "Item details",
    fields: [
      {
        token: "productName",
        label: "Item",
        header: "Item",
        numeric: false,
        cellHtml: "{{productName}}<br/>{{productCode}}",
      },
      { token: "productCode", label: "Item Code", header: "Item Code", numeric: false },
      { token: "batch", label: "Batch", header: "Batch", numeric: false },
      { token: "expDate", label: "Exp. Date", header: "Exp. Date", numeric: false },
      { token: "sequenceNumber", label: "Line #", header: "#", numeric: false },
      { token: "remark", label: "Line Remark", header: "Remark", numeric: false },
      { token: "status", label: "Status", header: "Status", numeric: false },
    ],
  },
  {
    id: "qty",
    title: "Quantities",
    fields: [
      { token: "qty", label: "Qty", header: "Qty", numeric: true },
      { token: "free", label: "Free", header: "Free", numeric: true },
      { token: "orderedQty", label: "Ordered Qty", header: "Ordered Qty", numeric: true },
      { token: "receivedQty", label: "Received Qty", header: "Received Qty", numeric: true },
      { token: "poQty", label: "PO Qty", header: "PO Qty", numeric: true },
    ],
  },
  {
    id: "price",
    title: "Prices & totals",
    fields: [
      { token: "unitPrice", label: "Unit Price", header: "Unit Price", numeric: true },
      { token: "costPrice", label: "Cost Price", header: "Cost Price", numeric: true },
      { token: "freightDuty", label: "Freight Duty", header: "Freight Duty", numeric: true },
      {
        token: "overseasCost",
        label: "Overseas Transport",
        header: "Overseas Transport",
        numeric: true,
      },
      {
        token: "localTransportCost",
        label: "Local Transport",
        header: "Local Transport",
        numeric: true,
      },
      { token: "additionalCost", label: "Additional Cost (legacy)", header: "Add. Cost", numeric: true },
      { token: "discountRate", label: "Discount %", header: "Dis%", numeric: true },
      { token: "discountAmount", label: "Discount Amount", header: "Discount", numeric: true },
      { token: "sellingPrice", label: "Selling", header: "Selling", numeric: true },
      {
        token: "maximumSellingPrice",
        label: "Max Selling",
        header: "Max Selling",
        numeric: true,
      },
      { token: "lineTotal", label: "Line Total", header: "Line Total", numeric: true },
      { token: "profit", label: "Profit", header: "Profit", numeric: true },
      { token: "profitMargin", label: "Profit Margin", header: "Profit %", numeric: true },
      {
        token: "averageCostPrice",
        label: "Avg Cost",
        header: "Avg Cost",
        numeric: true,
      },
    ],
  },
  {
    id: "other",
    title: "Warehouse & PO",
    fields: [
      { token: "warehouseName", label: "Warehouse", header: "Warehouse", numeric: false },
      { token: "warehouseCode", label: "Warehouse Code", header: "WH Code", numeric: false },
      { token: "purchaseOrderNo", label: "PO No", header: "PO No", numeric: false },
    ],
  },
];

export const GRN_LINE_FIELDS = GRN_LINE_FIELD_GROUPS.flatMap((group) => group.fields);

export const GRN_LINE_TOKEN_NAMES = GRN_LINE_FIELDS.map((field) => field.token);

const escapeRegExp = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getLineItemsLoopMatch = (html) =>
  html.match(/\{\{#\s*lineItems\s*\}\}([\s\S]*?)\{\{\/\s*lineItems\s*\}\}/i);

/** Tokens currently used inside {{#lineItems}}...{{/lineItems}} only. */
export const getUsedGrnLineTokens = (html) => {
  const used = new Set();
  if (!html) return used;
  const loop = getLineItemsLoopMatch(html);
  const scope = loop?.[1];
  if (!scope) return used;
  GRN_LINE_TOKEN_NAMES.forEach((token) => {
    const pattern = new RegExp(`\\{\\{\\s*${escapeRegExp(token)}\\s*\\}\\}`, "i");
    if (pattern.test(scope)) used.add(token);
  });
  return used;
};

const tokenUsedInLineItemsLoop = (html, token) => {
  const loop = getLineItemsLoopMatch(html);
  if (!loop?.[1]) return false;
  return new RegExp(`\\{\\{\\s*${escapeRegExp(token)}\\s*\\}\\}`, "i").test(
    loop[1]
  );
};

const removeThByHeader = (html, header) =>
  html.replace(
    new RegExp(
      `(<thead[\\s\\S]*?)\\s*<th[^>]*>\\s*${escapeRegExp(header)}\\s*<\\/th>`,
      "i"
    ),
    "$1"
  );

const removeTdFromLineItemsLoop = (html, token, field) => {
  const loop = getLineItemsLoopMatch(html);
  if (!loop?.[1]) return html;
  if (!tokenUsedInLineItemsLoop(html, token)) return html;

  let rowTemplate = loop[1];
  const simpleTd = new RegExp(
    `\\s*<td(?:\\s+class=["']num["'])?>\\s*\\{\\{\\s*${escapeRegExp(
      token
    )}\\s*\\}\\}\\s*<\\/td>`,
    "i"
  );
  rowTemplate = rowTemplate.replace(simpleTd, "");

  if (field.cellHtml) {
    rowTemplate = rowTemplate.replace(
      new RegExp(
        `\\s*<td(?:\\s+class=["']num["'])?>\\s*${escapeRegExp(
          field.cellHtml
        )}\\s*<\\/td>`,
        "i"
      ),
      ""
    );
  }

  if (new RegExp(`\\{\\{\\s*${escapeRegExp(token)}\\s*\\}\\}`, "i").test(rowTemplate)) {
    rowTemplate = rowTemplate.replace(
      new RegExp(
        `\\s*<td(?:\\s+[^>]*)?>[\\s\\S]*?\\{\\{\\s*${escapeRegExp(
          token
        )}\\s*\\}\\}[\\s\\S]*?<\\/td>`,
        "i"
      ),
      ""
    );
  }

  return html.replace(loop[0], `{{#lineItems}}${rowTemplate}{{/lineItems}}`);
};

const buildHeaderCell = (field) =>
  field.numeric
    ? `<th class="num">${field.header}</th>`
    : `<th>${field.header}</th>`;

const buildBodyCell = (field) => {
  const inner = field.cellHtml || `{{${field.token}}}`;
  return field.numeric ? `<td class="num">${inner}</td>` : `<td>${inner}</td>`;
};

/**
 * Add a line column (header + cell) for the given field token.
 * No-op if the token is already present in the line-items loop.
 */
export const addGrnLineColumn = (html, token) => {
  if (!html) return html;
  const field = GRN_LINE_FIELDS.find((item) => item.token === token);
  if (!field) return html;
  if (getUsedGrnLineTokens(html).has(token)) return html;
  if (!/\{\{#\s*lineItems\s*\}\}/i.test(html)) {
    return html;
  }

  let output = html;
  const headerCell = buildHeaderCell(field);
  const bodyCell = buildBodyCell(field);

  // Insert header before closing </tr> of thead.
  if (/<\/thead>/i.test(output)) {
    output = output.replace(
      /(<thead[\s\S]*?<tr[\s\S]*?)(<\/tr>\s*<\/thead>)/i,
      `$1\n          ${headerCell}\n        $2`
    );
  }

  // Insert body cell before closing </tr> inside the line-items loop.
  output = output.replace(
    /(\{\{#\s*lineItems\s*\}\}[\s\S]*?)(<\/tr>\s*\{\{\/\s*lineItems\s*\}\})/i,
    `$1\n          ${bodyCell}\n        $2`
  );

  return output;
};

/**
 * Remove a line column (header by label + body cell by token) from the template.
 */
export const removeGrnLineColumn = (html, token) => {
  if (!html) return html;
  const field = GRN_LINE_FIELDS.find((item) => item.token === token);
  if (!field) return html;
  if (!getUsedGrnLineTokens(html).has(token)) return html;

  let output = removeThByHeader(html, field.header);
  output = removeTdFromLineItemsLoop(output, token, field);
  return output;
};

const GRN_COST_COLUMN_TOKENS = new Set([
  "overseasCost",
  "freightDuty",
  "localTransportCost",
  "additionalCost",
]);

const COST_BLOCK_ANCHOR_BEFORE = [
  "discountRate",
  "discountAmount",
  "sellingPrice",
  "maximumSellingPrice",
  "lineTotal",
  "profit",
  "profitMargin",
  "averageCostPrice",
];

const splitTableCells = (rowHtml, tag) => {
  const re = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi");
  return rowHtml.match(re) || [];
};

const detectCellToken = (cellHtml) => {
  if (!cellHtml) return null;
  for (const field of GRN_LINE_FIELDS) {
    if (field.cellHtml) {
      const needle = field.cellHtml.replace(/\s+/g, " ").trim();
      const hay = cellHtml.replace(/\s+/g, " ").trim();
      if (hay.includes(needle)) return field.token;
    }
  }
  for (const token of GRN_LINE_TOKEN_NAMES) {
    const pattern = new RegExp(`\\{\\{\\s*${escapeRegExp(token)}\\s*\\}\\}`, "i");
    if (pattern.test(cellHtml)) return token;
  }
  return null;
};

/**
 * Place visible cost columns adjacent (in profile order) before Dis% / Selling / Line Total.
 */
export const reorderGrnCostColumns = (html, orderedCostTokens = []) => {
  if (!html || !orderedCostTokens.length) return html;
  const loop = getLineItemsLoopMatch(html);
  if (!loop?.[1]) return html;

  const theadMatch = html.match(/<thead[\s\S]*?<tr[^>]*>([\s\S]*?)<\/tr>[\s\S]*?<\/thead>/i);
  if (!theadMatch) return html;

  const thCells = splitTableCells(theadMatch[1], "th");
  const trMatch = loop[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/i);
  if (!trMatch) return html;
  const tdCells = splitTableCells(trMatch[1], "td");
  if (thCells.length !== tdCells.length || thCells.length === 0) return html;

  const columns = thCells.map((th, index) => ({
    th,
    td: tdCells[index],
    token: detectCellToken(tdCells[index]),
  }));

  const costByToken = new Map();
  const nonCost = [];
  columns.forEach((col) => {
    if (col.token && GRN_COST_COLUMN_TOKENS.has(col.token)) {
      costByToken.set(col.token, col);
    } else {
      nonCost.push(col);
    }
  });

  const orderedCostCols = orderedCostTokens
    .map((token) => costByToken.get(token))
    .filter(Boolean);
  if (!orderedCostCols.length) return html;

  let insertAt = nonCost.findIndex((col) =>
    col.token ? COST_BLOCK_ANCHOR_BEFORE.includes(col.token) : false
  );
  if (insertAt < 0) {
    const afterUnit = nonCost.findIndex((col) => col.token === "unitPrice");
    insertAt = afterUnit >= 0 ? afterUnit + 1 : nonCost.length;
  }

  const nextColumns = [
    ...nonCost.slice(0, insertAt),
    ...orderedCostCols,
    ...nonCost.slice(insertAt),
  ];

  const newThRow = nextColumns.map((col) => col.th).join("\n          ");
  const newTdRow = nextColumns.map((col) => col.td).join("\n          ");

  let output = html.replace(
    /(<thead[\s\S]*?<tr[^>]*>)([\s\S]*?)(<\/tr>[\s\S]*?<\/thead>)/i,
    `$1\n          ${newThRow}\n        $3`
  );

  const newLoopInner = loop[1].replace(
    /(<tr[^>]*>)([\s\S]*?)(<\/tr>)/i,
    `$1\n          ${newTdRow}\n        $3`
  );

  output = output.replace(
    /\{\{#\s*lineItems\s*\}\}[\s\S]*?\{\{\/\s*lineItems\s*\}\}/i,
    (block) => {
      const open = block.match(/^\{\{#\s*lineItems\s*\}\}/i)?.[0] ?? "{{#lineItems}}";
      const close =
        block.match(/\{\{\/\s*lineItems\s*\}\}$/i)?.[0] ?? "{{/lineItems}}";
      return `${open}${newLoopInner}${close}`;
    }
  );

  return output;
};

export const EMPTY_LINE_ITEMS_HTML =
  '<tr><td colspan="99" style="text-align:center;padding:16px;">No items available</td></tr>';

/** Editable default row block matching GRN table columns. */
export const GRN_DEFAULT_LINE_ITEMS_BLOCK = `{{#lineItems}}
        <tr>
          <td>{{productName}}<br/>{{productCode}}</td>
          <td>{{batch}}</td>
          <td>{{expDate}}</td>
          <td class="num">{{qty}}</td>
          <td class="num">{{free}}</td>
          <td class="num">{{unitPrice}}</td>
          <td class="num">{{freightDuty}}</td>
          <td class="num">{{discountRate}}</td>
          <td class="num">{{sellingPrice}}</td>
          <td class="num">{{lineTotal}}</td>
        </tr>
        {{/lineItems}}`;

/**
 * Replace legacy {{lineItemsRows}} with the editable {{#lineItems}} block
 * so users can add/remove columns and tokens in the HTML source.
 */
export const upgradeGrnLineItemsPlaceholder = (html) => {
  if (!html || /\{\{#\s*lineItems\s*\}\}/i.test(html)) {
    return html;
  }
  if (!/\{\{\s*lineItemsRows\s*\}\}/i.test(html)) {
    return html;
  }
  return html.replace(/\{\{\s*lineItemsRows\s*\}\}/gi, GRN_DEFAULT_LINE_ITEMS_BLOCK);
};

/** Legacy fallback when the template still uses {{lineItemsRows}}. */
export const buildLegacyGrnLineItemsRows = (items, { formatDisplayDate } = {}) => {
  if (!items || items.length === 0) {
    return EMPTY_LINE_ITEMS_HTML;
  }

  return items
    .map((item) => {
      const tokens = buildGrnLineTokenMap(item, { formatDisplayDate });
      const productCode = tokens.productCode
        ? `<br/><span style="color:#666;">${escapeHtml(tokens.productCode)}</span>`
        : "";
      return `<tr>
        <td>${escapeHtml(tokens.productName)}${productCode}</td>
        <td>${escapeHtml(tokens.batch)}</td>
        <td>${escapeHtml(tokens.expDate)}</td>
        <td class="num">${escapeHtml(tokens.qty)}</td>
        <td class="num">${escapeHtml(tokens.free)}</td>
        <td class="num">${escapeHtml(tokens.unitPrice)}</td>
        <td class="num">${escapeHtml(tokens.freightDuty)}</td>
        <td class="num">${escapeHtml(tokens.discountRate)}</td>
        <td class="num">${escapeHtml(tokens.sellingPrice)}</td>
        <td class="num">${escapeHtml(tokens.lineTotal)}</td>
      </tr>`;
    })
    .join("\n");
};
