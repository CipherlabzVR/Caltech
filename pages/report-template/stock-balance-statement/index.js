import React, { useCallback } from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";

const REPORT_KEY = "STOCKBALANCESTATEMENT";
const TEMPLATE_NAME = "Stock Balance Statement Template";

const SAMPLE_DATA = {
  companyLogo:
    '<div style="width:150px;height:58px;border:1px dashed #c0c0c0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9aa0a6;font:600 12px Arial,sans-serif;">LOGO</div>',
  companyName: "INK FUSION",
  companyAddress: "192, Polwatta road, Pamunwa, Maharagama.",
  companyContact: "0768680890",
  generatedOn: "23-Jul-2026 11:30 AM",
  warehouseName: "Main",
  currentUser: "Admin",
  supplierFilter: "All Suppliers",
  categoryFilter: "All Categories",
  subCategoryFilter: "All Sub Categories",
  productFilter: "All Items",
  totalQty: "3,181",
  totalValue: "7,027,131.05",
};

const SAMPLE_ROWS = `
  <tr>
    <td>HANGZHUO CAIHUI TECHNOLOGY CO.LTD</td>
    <td>SUBLIMATION</td>
    <td>AUDLEY</td>
    <td>PCS</td>
    <td>GRN-000125</td>
    <td>B-001</td>
    <td>31-Dec-2027</td>
    <td class="num">120</td>
    <td class="num">1,250.00</td>
    <td class="num">150,000.00</td>
  </tr>
  <tr>
    <td>HANGZHUO CAIHUI TECHNOLOGY CO.LTD</td>
    <td>SUBLIMATION</td>
    <td>AUDLEY</td>
    <td>PCS</td>
    <td>GRN-000198</td>
    <td>B-014</td>
    <td>15-Mar-2028</td>
    <td class="num">85</td>
    <td class="num">980.50</td>
    <td class="num">83,342.50</td>
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

export default function StockBalanceStatementTemplatePage() {
  return (
    <ReportTemplateEditor
      reportKey={REPORT_KEY}
      templateName={TEMPLATE_NAME}
      pageTitle={TEMPLATE_NAME}
      renderPreview={useCallback(renderPreview, [])}
      breadcrumbs={[
        { label: "Report Template", href: "/report-template/report-template/" },
        { label: "Inventory", href: "/report-template/report-template/?module=inventory" },
        { label: TEMPLATE_NAME },
      ]}
    />
  );
}
