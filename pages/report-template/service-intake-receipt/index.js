import React, { useCallback } from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";

const REPORT_KEY = "SERVICEINTAKERECEIPT";
const TEMPLATE_NAME = "Service Intake Receipt Print Template";

const SAMPLE_DATA = {
  companyLogo:
    '<div style="width:150px;height:58px;border:1px dashed #c0c0c0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9aa0a6;font:600 12px Arial,sans-serif;">LOGO</div>',
  companyName: "Your Company (Pvt) Ltd",
  companyAddress: "No. 123, Main Street, Colombo 03",
  companyContact: "+94 11 234 5678 / info@company.com",
  documentNo: "JC-000125",
  receivedDate: "30-Jun-2026 03:25:10PM",
  customerName: "Nimal Perera",
  contactNo: "+94 77 123 4567",
  serviceType: "Paid Repair",
  priority: "Normal",
  deviceLine: "Laptop · Dell · Latitude 5420",
  productLine: "Dell Latitude 5420 · Serial: SN-AX99201",
  reportedFault: "Device does not power on.",
  physicalCondition: "Minor scratches on lid.",
};

const SAMPLE_ROWS = `
  <tr><td>1</td><td>Charger</td></tr>
  <tr><td>2</td><td>Carry Bag</td></tr>
`;

const renderPreview = (html) => {
  if (!html) return "";
  let output = html.replace(/\{\{\s*lineItemsRows\s*\}\}/gi, SAMPLE_ROWS);
  Object.entries(SAMPLE_DATA).forEach(([token, value]) => {
    output = output.replace(new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, "gi"), value ?? "");
  });
  return output;
};

export default function ServiceIntakeReceiptTemplatePage() {
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
