import React, { useCallback } from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";

const REPORT_KEY = "STOCKMOVEMENTREPORT";
const TEMPLATE_NAME = "Stock Movement Report Template";

const SAMPLE_DATA = {
  companyLogo:
    '<div style="width:150px;height:58px;border:1px dashed #c0c0c0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9aa0a6;font:600 12px Arial,sans-serif;">LOGO</div>',
  companyName: "INK FUSION",
  companyAddress: "192, Polwatta road, Pamunwa, Maharagama.",
  companyContact: "0768680890",
  generatedOn: "23-Jul-2026 03:30 PM",
  warehouseName: "Main",
  currentUser: "Admin",
  fromDate: "01-Jul-2026",
  toDate: "23-Jul-2026",
  supplierFilter: "All Suppliers",
  categoryFilter: "All Categories",
  subCategoryFilter: "All Sub Categories",
  productFilter: "All Items",
  totalQtyIn: "135.00",
  totalQtyOut: "15.00",
};

const SAMPLE_ROWS = `
  <tr class="item-header"><td colspan="9">0000000100 - XP 600 BRAND NEW PRINT HEAD</td></tr>
  <tr class="stock-mark"><td>Start Stock</td><td>—</td><td>—</td><td>0000000100</td><td>XP 600 BRAND NEW PRINT HEAD</td><td>—</td><td class="num">0.00</td><td class="num">0.00</td><td class="num">100.00</td></tr>
  <tr><td>01-Jul-2026</td><td>GRN-000125</td><td>GoodReceivedNote</td><td>0000000100</td><td>XP 600 BRAND NEW PRINT HEAD</td><td>B-001</td><td class="num">120.00</td><td class="num">0.00</td><td class="num">220.00</td></tr>
  <tr><td>05-Jul-2026</td><td>INV-000482</td><td>Invoice</td><td>0000000100</td><td>XP 600 BRAND NEW PRINT HEAD</td><td>B-001</td><td class="num">0.00</td><td class="num">15.00</td><td class="num">205.00</td></tr>
  <tr class="stock-mark"><td>End Stock</td><td>—</td><td>—</td><td>0000000100</td><td>XP 600 BRAND NEW PRINT HEAD</td><td>—</td><td class="num">0.00</td><td class="num">0.00</td><td class="num">205.00</td></tr>
`;

const renderPreview = (html) => {
  if (!html) return "";
  let output = html.replace(/\{\{\s*lineItemsRows\s*\}\}/gi, SAMPLE_ROWS);
  Object.entries(SAMPLE_DATA).forEach(([token, value]) => {
    output = output.replace(new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, "gi"), value ?? "");
  });
  return output;
};

export default function StockMovementReportTemplatePage() {
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
