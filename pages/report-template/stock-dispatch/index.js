import React from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import { STOCK_DISPATCH_CONFIG } from "@/components/ReportTemplate/inventoryTemplateConfigs";

export default function StockDispatchPrintTemplatePage() {
  return (
    <ReportTemplateEditor
      reportKey={STOCK_DISPATCH_CONFIG.reportKey}
      templateName={STOCK_DISPATCH_CONFIG.templateName}
      pageTitle={STOCK_DISPATCH_CONFIG.templateName}
      sampleData={STOCK_DISPATCH_CONFIG.sampleData}
      sampleLineItems={STOCK_DISPATCH_CONFIG.sampleLineItems}
      buildLineTokenMap={STOCK_DISPATCH_CONFIG.buildLineTokenMap}
      fieldGroups={STOCK_DISPATCH_CONFIG.fieldGroups}
      defaultLineItemsBlock={STOCK_DISPATCH_CONFIG.defaultLineItemsBlock}
      breadcrumbs={[
        { label: "Screens Template", href: "/report-template/screens-template/" },
        { label: "Inventory", href: "/report-template/screens-template/?module=inventory" },
        { label: STOCK_DISPATCH_CONFIG.templateName },
      ]}
    />
  );
}
