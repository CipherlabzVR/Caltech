import React from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import {
  editorPropsFromConfig,
  SALES_QUOTATION_CONFIG,
} from "@/components/ReportTemplate/salesTemplateConfigs";

export default function SalesQuotationPrintTemplatePage() {
  return <ReportTemplateEditor {...editorPropsFromConfig(SALES_QUOTATION_CONFIG)} />;
}
