import React from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import {
  JOB_CARD_CONFIG,
  editorPropsFromConfig,
} from "@/components/ReportTemplate/serviceTemplateConfigs";

export default function ServiceJobCardTemplatePage() {
  return <ReportTemplateEditor {...editorPropsFromConfig(JOB_CARD_CONFIG)} />;
}
