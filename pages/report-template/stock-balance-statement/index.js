import React from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import {
  STOCK_BALANCE_CONFIG,
  editorPropsFromConfig,
} from "@/components/ReportTemplate/inventoryReportTemplateConfigs";

export default function StockBalanceStatementTemplatePage() {
  return <ReportTemplateEditor {...editorPropsFromConfig(STOCK_BALANCE_CONFIG)} />;
}
