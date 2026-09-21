import React from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import {
  CUSTOMER_PAYMENT_SUMMARY_CONFIG,
  editorPropsFromConfig,
} from "@/components/ReportTemplate/salesReportTemplateConfigs";

export default function CustomerPaymentSummaryTemplatePage() {
  return (
    <ReportTemplateEditor
      {...editorPropsFromConfig(CUSTOMER_PAYMENT_SUMMARY_CONFIG)}
    />
  );
}
