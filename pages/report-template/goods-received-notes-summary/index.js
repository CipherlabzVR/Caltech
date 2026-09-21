import React from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import {
  GRN_NOTES_SUMMARY_CONFIG,
  editorPropsFromConfig,
} from "@/components/ReportTemplate/inventoryReportTemplateConfigs";

export default function GoodsReceivedNotesSummaryTemplatePage() {
  return (
    <ReportTemplateEditor {...editorPropsFromConfig(GRN_NOTES_SUMMARY_CONFIG)} />
  );
}
