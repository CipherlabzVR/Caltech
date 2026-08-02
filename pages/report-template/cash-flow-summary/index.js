import React, { useCallback } from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";

const REPORT_KEY = "CASHFLOWSUMMARY";
const TEMPLATE_NAME = "Cash Flow Summary Template";

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
  cashFlowTypeFilter: "All Cash Flow Types",
  cashTypeFilter: "All",
  totalRows: "2",
  totalAmount: "15,000.00",
};

const SAMPLE_ROWS = `
  <tr>
    <td>03-Jul-2026</td>
    <td>SHF-0001</td>
    <td>Petty Cash</td>
    <td>Cash In</td>
    <td class="num">10,000.00</td>
    <td>Opening float</td>
    <td>Approved</td>
  </tr>
  <tr>
    <td>12-Jul-2026</td>
    <td>SHF-0002</td>
    <td>Expense</td>
    <td>Cash Out</td>
    <td class="num">5,000.00</td>
    <td>Stationary</td>
    <td>Approved</td>
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

export default function CashFlowSummaryTemplatePage() {
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
