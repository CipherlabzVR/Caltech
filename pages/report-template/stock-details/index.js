import React, { useCallback } from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";

const REPORT_KEY = "STOCKDETAILS";
const TEMPLATE_NAME = "Stock Details Print Template";

const SAMPLE_DATA = {
  companyLogo:
    '<div style="width:150px;height:58px;border:1px dashed #c0c0c0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9aa0a6;font:600 12px Arial,sans-serif;">LOGO</div>',
  companyName: "Your Company (Pvt) Ltd",
  companyAddress: "No. 123, Main Street, Colombo 03",
  companyContact: "+94 11 234 5678 / info@company.com",
  generatedOn: "08-Jul-2026 04:30 PM",
  warehouseName: "Main",
  searchFilter: "All",
  sortBy: "Item Code: Low → High",
  totalItems: "5",
  totalStockQuantity: "9",
};

const SAMPLE_ROWS = `
  <tr class="item-header"><td>1</td><td>0000000100</td><td>XP 600 BRAND NEW PRINT HEAD</td><td>SUBLIMATION</td><td>AUDLEY</td><td>HANGZHUO CAIHUI TECHNOLOGY CO.LTD</td><td>PCS</td><td class="num">2</td></tr>
  <tr><td colspan="8" class="nested-wrap"><table class="nested-table"><thead><tr><th>#</th><th>Batch No</th><th class="num">Stock Balance</th></tr></thead><tbody><tr><td>1</td><td>B-001</td><td class="num">2</td></tr></tbody></table></td></tr>
  <tr class="item-header"><td>2</td><td>0000000104</td><td>INK CERCULATION MANIFOLD (XP600)</td><td>SUBLIMATION</td><td>AUDLEY</td><td>HANGZHUO CAIHUI TECHNOLOGY CO.LTD</td><td>PCS</td><td class="num">2</td></tr>
`;

const renderPreview = (html) => {
  if (!html) return "";
  let output = html.replace(/\{\{\s*lineItemsRows\s*\}\}/gi, SAMPLE_ROWS);
  Object.entries(SAMPLE_DATA).forEach(([token, value]) => {
    output = output.replace(new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, "gi"), value ?? "");
  });
  return output;
};

export default function StockDetailsPrintTemplatePage() {
  return (
    <ReportTemplateEditor
      reportKey={REPORT_KEY}
      templateName={TEMPLATE_NAME}
      pageTitle={TEMPLATE_NAME}
      renderPreview={useCallback(renderPreview, [])}
      breadcrumbs={[
        { label: "Screens Template", href: "/report-template/screens-template/" },
        { label: "Inventory", href: "/report-template/screens-template/?module=inventory" },
        { label: TEMPLATE_NAME },
      ]}
    />
  );
}
