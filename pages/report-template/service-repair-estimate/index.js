import React, { useCallback } from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";

const REPORT_KEY = "SERVICEREPAIRESTIMATE";
const TEMPLATE_NAME = "Service Repair Estimate Print Template";

const SAMPLE_DATA = {
  companyLogo:
    '<div style="width:150px;height:58px;border:1px dashed #c0c0c0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9aa0a6;font:600 12px Arial,sans-serif;">LOGO</div>',
  companyName: "Your Company (Pvt) Ltd",
  companyAddress: "No. 123, Main Street, Colombo 03",
  companyContact: "+94 11 234 5678 / info@company.com",
  documentNo: "JC-000125",
  billDate: "30-Jun-2026 03:25:10PM",
  customerName: "Nimal Perera",
  contactNo: "+94 77 123 4567",
  serviceType: "Paid Repair",
  technician: "Ruwan Fernando",
  estimatedReady: "04-Jul-2026",
  approvedBy: "Kasun Silva",
  deviceDetails:
    "Type: Laptop\nBrand: Dell\nModel: Latitude 5420\nSerial: SN-AX99201\nCondition: Minor scratches",
  reportedFault: "Device does not power on.",
  diagnosis: "Faulty charging board, requires replacement.",
  grossTotal: "12,500.00",
  totalDiscount: "500.00",
  customerPayable: "12,000.00",
};

const SAMPLE_ROWS = `
  <tr><td>1</td><td>Part</td><td>Charging Board</td><td class="num">1</td><td class="num">9,000.00</td><td class="num">9,000.00</td></tr>
  <tr><td>2</td><td>Labour</td><td>Repair Service</td><td class="num">1</td><td class="num">3,500.00</td><td class="num">3,000.00</td></tr>
`;

const renderPreview = (html) => {
  if (!html) return "";
  let output = html.replace(/\{\{\s*lineItemsRows\s*\}\}/gi, SAMPLE_ROWS);
  Object.entries(SAMPLE_DATA).forEach(([token, value]) => {
    output = output.replace(new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, "gi"), value ?? "");
  });
  return output;
};

export default function ServiceRepairEstimateTemplatePage() {
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
