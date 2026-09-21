import React, { useCallback } from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import { STOCK_MOVEMENT_META } from "@/components/ReportTemplate/inventoryReportTemplateConfigs";

const renderPreview = (html) => {
  if (!html) return "";
  let output = html.replace(
    /\{\{\s*lineItemsRows\s*\}\}/gi,
    STOCK_MOVEMENT_META.sampleRows
  );
  Object.entries(STOCK_MOVEMENT_META.sampleData).forEach(([token, value]) => {
    output = output.replace(
      new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, "gi"),
      value ?? ""
    );
  });
  return output;
};

export default function StockMovementReportTemplatePage() {
  return (
    <ReportTemplateEditor
      reportKey={STOCK_MOVEMENT_META.reportKey}
      templateName={STOCK_MOVEMENT_META.templateName}
      pageTitle={STOCK_MOVEMENT_META.templateName}
      renderPreview={useCallback(renderPreview, [])}
      enableOrientation
      breadcrumbs={STOCK_MOVEMENT_META.breadcrumbs}
    />
  );
}
