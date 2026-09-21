import React from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import {
  editorPropsFromConfig,
  INVOICE_CONFIG,
} from "@/components/ReportTemplate/salesTemplateConfigs";

export default function InvoicePrintTemplatePage() {
  return <ReportTemplateEditor {...editorPropsFromConfig(INVOICE_CONFIG)} />;
}
