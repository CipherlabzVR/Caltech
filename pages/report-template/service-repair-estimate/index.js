import React from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import {
  REPAIR_ESTIMATE_CONFIG,
  editorPropsFromConfig,
} from "@/components/ReportTemplate/serviceTemplateConfigs";

export default function ServiceRepairEstimateTemplatePage() {
  return <ReportTemplateEditor {...editorPropsFromConfig(REPAIR_ESTIMATE_CONFIG)} />;
}
