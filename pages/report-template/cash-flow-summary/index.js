import React from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import {
  CASH_FLOW_SUMMARY_CONFIG,
  editorPropsFromConfig,
} from "@/components/ReportTemplate/financeReportTemplateConfigs";

export default function CashFlowSummaryTemplatePage() {
  return (
    <ReportTemplateEditor {...editorPropsFromConfig(CASH_FLOW_SUMMARY_CONFIG)} />
  );
}
