import React, { useCallback } from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";

const REPORT_KEY = "CUSTOMERPAYMENTSUMMARY";
const TEMPLATE_NAME = "Customer Payment Summary Template";

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
  customerFilter: "All Customers",
  invoiceFilter: "All Invoices",
  paymentTypeFilter: "All Payment Types",
  totalReceipts: "2",
  totalPaid: "55,000.00",
};

const SAMPLE_ROWS = `
  <tr>
    <td>03-Jul-2026</td>
    <td>RCT-000088</td>
    <td>John Doe</td>
    <td>INV-000210</td>
    <td>Cash</td>
    <td class="num">30,000.00</td>
    <td>REF-01</td>
    <td>—</td>
  </tr>
  <tr>
    <td>12-Jul-2026</td>
    <td>RCT-000102</td>
    <td>Jane Smith</td>
    <td>INV-000225</td>
    <td>Bank Transfer</td>
    <td class="num">25,000.00</td>
    <td>—</td>
    <td>Partial</td>
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

export default function CustomerPaymentSummaryTemplatePage() {
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
