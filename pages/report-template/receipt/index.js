import React, { useCallback } from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";

const REPORT_KEY = "RECEIPT";
const TEMPLATE_NAME = "Receipts Print Template";

const SAMPLE_DATA = {
  companyLogo:
    '<div style="width:150px;height:58px;border:1px dashed #c0c0c0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9aa0a6;font:600 12px Arial,sans-serif;">LOGO</div>',
  companyName: "Your Company (Pvt) Ltd",
  companyAddress: "No. 123, Main Street, Colombo 03",
  companyContact: "+94 11 234 5678 / info@company.com",
  documentNo: "RCP-000045",
  receiptDate: "30-Jun-2026",
  customerName: "Kamal Fernando",
  customerAddress: "No. 45, Lake Road, Kandy",
  customerContact: "+94 77 123 4567",
  paymentType: "Cash",
  salesPerson: "Nimal Silva",
  warehouseName: "Main Warehouse",
  referenceNumber: "REF-001",
  remark: "Payment received",
  totalPaidAmount: "25,000.00",
  paidAmount: "25,000.00",
  outstandingAmount: "5,000.00",
  chequeNo: "-",
  chequeDate: "-",
};

const SAMPLE_ROWS = `
  <tr><td>INV-001234</td><td>28-Jun-2026</td><td class="num">30,000.00</td><td class="num">25,000.00</td></tr>
  <tr><td>INV-001235</td><td>29-Jun-2026</td><td class="num">10,000.00</td><td class="num">0.00</td></tr>
`;

const renderPreview = (html) => {
  if (!html) return "";
  let output = html.replace(/\{\{\s*lineItemsRows\s*\}\}/gi, SAMPLE_ROWS);
  Object.entries(SAMPLE_DATA).forEach(([token, value]) => {
    output = output.replace(new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, "gi"), value ?? "");
  });
  return output;
};

export default function ReceiptPrintTemplatePage() {
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
