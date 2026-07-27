import React, { useCallback } from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";

const REPORT_KEY = "SHIPMENTINVOICE";
const TEMPLATE_NAME = "Shipment Invoice Print Template";

const SAMPLE_DATA = {
  companyLogo:
    '<div style="width:150px;height:58px;border:1px dashed #c0c0c0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9aa0a6;font:600 12px Arial,sans-serif;">LOGO</div>',
  companyName: "Your Company (Pvt) Ltd",
  companyAddress: "No. 123, Main Street, Colombo 03",
  companyContact: "+94 11 234 5678 / info@company.com",
  documentNo: "SHI-000012",
  invoiceDate: "2026-07-08",
  supplierName: "Global Freight Ltd",
  referenceNo: "REF-2026-001",
  remark: "Shipment charges for July",
  totalLineAmount: "45,000.00",
  totalAdditionalCost: "5,500.00",
  grandTotal: "50,500.00",
};

const SAMPLE_LINE_ROWS = `
  <tr><td>1</td><td>Electronics</td><td>Mobile phones batch</td><td class="num">10</td><td class="num">3,500.00</td><td class="num">35,000.00</td></tr>
  <tr><td>2</td><td>Accessories</td><td>Phone cases</td><td class="num">50</td><td class="num">200.00</td><td class="num">10,000.00</td></tr>
  <tr><td colspan="5" style="text-align:right;font-weight:700;">Line Subtotal</td><td class="num" style="font-weight:700;">45,000.00</td></tr>
`;

const SAMPLE_ADDITIONAL_COST_ROWS = `
  <tr><td>1</td><td>Freight</td><td>Sea freight charges</td><td class="num">4,000.00</td></tr>
  <tr><td>2</td><td>Customs</td><td>Clearance fees</td><td class="num">1,500.00</td></tr>
  <tr><td colspan="3" style="text-align:right;font-weight:700;">Additional Costs Total</td><td class="num" style="font-weight:700;">5,500.00</td></tr>
`;

const renderPreview = (html) => {
  if (!html) return "";
  let output = html
    .replace(/\{\{\s*lineItemsRows\s*\}\}/gi, SAMPLE_LINE_ROWS)
    .replace(/\{\{\s*additionalCostRows\s*\}\}/gi, SAMPLE_ADDITIONAL_COST_ROWS);
  Object.entries(SAMPLE_DATA).forEach(([token, value]) => {
    output = output.replace(new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, "gi"), value ?? "");
  });
  return output;
};

export default function ShipmentInvoicePrintTemplatePage() {
  return (
    <ReportTemplateEditor
      reportKey={REPORT_KEY}
      templateName={TEMPLATE_NAME}
      pageTitle={TEMPLATE_NAME}
      renderPreview={useCallback(renderPreview, [])}
      breadcrumbs={[
        { label: "Screens Template", href: "/report-template/screens-template/" },
        { label: "Sales", href: "/report-template/screens-template/?module=sales" },
        { label: TEMPLATE_NAME },
      ]}
    />
  );
}
