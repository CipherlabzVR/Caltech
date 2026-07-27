import React, { useCallback } from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";

const REPORT_KEY = "STOCKADJUSTMENT";
const TEMPLATE_NAME = "Stock Adjustment Print Template";

const SAMPLE_DATA = {
  companyLogo:
    '<div style="width:150px;height:58px;border:1px dashed #c0c0c0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9aa0a6;font:600 12px Arial,sans-serif;">LOGO</div>',
  companyName: "Your Company (Pvt) Ltd",
  companyAddress: "No. 123, Main Street, Colombo 03",
  companyContact: "+94 11 234 5678 / info@company.com",
  documentNo: "0000000018",
  adjustmentDate: "2026-07-01",
  warehouseName: "Main",
  userName: "Deshitha",
  supplierName: "HANGZHUO CAIHUI TECHNOLOGY CO.LTD",
  remark: "By Deshitha",
  productCode: "0000000042",
  productName: "5U FILTERS",
  previousQuantity: "1.01",
  updatedQuantity: "1",
  quantityDifference: "-0.01",
};

const SAMPLE_ROWS = `
  <tr>
    <td>2026-07-01</td>
    <td>HANGZHUO CAIHUI TECHNOLOGY CO.LTD</td>
    <td>0000000042</td>
    <td>5U FILTERS</td>
    <td class="num">1.01</td>
    <td class="num">1</td>
    <td>By Deshitha</td>
  </tr>
`;

const renderPreview = (html) => {
  if (!html) return "";
  let output = html.replace(/\{\{\s*lineItemsRows\s*\}\}/gi, SAMPLE_ROWS);
  Object.entries(SAMPLE_DATA).forEach(([token, value]) => {
    output = output.replace(new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, "gi"), value ?? "");
  });
  return output;
};

export default function StockAdjustmentPrintTemplatePage() {
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
