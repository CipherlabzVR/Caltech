import React, { useCallback } from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";

const REPORT_KEY = "SHIPMENT";
const TEMPLATE_NAME = "Shipment Print Template";

const SAMPLE_DATA = {
  companyLogo:
    '<div style="width:150px;height:58px;border:1px dashed #c0c0c0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9aa0a6;font:600 12px Arial,sans-serif;">LOGO</div>',
  companyName: "Your Company (Pvt) Ltd",
  companyAddress: "No. 123, Main Street, Colombo 03",
  companyContact: "+94 11 234 5678 / info@company.com",
  documentNo: "SH-000078",
  shipmentDate: "30-Jun-2026",
  supplierName: "Global Supplies Ltd",
  warehouseName: "Main Warehouse",
  referenceNo: "REF-00125",
  remark: "Received in good condition",
  grossTotal: "125,500.00",
};

const SAMPLE_ROWS = `
  <tr><td>PO-000045</td><td>A4 Copy Paper 80gsm</td><td class="num">100.00</td><td class="num">100.00</td><td class="num">850.00</td><td class="num">1,200.00</td><td class="num">500.00</td><td class="num">86,500.00</td></tr>
  <tr><td>PO-000046</td><td>Blue Ball Pen</td><td class="num">200.00</td><td class="num">200.00</td><td class="num">45.00</td><td class="num">800.00</td><td class="num">300.00</td><td class="num">39,000.00</td></tr>
`;

const renderPreview = (html) => {
  if (!html) return "";
  let output = html.replace(/\{\{\s*lineItemsRows\s*\}\}/gi, SAMPLE_ROWS);
  Object.entries(SAMPLE_DATA).forEach(([token, value]) => {
    output = output.replace(new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, "gi"), value ?? "");
  });
  return output;
};

export default function ShipmentPrintTemplatePage() {
  return (
    <ReportTemplateEditor
      reportKey={REPORT_KEY}
      templateName={TEMPLATE_NAME}
      pageTitle={TEMPLATE_NAME}
      renderPreview={useCallback(renderPreview, [])}
      breadcrumbs={[
        { label: "Screens Template", href: "/report-template/screens-template/" },
        { label: "Inventory", href: "/report-template/screens-template/?module=inventory" },
        { label: TEMPLATE_NAME },
      ]}
    />
  );
}
