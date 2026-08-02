import React, { useCallback } from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";

const REPORT_KEY = "COMPANYWISEPROFIT";
const TEMPLATE_NAME = "Company Wise Profit Template";

const SAMPLE_DATA = {
  companyLogo:
    '<div style="width:150px;height:58px;border:1px dashed #c0c0c0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9aa0a6;font:600 12px Arial,sans-serif;">LOGO</div>',
  companyName: "INK FUSION",
  companyAddress: "192, Polwatta road, Pamunwa, Maharagama.",
  companyContact: "0768680890",
  generatedOn: "24-Jul-2026 12:00 PM",
  warehouseName: "Main",
  currentUser: "Admin",
  fromDate: "01-Jul-2026",
  toDate: "24-Jul-2026",
  supplierFilter: "ABC Suppliers",
  salesPersonFilter: "All Sales Persons",
  totalProducts: "2",
  totalSales: "150,000.00",
  totalCost: "90,000.00",
  totalProfit: "60,000.00",
};

const SAMPLE_ROWS = `
  <tr>
    <td>ITM-01</td>
    <td>Product A</td>
    <td class="num">10.00</td>
    <td class="num">80,000.00</td>
    <td class="num">50,000.00</td>
    <td class="num">30,000.00</td>
  </tr>
  <tr>
    <td>ITM-02</td>
    <td>Product B</td>
    <td class="num">5.00</td>
    <td class="num">70,000.00</td>
    <td class="num">40,000.00</td>
    <td class="num">30,000.00</td>
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

export default function CompanyWiseProfitTemplatePage() {
  return (
    <ReportTemplateEditor
      reportKey={REPORT_KEY}
      templateName={TEMPLATE_NAME}
      pageTitle={TEMPLATE_NAME}
      renderPreview={useCallback(renderPreview, [])}
      breadcrumbs={[
        { label: "Report Template", href: "/report-template/report-template/" },
        { label: "Finance", href: "/report-template/report-template/?module=finance" },
        { label: TEMPLATE_NAME },
      ]}
    />
  );
}
