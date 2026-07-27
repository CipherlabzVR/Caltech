import React, { useCallback } from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";

const REPORT_KEY = "SERVICEINVOICE";
const TEMPLATE_NAME = "Service Invoice Print Template";

const SAMPLE_DATA = {
  companyLogo:
    '<div style="width:150px;height:58px;border:1px dashed #c0c0c0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9aa0a6;font:600 12px Arial,sans-serif;">LOGO</div>',
  companyName: "Your Company (Pvt) Ltd",
  companyAddress: "No. 123, Main Street, Colombo 03",
  companyContact: "+94 11 234 5678 / info@company.com",
  documentNo: "SI-000045",
  issueDate: "30-Jun-2026",
  jobCardNo: "JC-000125",
  status: "Pending",
  customerName: "Nimal Perera",
  contactNo: "+94 77 123 4567",
  productName: "Dell Latitude 5420",
  serialNumber: "SN-AX99201",
  issueReported: "Device does not power on.",
  serviceType: "Paid Repair",
  warrantyDays: "90",
  warrantyUntil: "28-Sep-2026",
  subtotal: "12,500.00",
  warrantyWaiver: "0.00",
  discount: "500.00",
  netTotal: "12,000.00",
  paidAmount: "0.00",
  balanceDue: "12,000.00",
  paymentMethod: "Cash",
  technicianName: "Ruwan Fernando",
  remark: "Repair completed and tested.",
};

const SAMPLE_ROWS = `
  <tr><td>Charging Board · Part</td><td class="num">1</td><td class="num">9,000.00</td><td class="num">9,000.00</td></tr>
  <tr><td>Repair Service · Labour</td><td class="num">1</td><td class="num">3,500.00</td><td class="num">3,000.00</td></tr>
`;

const renderPreview = (html) => {
  if (!html) return "";
  let output = html.replace(/\{\{\s*lineItemsRows\s*\}\}/gi, SAMPLE_ROWS);
  Object.entries(SAMPLE_DATA).forEach(([token, value]) => {
    output = output.replace(new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, "gi"), value ?? "");
  });
  return output;
};

export default function ServiceInvoiceTemplatePage() {
  return (
    <ReportTemplateEditor
      reportKey={REPORT_KEY}
      templateName={TEMPLATE_NAME}
      pageTitle={TEMPLATE_NAME}
      renderPreview={useCallback(renderPreview, [])}
      breadcrumbs={[
        { label: "Screens Template", href: "/report-template/screens-template/" },
        { label: "Service Management", href: "/report-template/screens-template/?module=service" },
        { label: TEMPLATE_NAME },
      ]}
    />
  );
}
