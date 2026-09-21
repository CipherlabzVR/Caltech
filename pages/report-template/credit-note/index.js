import React from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import {
  CREDIT_NOTE_CONFIG,
  editorPropsFromConfig,
} from "@/components/ReportTemplate/salesTemplateConfigs";

export default function CreditNotePrintTemplatePage() {
  return <ReportTemplateEditor {...editorPropsFromConfig(CREDIT_NOTE_CONFIG)} />;
}
