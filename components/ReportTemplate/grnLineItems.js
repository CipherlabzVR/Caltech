import { escapeHtml } from "./applyTemplate";

/** Per-unit freight duty: prefer persisted AdditionalCost, else derive from line math. */
export const getFreightDutyCost = (item) => {
  const stored = Number(item?.additionalCost);
  if (Number.isFinite(stored) && Math.abs(stored) > 0.0001) {
    return stored;
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
    additionalCost: formatAmount(item?.additionalCost),
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
      { token: "additionalCost", label: "Additional Cost", header: "Add. Cost", numeric: true },
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

/** Tokens currently used inside {{#lineItems}}...{{/lineItems}}. */
export const getUsedGrnLineTokens = (html) => {
  const used = new Set();
  if (!html) return used;
  const loop = html.match(/\{\{#\s*lineItems\s*\}\}([\s\S]*?)\{\{\/\s*lineItems\s*\}\}/i);
  const scope = loop?.[1] || html;
  GRN_LINE_TOKEN_NAMES.forEach((token) => {
    const pattern = new RegExp(`\\{\\{\\s*${escapeRegExp(token)}\\s*\\}\\}`, "i");
    if (pattern.test(scope)) used.add(token);
  });
  return used;
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

  let output = html;
  output = output.replace(
    new RegExp(
      `\\s*<th[^>]*>\\s*${escapeRegExp(field.header)}\\s*<\\/th>`,
      "i"
    ),
    ""
  );

  if (field.cellHtml) {
    output = output.replace(
      new RegExp(
        `\\s*<td(?:\\s+class=["']num["'])?>\\s*${escapeRegExp(
          field.cellHtml
        )}\\s*<\\/td>`,
        "i"
      ),
      ""
    );
  }

  output = output.replace(
    new RegExp(
      `\\s*<td(?:\\s+class=["']num["'])?>\\s*\\{\\{\\s*${escapeRegExp(
        token
      )}\\s*\\}\\}\\s*<\\/td>`,
      "i"
    ),
    ""
  );

  // Custom cell markup that still contains this token.
  if (getUsedGrnLineTokens(output).has(token)) {
    output = output.replace(
      new RegExp(
        `\\s*<td(?:\\s+[^>]*)?>[\\s\\S]*?\\{\\{\\s*${escapeRegExp(
          token
        )}\\s*\\}\\}[\\s\\S]*?<\\/td>`,
        "i"
      ),
      ""
    );
  }

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
