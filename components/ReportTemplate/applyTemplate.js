// Shared helpers for rendering ReportTemplate HTML with live document data.

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
 * Replace {{token}} placeholders in a template.
 *  - {{lineItemsRows}} is injected verbatim (already-built <tr> HTML).
 *  - {{additionalCostRows}} and {{lineDetailsRows}} are injected verbatim from tokenMap.
 *  - {{shiftRows}} is injected verbatim from tokenMap.
 *  - {{companyLogo}} is injected verbatim (it contains an <img> tag).
 *  - all other tokens are HTML-escaped before substitution.
 * A print-friendly @page style is appended into <head> so popups print clean.
 */
export const applyTemplate = (templateHtml, tokenMap = {}, rowsHtml = "") => {
  if (!templateHtml) {
    return "";
  }

  let output = templateHtml.replace(/\{\{\s*lineItemsRows\s*\}\}/gi, rowsHtml);
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

  const printStyle =
    "<style>@page{size:A4;margin:0;}@media print{html,body{margin:0!important;}}</style>";
  if (/<\/head>/i.test(output)) {
    output = output.replace(/<\/head>/i, `${printStyle}</head>`);
  } else {
    output = `${printStyle}${output}`;
  }

  return output;
};
