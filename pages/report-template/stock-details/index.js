import React, { useCallback } from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import { STOCK_DETAILS_CONFIG } from "@/components/ReportTemplate/inventoryTemplateConfigs";

// Stock Details list print uses nested batch tables in {{lineItemsRows}},
// so column picker / {{#lineItems}} upgrade is disabled — orientation still applies.
const renderPreview = (html) => {
  if (!html) return "";
  const sampleRows = STOCK_DETAILS_CONFIG.sampleLineItems
    .map(
      (r) =>
        `<tr class="item-header"><td>${r.rowNum}</td><td>${r.itemCode}</td><td>${r.itemName}</td><td>${r.categoryName}</td><td>${r.subCategoryName}</td><td>${r.supplierName}</td><td>${r.uomName}</td><td class="num">${r.stockLevel}</td></tr>`
    )
    .join("\n");
  let output = html.replace(/\{\{\s*lineItemsRows\s*\}\}/gi, sampleRows);
  Object.entries(STOCK_DETAILS_CONFIG.sampleData).forEach(([token, value]) => {
    output = output.replace(new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, "gi"), value ?? "");
  });
  return output;
};

export default function StockDetailsPrintTemplatePage() {
  return (
    <ReportTemplateEditor
      reportKey={STOCK_DETAILS_CONFIG.reportKey}
      templateName={STOCK_DETAILS_CONFIG.templateName}
      pageTitle={STOCK_DETAILS_CONFIG.templateName}
      renderPreview={useCallback(renderPreview, [])}
      enableOrientation
      breadcrumbs={[
        { label: "Screens Template", href: "/report-template/screens-template/" },
        { label: "Inventory", href: "/report-template/screens-template/?module=inventory" },
        { label: STOCK_DETAILS_CONFIG.templateName },
      ]}
    />
  );
}
