import React from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import {
  editorPropsFromConfig,
  SALES_RETURN_CONFIG,
} from "@/components/ReportTemplate/salesTemplateConfigs";

export default function SalesReturnPrintTemplatePage() {
  return <ReportTemplateEditor {...editorPropsFromConfig(SALES_RETURN_CONFIG)} />;
}
