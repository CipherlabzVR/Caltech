import React from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import {
  DAILY_DEPOSIT_CONFIG,
  editorPropsFromConfig,
} from "@/components/ReportTemplate/salesTemplateConfigs";

export default function DailyDepositPrintTemplatePage() {
  return <ReportTemplateEditor {...editorPropsFromConfig(DAILY_DEPOSIT_CONFIG)} />;
}
