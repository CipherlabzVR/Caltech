import React from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import {
  SALES_SUMMARY_CONFIG,
  editorPropsFromConfig,
} from "@/components/ReportTemplate/salesReportTemplateConfigs";

export default function SalesSummaryTemplatePage() {
  return <ReportTemplateEditor {...editorPropsFromConfig(SALES_SUMMARY_CONFIG)} />;
}
