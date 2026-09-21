import React from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import { PO_CONFIG } from "@/components/ReportTemplate/inventoryTemplateConfigs";

export default function PurchaseOrderPrintTemplatePage() {
  return (
    <ReportTemplateEditor
      reportKey={PO_CONFIG.reportKey}
      templateName={PO_CONFIG.templateName}
      pageTitle={PO_CONFIG.templateName}
      sampleData={PO_CONFIG.sampleData}
      sampleLineItems={PO_CONFIG.sampleLineItems}
      buildLineTokenMap={PO_CONFIG.buildLineTokenMap}
      fieldGroups={PO_CONFIG.fieldGroups}
      defaultLineItemsBlock={PO_CONFIG.defaultLineItemsBlock}
      breadcrumbs={[
        { label: "Screens Template", href: "/report-template/screens-template/" },
        { label: "Inventory", href: "/report-template/screens-template/?module=inventory" },
        { label: PO_CONFIG.templateName },
      ]}
    />
  );
}
