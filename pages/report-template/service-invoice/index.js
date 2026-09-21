import React, { useCallback } from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import { SERVICE_INVOICE_META } from "@/components/ReportTemplate/serviceTemplateConfigs";

const renderPreview = (html) => {
  if (!html) return "";
  let output = html.replace(
    /\{\{\s*lineItemsRows\s*\}\}/gi,
    SERVICE_INVOICE_META.sampleRows
  );
  Object.entries(SERVICE_INVOICE_META.sampleData).forEach(([token, value]) => {
    output = output.replace(
      new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, "gi"),
      value ?? ""
    );
  });
  return output;
};

export default function ServiceInvoiceTemplatePage() {
  return (
    <ReportTemplateEditor
      reportKey={SERVICE_INVOICE_META.reportKey}
      templateName={SERVICE_INVOICE_META.templateName}
      pageTitle={SERVICE_INVOICE_META.templateName}
      renderPreview={useCallback(renderPreview, [])}
      enableOrientation
      breadcrumbs={SERVICE_INVOICE_META.breadcrumbs}
    />
  );
}
