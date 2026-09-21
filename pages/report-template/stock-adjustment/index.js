import React from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import { STOCK_ADJUSTMENT_CONFIG } from "@/components/ReportTemplate/inventoryTemplateConfigs";

export default function StockAdjustmentPrintTemplatePage() {
  return (
    <ReportTemplateEditor
      reportKey={STOCK_ADJUSTMENT_CONFIG.reportKey}
      templateName={STOCK_ADJUSTMENT_CONFIG.templateName}
      pageTitle={STOCK_ADJUSTMENT_CONFIG.templateName}
      sampleData={STOCK_ADJUSTMENT_CONFIG.sampleData}
      sampleLineItems={STOCK_ADJUSTMENT_CONFIG.sampleLineItems}
      buildLineTokenMap={STOCK_ADJUSTMENT_CONFIG.buildLineTokenMap}
      fieldGroups={STOCK_ADJUSTMENT_CONFIG.fieldGroups}
      defaultLineItemsBlock={STOCK_ADJUSTMENT_CONFIG.defaultLineItemsBlock}
      breadcrumbs={[
        { label: "Screens Template", href: "/report-template/screens-template/" },
        { label: "Inventory", href: "/report-template/screens-template/?module=inventory" },
        { label: STOCK_ADJUSTMENT_CONFIG.templateName },
      ]}
    />
  );
}
