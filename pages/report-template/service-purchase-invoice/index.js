import React, { useCallback } from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import { PURCHASE_INVOICE_META } from "@/components/ReportTemplate/serviceTemplateConfigs";

const renderPreview = (html) => {
  if (!html) return "";
  let output = html
    .replace(/\{\{\s*lineItemsRows\s*\}\}/gi, PURCHASE_INVOICE_META.sampleRows)
    .replace(
      /\{\{\s*lineDetailsRows\s*\}\}/gi,
      PURCHASE_INVOICE_META.sampleLineDetails
    );
  Object.entries(PURCHASE_INVOICE_META.sampleData).forEach(([token, value]) => {
    output = output.replace(
      new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, "gi"),
      value ?? ""
    );
  });
  return output;
};

export default function ServicePurchaseInvoiceTemplatePage() {
  return (
    <ReportTemplateEditor
      reportKey={PURCHASE_INVOICE_META.reportKey}
      templateName={PURCHASE_INVOICE_META.templateName}
      pageTitle={PURCHASE_INVOICE_META.templateName}
      renderPreview={useCallback(renderPreview, [])}
      enableOrientation
      breadcrumbs={PURCHASE_INVOICE_META.breadcrumbs}
    />
  );
}
