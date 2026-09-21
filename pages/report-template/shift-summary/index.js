import React from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import {
  SHIFT_SUMMARY_CONFIG,
  editorPropsFromConfig,
} from "@/components/ReportTemplate/financeReportTemplateConfigs";

export default function ShiftSummaryTemplatePage() {
  return <ReportTemplateEditor {...editorPropsFromConfig(SHIFT_SUMMARY_CONFIG)} />;
}
