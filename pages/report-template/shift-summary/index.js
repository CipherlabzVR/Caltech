import React, { useCallback } from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";

const REPORT_KEY = "SHIFTSUMMARY";
const TEMPLATE_NAME = "Shift Summary Template";

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
  userFilter: "All Users",
  terminalFilter: "All Terminals",
  totalShifts: "2",
  totalInvoice: "150,000.00",
  totalReceipt: "120,000.00",
};

const SAMPLE_ROWS = `
  <tr>
    <td>SHF-0001</td>
    <td>01-Jul-2026</td>
    <td>01-Jul-2026</td>
    <td>John Doe</td>
    <td>T01</td>
    <td class="num">10,000.00</td>
    <td class="num">25,000.00</td>
    <td class="num">80,000.00</td>
    <td class="num">70,000.00</td>
    <td>Closed</td>
  </tr>
  <tr>
    <td>SHF-0002</td>
    <td>10-Jul-2026</td>
    <td>10-Jul-2026</td>
    <td>Jane Smith</td>
    <td>T02</td>
    <td class="num">5,000.00</td>
    <td class="num">12,000.00</td>
    <td class="num">70,000.00</td>
    <td class="num">50,000.00</td>
    <td>Closed</td>
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

export default function ShiftSummaryTemplatePage() {
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
