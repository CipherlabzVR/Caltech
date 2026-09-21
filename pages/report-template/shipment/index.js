import React from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import { SHIPMENT_CONFIG } from "@/components/ReportTemplate/inventoryTemplateConfigs";

export default function ShipmentPrintTemplatePage() {
  return (
    <ReportTemplateEditor
      reportKey={SHIPMENT_CONFIG.reportKey}
      templateName={SHIPMENT_CONFIG.templateName}
      pageTitle={SHIPMENT_CONFIG.templateName}
      sampleData={SHIPMENT_CONFIG.sampleData}
      sampleLineItems={SHIPMENT_CONFIG.sampleLineItems}
      buildLineTokenMap={SHIPMENT_CONFIG.buildLineTokenMap}
      fieldGroups={SHIPMENT_CONFIG.fieldGroups}
      defaultLineItemsBlock={SHIPMENT_CONFIG.defaultLineItemsBlock}
      breadcrumbs={[
        { label: "Screens Template", href: "/report-template/screens-template/" },
        { label: "Inventory", href: "/report-template/screens-template/?module=inventory" },
        { label: SHIPMENT_CONFIG.templateName },
      ]}
    />
  );
}
