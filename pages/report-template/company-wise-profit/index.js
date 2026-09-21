import React from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import {
  COMPANY_WISE_PROFIT_CONFIG,
  editorPropsFromConfig,
} from "@/components/ReportTemplate/financeReportTemplateConfigs";

export default function CompanyWiseProfitTemplatePage() {
  return (
    <ReportTemplateEditor
      {...editorPropsFromConfig(COMPANY_WISE_PROFIT_CONFIG)}
    />
  );
}
