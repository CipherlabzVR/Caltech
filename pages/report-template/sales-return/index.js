import React, { useCallback } from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";

const REPORT_KEY = "SALESRETURN";
const TEMPLATE_NAME = "Sales Return Print Template";

const SAMPLE_DATA = {
  companyLogo:
    '<div style="width:150px;height:58px;border:1px dashed #c0c0c0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9aa0a6;font:600 12px Arial,sans-serif;">LOGO</div>',
  companyName: "Your Company (Pvt) Ltd",
  companyAddress: "No. 123, Main Street, Colombo 03",
  companyContact: "+94 11 234 5678 / info@company.com",
  documentNo: "0000000006",
  salesReturnDate: "2026-01-22",
  customerName: "MADURA",
  customerAddress: "No. 45, Galle Road, Colombo",
  invoiceNo: "0000000707",
  paymentType: "Credit",
  salesPerson: "Kasun Silva",
  warehouseName: "Main",
  totalInvoiceAmount: "23,000.00",
  outstandingAmount: "11,500.00",
  returnAmount: "11,500.00",
};

const SAMPLE_ROWS = `
  <tr><td>1</td><td>PRD-001</td><td>Product A</td><td class="num">2</td><td class="num">1</td><td class="num">5,750.00</td><td class="num">5,750.00</td><td>Damaged</td></tr>
  <tr><td>2</td><td>PRD-002</td><td>Product B</td><td class="num">3</td><td class="num">1</td><td class="num">5,750.00</td><td class="num">5,750.00</td><td>Wrong item</td></tr>
`;

const renderPreview = (html) => {
  if (!html) return "";
  let output = html.replace(/\{\{\s*lineItemsRows\s*\}\}/gi, SAMPLE_ROWS);
  Object.entries(SAMPLE_DATA).forEach(([token, value]) => {
    output = output.replace(new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, "gi"), value ?? "");
  });
  return output;
};

export default function SalesReturnPrintTemplatePage() {
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
