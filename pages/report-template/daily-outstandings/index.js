import React from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import {
  DAILY_OUTSTANDING_CONFIG,
  editorPropsFromConfig,
} from "@/components/ReportTemplate/salesTemplateConfigs";

export default function DailyOutstandingsPrintTemplatePage() {
  return <ReportTemplateEditor {...editorPropsFromConfig(DAILY_OUTSTANDING_CONFIG)} />;
}
