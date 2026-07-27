import React, { useCallback } from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";

const REPORT_KEY = "STOCKDETAILSITEM";
const TEMPLATE_NAME = "Stock Details Item Print Template";

const SAMPLE_DATA = {
  companyLogo:
    '<div style="width:150px;height:58px;border:1px dashed #c0c0c0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9aa0a6;font:600 12px Arial,sans-serif;">LOGO</div>',
  companyName: "Your Company (Pvt) Ltd",
  companyAddress: "No. 123, Main Street, Colombo 03",
  companyContact: "+94 11 234 5678 / info@company.com",
  generatedOn: "08-Jul-2026 04:52 PM",
  warehouseName: "Main",
  itemCode: "0000000100",
  itemName: "XP 600 BRAND NEW PRINT HEAD",
  categoryName: "SUBLIMATION",
  subCategoryName: "AUDLEY",
  supplierName: "HANGZHUO CAIHUI TECHNOLOGY CO.LTD",
  uomName: "PCS",
  totalStockLevel: "2",
};

const SAMPLE_STOCK_ROWS = `
  <tr><td>1</td><td>B-001</td><td>2027-12-31</td><td class="num">1</td><td class="num">1,500.00</td><td>SUBLIMATION</td><td>AUDLEY</td><td>PCS</td><td class="num">580.00</td></tr>
  <tr><td>2</td><td>B-002</td><td>2028-06-30</td><td class="num">1</td><td class="num">1,500.00</td><td>SUBLIMATION</td><td>AUDLEY</td><td>PCS</td><td class="num">580.00</td></tr>
`;

const renderPreview = (html) => {
  if (!html) return "";
  let output = html.replace(/\{\{\s*stockLineRows\s*\}\}/gi, SAMPLE_STOCK_ROWS);
  Object.entries(SAMPLE_DATA).forEach(([token, value]) => {
    output = output.replace(new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, "gi"), value ?? "");
  });
  return output;
};

export default function StockDetailsItemPrintTemplatePage() {
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
