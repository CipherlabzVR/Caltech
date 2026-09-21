import React from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import {
  PROFITABILITY_REPORT_CONFIG,
  editorPropsFromConfig,
} from "@/components/ReportTemplate/financeReportTemplateConfigs";

export default function ProfitabilityReportTemplatePage() {
  return (
    <ReportTemplateEditor
      {...editorPropsFromConfig(PROFITABILITY_REPORT_CONFIG)}
    />
  );
}
