import React from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import {
  CASH_BOOK_SUMMARY_CONFIG,
  editorPropsFromConfig,
} from "@/components/ReportTemplate/financeReportTemplateConfigs";

export default function CashBookSummaryTemplatePage() {
  return (
    <ReportTemplateEditor {...editorPropsFromConfig(CASH_BOOK_SUMMARY_CONFIG)} />
  );
}
