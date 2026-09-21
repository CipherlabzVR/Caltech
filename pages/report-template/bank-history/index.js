import React from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import {
  BANK_HISTORY_CONFIG,
  editorPropsFromConfig,
} from "@/components/ReportTemplate/financeReportTemplateConfigs";

export default function BankHistoryTemplatePage() {
  return <ReportTemplateEditor {...editorPropsFromConfig(BANK_HISTORY_CONFIG)} />;
}
