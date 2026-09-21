import React from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import {
  INTAKE_RECEIPT_CONFIG,
  editorPropsFromConfig,
} from "@/components/ReportTemplate/serviceTemplateConfigs";

export default function ServiceIntakeReceiptTemplatePage() {
  return <ReportTemplateEditor {...editorPropsFromConfig(INTAKE_RECEIPT_CONFIG)} />;
}
