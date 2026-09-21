import React from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import { STOCK_DETAILS_ITEM_CONFIG } from "@/components/ReportTemplate/inventoryTemplateConfigs";

export default function StockDetailsItemPrintTemplatePage() {
  return (
    <ReportTemplateEditor
      reportKey={STOCK_DETAILS_ITEM_CONFIG.reportKey}
      templateName={STOCK_DETAILS_ITEM_CONFIG.templateName}
      pageTitle={STOCK_DETAILS_ITEM_CONFIG.templateName}
      sampleData={STOCK_DETAILS_ITEM_CONFIG.sampleData}
      sampleLineItems={STOCK_DETAILS_ITEM_CONFIG.sampleLineItems}
      buildLineTokenMap={STOCK_DETAILS_ITEM_CONFIG.buildLineTokenMap}
      fieldGroups={STOCK_DETAILS_ITEM_CONFIG.fieldGroups}
      defaultLineItemsBlock={STOCK_DETAILS_ITEM_CONFIG.defaultLineItemsBlock}
      upgradePlaceholders={STOCK_DETAILS_ITEM_CONFIG.upgradePlaceholders}
      breadcrumbs={[
        { label: "Screens Template", href: "/report-template/screens-template/" },
        { label: "Inventory", href: "/report-template/screens-template/?module=inventory" },
        { label: STOCK_DETAILS_ITEM_CONFIG.templateName },
      ]}
    />
  );
}
