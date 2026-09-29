import {
  addGrnLineColumn,
  removeGrnLineColumn,
  reorderGrnCostColumns,
} from "./grnLineItems";

export const GRN_COST_PROFILE = {
  DIRECT: "direct",
  LOCAL_PO: "localPo",
  IMPORT_PO: "importPo",
};

const PURCHASING_ORDER_TYPE = {
  LOCAL: 1,
  IMPORT: 2,
};

const LINE_COST_TOKENS = [
  "overseasCost",
  "freightDuty",
  "localTransportCost",
];

const LEGACY_OVERSEAS_TOKEN = "additionalCost";

const FOOTER_COST_ROWS = [
  { token: "overseasTotal", label: "Overseas Transport Total" },
  { token: "freightDutyTotal", label: "Freight Duty Total" },
  { token: "localTransportTotal", label: "Local Transport Total" },
];

export const GRN_COST_LAYOUT = {
  [GRN_COST_PROFILE.DIRECT]: {
    line: ["freightDuty", "localTransportCost"],
    footer: [
      { token: "freightDutyTotal", label: "Freight Duty Total" },
      { token: "localTransportTotal", label: "Local Transport Total" },
    ],
  },
  [GRN_COST_PROFILE.LOCAL_PO]: {
    line: ["localTransportCost"],
    footer: [{ token: "localTransportTotal", label: "Local Transport Total" }],
  },
  [GRN_COST_PROFILE.IMPORT_PO]: {
    line: ["overseasCost", "freightDuty", "localTransportCost"],
    footer: FOOTER_COST_ROWS,
  },
};

const normalizePurchasingOrderType = (typeRaw) => {
  if (typeRaw == null || typeRaw === "") return null;
  if (typeof typeRaw === "string") {
    const trimmed = typeRaw.trim();
    if (/^local$/i.test(trimmed)) return PURCHASING_ORDER_TYPE.LOCAL;
    if (/^import$/i.test(trimmed)) return PURCHASING_ORDER_TYPE.IMPORT;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return Number(typeRaw);
};

/** Classify GRN header for cost column visibility on print. */
export const getGrnCostProfile = (grnHeader) => {
  if (!grnHeader) {
    return GRN_COST_PROFILE.DIRECT;
  }

  const poInvolved =
    grnHeader.isPurchaseOrderInvolved ?? grnHeader.IsPurchaseOrderInvolved;
  const poNo = String(
    grnHeader.purchaseOrderNo ?? grnHeader.PurchaseOrderNo ?? ""
  ).trim();

  if (!poInvolved && !poNo) {
    return GRN_COST_PROFILE.DIRECT;
  }

  const type = normalizePurchasingOrderType(
    grnHeader.purchasingOrderType ?? grnHeader.PurchasingOrderType
  );

  if (type === PURCHASING_ORDER_TYPE.LOCAL) {
    return GRN_COST_PROFILE.LOCAL_PO;
  }
  if (type === PURCHASING_ORDER_TYPE.IMPORT) {
    return GRN_COST_PROFILE.IMPORT_PO;
  }

  return GRN_COST_PROFILE.IMPORT_PO;
};

const escapeRegExp = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Insert footer total row before merchandise Total if token missing. */
export const ensureTotalRow = (html, { token, label }) => {
  if (!html || !token) return html;
  const tokenPattern = new RegExp(
    `\\{\\{\\s*${escapeRegExp(token)}\\s*\\}\\}`,
    "i"
  );
  if (tokenPattern.test(html) || new RegExp(escapeRegExp(label), "i").test(html)) {
    return html;
  }
  const rowHtml = `<div class="row"><span>${label}</span><span>{{${token}}}</span></div>`;
  return html.replace(
    /(<div class=["']totals["']>\s*)(<div class=["']row["']>\s*<span>\s*Total\s*<\/span>)/i,
    `$1${rowHtml}\n      $2`
  );
};

/** Remove a cost total row inside `.totals` only (avoid matching `.meta .row`). */
export const removeTotalRow = (html, token) => {
  if (!html || !token) return html;
  const tokenPattern = new RegExp(
    `\\{\\{\\s*${escapeRegExp(token)}\\s*\\}\\}`,
    "i"
  );
  if (!tokenPattern.test(html)) return html;

  const rowPattern = new RegExp(
    `\\s*<div class=["']row["'][^>]*>[\\s\\S]*?\\{\\{\\s*${escapeRegExp(
      token
    )}\\s*\\}\\}[\\s\\S]*?<\\/div>`,
    "i"
  );

  const totalsBlock =
    /(<div class=["']totals["']>)([\s\S]*?)(<\/div>\s*(?=<div class=["']footer|<\/div>\s*<\/body))/i;

  return html.replace(totalsBlock, (full, open, inner, close) => {
    if (!tokenPattern.test(inner)) return full;
    return open + inner.replace(rowPattern, "") + close;
  });
};

/**
 * Shape stored GRN template HTML for a cost profile (line columns + footer totals).
 */
export const applyGrnCostLayout = (html, profile) => {
  if (!html) return html;

  const config =
    GRN_COST_LAYOUT[profile] ?? GRN_COST_LAYOUT[GRN_COST_PROFILE.IMPORT_PO];
  const visibleLine = new Set(config.line);
  const visibleFooterTokens = new Set(config.footer.map((row) => row.token));

  let output = html;

  for (const token of LINE_COST_TOKENS) {
    if (visibleLine.has(token)) {
      output = addGrnLineColumn(output, token);
    } else {
      output = removeGrnLineColumn(output, token);
    }
  }

  output = removeGrnLineColumn(output, LEGACY_OVERSEAS_TOKEN);

  for (const row of FOOTER_COST_ROWS) {
    if (visibleFooterTokens.has(row.token)) {
      output = ensureTotalRow(output, row);
    } else {
      output = removeTotalRow(output, row.token);
    }
  }

  output = reorderGrnCostColumns(output, config.line);

  return output;
};
