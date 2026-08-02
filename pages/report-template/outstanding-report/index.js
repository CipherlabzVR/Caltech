import React, { useCallback } from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";

const REPORT_KEY = "OUTSTANDINGREPORT";
const TEMPLATE_NAME = "Outstanding Report Template";

const SAMPLE_DATA = {
  companyLogo:
    '<div style="width:150px;height:58px;border:1px dashed #c0c0c0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9aa0a6;font:600 12px Arial,sans-serif;">LOGO</div>',
  companyName: "INK FUSION",
  companyAddress: "192, Polwatta road, Pamunwa, Maharagama.",
  companyContact: "0768680890",
  generatedOn: "24-Jul-2026 12:00 PM",
  warehouseName: "Main",
  currentUser: "Admin",
  customerFilter: "All Customers",
  totalInvoices: "2",
  totalInvoiceAmount: "120,000.00",
  totalCredit: "5,000.00",
  totalOutstanding: "70,000.00",
};

const SAMPLE_ROWS = `
  <tr>
    <td>05-Jul-2026</td>
    <td>INV-000218</td>
    <td>John Doe</td>
    <td class="num">50,000.00</td>
    <td class="num">0.00</td>
    <td class="num">40,000.00</td>
    <td>Sales Rep A</td>
    <td>—</td>
  </tr>
  <tr>
    <td>15-Jul-2026</td>
    <td>INV-000240</td>
    <td>Jane Smith</td>
    <td class="num">70,000.00</td>
    <td class="num">5,000.00</td>
    <td class="num">30,000.00</td>
    <td>Sales Rep B</td>
    <td>Follow up</td>
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

export default function OutstandingReportTemplatePage() {
  return (
    <ReportTemplateEditor
      reportKey={REPORT_KEY}
      templateName={TEMPLATE_NAME}
      pageTitle={TEMPLATE_NAME}
      renderPreview={useCallback(renderPreview, [])}
      breadcrumbs={[
        { label: "Report Template", href: "/report-template/report-template/" },
        { label: "Sales", href: "/report-template/report-template/?module=sales" },
        { label: TEMPLATE_NAME },
      ]}
    />
  );
}
