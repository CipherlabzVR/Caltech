import React from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";
import { GRN_RETURN_CONFIG } from "@/components/ReportTemplate/inventoryTemplateConfigs";

export default function GoodsReturnNotePrintTemplatePage() {
  return (
    <ReportTemplateEditor
      reportKey={GRN_RETURN_CONFIG.reportKey}
      templateName={GRN_RETURN_CONFIG.templateName}
      pageTitle={GRN_RETURN_CONFIG.templateName}
      sampleData={GRN_RETURN_CONFIG.sampleData}
      sampleLineItems={GRN_RETURN_CONFIG.sampleLineItems}
      buildLineTokenMap={GRN_RETURN_CONFIG.buildLineTokenMap}
      fieldGroups={GRN_RETURN_CONFIG.fieldGroups}
      defaultLineItemsBlock={GRN_RETURN_CONFIG.defaultLineItemsBlock}
      breadcrumbs={[
        { label: "Screens Template", href: "/report-template/screens-template/" },
        { label: "Inventory", href: "/report-template/screens-template/?module=inventory" },
        { label: GRN_RETURN_CONFIG.templateName },
      ]}
    />
  );
}
