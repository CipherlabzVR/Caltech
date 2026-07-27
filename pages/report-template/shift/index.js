import React, { useCallback } from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";

const REPORT_KEY = "SHIFT";
const TEMPLATE_NAME = "Shift Print Template";

const SAMPLE_DATA = {
  companyLogo:
    '<div style="width:150px;height:58px;border:1px dashed #c0c0c0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9aa0a6;font:600 12px Arial,sans-serif;">LOGO</div>',
  companyName: "Your Company (Pvt) Ltd",
  companyAddress: "No. 123, Main Street, Colombo 03",
  companyContact: "+94 11 234 5678 / info@company.com",
  documentNo: "SH-000125",
  terminalCode: "T01",
  startDate: "30-Jun-2026 08:30 AM",
  endDate: "30-Jun-2026 06:15 PM",
  status: "Ended",
  warehouseName: "Main Warehouse",
  createdUser: "Nimal Silva",
  totalStartAmount: "10,000.00",
  totalEndAmount: "85,500.00",
  totalInvoice: "72,000.00",
  totalSalesReturnAmount: "2,500.00",
  totalCashInvoice: "65,000.00",
  totalCashSalesReturnAmount: "1,500.00",
  totalCanceledInvoice: "500.00",
  totalReceipt: "8,000.00",
  totalCashIn: "1,000.00",
  totalCashOut: "500.00",
  cashVariance: "0.00",
  varianceSummary: "Balanced",
};

const SAMPLE_START_DENOMINATION_ROWS = `
  <tr><td>5,000</td><td class="num">1</td><td class="num">5,000.00</td></tr>
  <tr><td>1,000</td><td class="num">3</td><td class="num">3,000.00</td></tr>
  <tr><td>500</td><td class="num">4</td><td class="num">2,000.00</td></tr>
`;

const SAMPLE_END_DENOMINATION_ROWS = `
  <tr><td>5,000</td><td class="num">15</td><td class="num">75,000.00</td></tr>
  <tr><td>1,000</td><td class="num">8</td><td class="num">8,000.00</td></tr>
  <tr><td>500</td><td class="num">5</td><td class="num">2,500.00</td></tr>
`;

const SAMPLE_CASH_IN_OUT_ROWS = `
  <tr><td>Cash In</td><td>Petty cash top-up</td><td class="num">1,000.00</td></tr>
  <tr><td>Cash Out</td><td>Office supplies</td><td class="num">500.00</td></tr>
`;

const renderPreview = (html) => {
  if (!html) return "";
  let output = html
    .replace(/\{\{\s*startDenominationRows\s*\}\}/gi, SAMPLE_START_DENOMINATION_ROWS)
    .replace(/\{\{\s*endDenominationRows\s*\}\}/gi, SAMPLE_END_DENOMINATION_ROWS)
    .replace(/\{\{\s*cashInOutRows\s*\}\}/gi, SAMPLE_CASH_IN_OUT_ROWS);
  Object.entries(SAMPLE_DATA).forEach(([token, value]) => {
    output = output.replace(new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, "gi"), value ?? "");
  });
  return output;
};

export default function ShiftPrintTemplatePage() {
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
