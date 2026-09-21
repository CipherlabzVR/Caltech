import React from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import {
  SHIPMENT_SUMMARY_CONFIG,
  editorPropsFromConfig,
} from "@/components/ReportTemplate/inventoryReportTemplateConfigs";

export default function ShipmentSummaryTemplatePage() {
  return (
    <ReportTemplateEditor {...editorPropsFromConfig(SHIPMENT_SUMMARY_CONFIG)} />
  );
}
