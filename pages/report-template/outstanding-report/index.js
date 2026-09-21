import React from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import {
  OUTSTANDING_REPORT_CONFIG,
  editorPropsFromConfig,
} from "@/components/ReportTemplate/salesReportTemplateConfigs";

export default function OutstandingReportTemplatePage() {
  return (
    <ReportTemplateEditor {...editorPropsFromConfig(OUTSTANDING_REPORT_CONFIG)} />
  );
}
