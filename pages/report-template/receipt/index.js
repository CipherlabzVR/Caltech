import React from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import {
  editorPropsFromConfig,
  RECEIPT_CONFIG,
} from "@/components/ReportTemplate/salesTemplateConfigs";

export default function ReceiptPrintTemplatePage() {
  return <ReportTemplateEditor {...editorPropsFromConfig(RECEIPT_CONFIG)} />;
}
