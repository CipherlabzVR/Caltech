import React from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import {
  WORK_AUTH_CONFIG,
  editorPropsFromConfig,
} from "@/components/ReportTemplate/serviceTemplateConfigs";

export default function ServiceWorkAuthorizationTemplatePage() {
  return <ReportTemplateEditor {...editorPropsFromConfig(WORK_AUTH_CONFIG)} />;
}
