import React from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import {
  PO_NOTES_SUMMARY_CONFIG,
  editorPropsFromConfig,
} from "@/components/ReportTemplate/inventoryReportTemplateConfigs";

export default function PurchaseOrderNotesSummaryTemplatePage() {
  return (
    <ReportTemplateEditor {...editorPropsFromConfig(PO_NOTES_SUMMARY_CONFIG)} />
  );
}
