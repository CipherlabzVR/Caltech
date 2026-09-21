import React from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import {
  editorPropsFromConfig,
  SALES_ORDER_CONFIG,
} from "@/components/ReportTemplate/salesTemplateConfigs";

export default function SalesOrderPrintTemplatePage() {
  return <ReportTemplateEditor {...editorPropsFromConfig(SALES_ORDER_CONFIG)} />;
}
