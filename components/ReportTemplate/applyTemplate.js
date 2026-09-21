// Shared helpers for rendering ReportTemplate HTML with live document data.

import {
  getPageSizeCss,
  PAGE_ORIENTATION,
  parsePageOrientation,
} from "./pageOrientation";

export const escapeHtml = (value) => {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

/**
 * Expand {{#lineItems}}...{{/lineItems}} blocks.
 * Each entry in `lineTokenMaps` is a flat { tokenName: value } map for one row.
 * Tokens listed in `rawKeys` are injected without HTML escaping.
 * Unknown {{tokens}} inside the row template are cleared.
 */
export const expandLineItemsLoop = (
  html,
  lineTokenMaps = [],
  { emptyHtml = "", rawKeys = [] } = {}
) => {
  if (!html || !/\{\{#\s*lineItems\s*\}\}/i.test(html)) {
    return html;
  }

  const rawKeySet = new Set(rawKeys);

  return html.replace(
    /\{\{#\s*lineItems\s*\}\}([\s\S]*?)\{\{\/\s*lineItems\s*\}\}/gi,
    (_match, rowTemplate) => {
      if (!lineTokenMaps.length) {
        return emptyHtml;
      }

      return lineTokenMaps
        .map((tokens) => {
          let row = rowTemplate;
          Object.entries(tokens || {}).forEach(([key, value]) => {
            const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "gi");
            const out = rawKeySet.has(key)
              ? value ?? ""
              : escapeHtml(value ?? "");
            row = row.replace(pattern, out);
          });
          // Leave unresolved {{tokens}} so header-level tokens can still apply later.
          return row;
        })
        .join("\n");
    }
  );
};

/**
 * Replace {{token}} placeholders in a template.
 *  - {{#lineItems}}...{{/lineItems}} is expanded from options.lineTokenMaps when present.
 *  - {{lineItemsRows}} is injected verbatim (already-built <tr> HTML) — legacy fallback.
 *  - {{additionalCostRows}} and {{lineDetailsRows}} are injected verbatim from tokenMap.
 *  - {{shiftRows}} is injected verbatim from tokenMap.
 *  - {{companyLogo}} is injected verbatim (it contains an <img> tag).
 *  - all other tokens are HTML-escaped before substitution.
 * A print-friendly @page style is appended into <head> so popups print clean.
 *
 * @param {object} [options]
 * @param {Array<object>} [options.lineTokenMaps]
 * @param {string} [options.emptyLineItemsHtml]
 * @param {string[]} [options.rawLineKeys]
 * @param {'portrait'|'landscape'} [options.pageOrientation]
 */
export const applyTemplate = (
  templateHtml,
  tokenMap = {},
  rowsHtml = "",
  options = {}
) => {
  if (!templateHtml) {
    return "";
  }

  let output = expandLineItemsLoop(templateHtml, options.lineTokenMaps || [], {
    emptyHtml: options.emptyLineItemsHtml || "",
    rawKeys: options.rawLineKeys || [],
  });

  output = output.replace(/\{\{\s*lineItemsRows\s*\}\}/gi, rowsHtml);
  output = output.replace(/\{\{\s*lineDetailsRows\s*\}\}/gi, tokenMap.lineDetailsRows || "");
  output = output.replace(/\{\{\s*additionalCostRows\s*\}\}/gi, tokenMap.additionalCostRows || "");
  output = output.replace(/\{\{\s*shiftRows\s*\}\}/gi, tokenMap.shiftRows || "");
  output = output.replace(/\{\{\s*startDenominationRows\s*\}\}/gi, tokenMap.startDenominationRows || "");
  output = output.replace(/\{\{\s*endDenominationRows\s*\}\}/gi, tokenMap.endDenominationRows || "");
  output = output.replace(/\{\{\s*cashInOutRows\s*\}\}/gi, tokenMap.cashInOutRows || "");
  output = output.replace(/\{\{\s*stockLineRows\s*\}\}/gi, tokenMap.stockLineRows || "");
  output = output.replace(/\{\{\s*companyLogo\s*\}\}/gi, tokenMap.companyLogo || "");

  Object.entries(tokenMap).forEach(([key, value]) => {
    if (
      key === "companyLogo" ||
      key === "lineDetailsRows" ||
      key === "additionalCostRows" ||
      key === "shiftRows" ||
      key === "startDenominationRows" ||
      key === "endDenominationRows" ||
      key === "cashInOutRows" ||
      key === "stockLineRows"
    ) {
      return;
    }
    const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "gi");
    output = output.replace(pattern, escapeHtml(value));
  });

  const orientation =
    options.pageOrientation === PAGE_ORIENTATION.LANDSCAPE ||
    options.pageOrientation === PAGE_ORIENTATION.PORTRAIT
      ? options.pageOrientation
      : parsePageOrientation(templateHtml);
  const pageSize = getPageSizeCss(orientation);
  const printStyle = `<style>@page{size:${pageSize};margin:0;}@media print{html,body{margin:0!important;}}</style>`;
  if (/<\/head>/i.test(output)) {
    output = output.replace(/<\/head>/i, `${printStyle}</head>`);
  } else {
    output = `${printStyle}${output}`;
  }

  return output;
};
