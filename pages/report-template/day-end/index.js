import React, { useCallback } from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";

const REPORT_KEY = "DAYEND";
const TEMPLATE_NAME = "Day End Print Template";

const SAMPLE_DATA = {
  companyLogo:
    '<div style="width:150px;height:58px;border:1px dashed #c0c0c0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9aa0a6;font:600 12px Arial,sans-serif;">LOGO</div>',
  companyName: "Your Company (Pvt) Ltd",
  companyAddress: "No. 123, Main Street, Colombo 03",
  companyContact: "+94 11 234 5678 / info@company.com",
  documentNo: "0000000159",
  endDate: "2026-07-01",
  warehouseName: "Main",
  userName: "Deshitha",
  remark: "01/07/2026",
  totalInvoice: "135,250.00",
  totalSalesReturnAmount: "0.00",
  totalCashInvoice: "120,000.00",
  totalCashReturnInvoice: "0.00",
  canceledInvoice: "0.00",
  totalOutstanding: "135,250.00",
  totalReceipt: "147,250.00",
  cashVariance: "0.00",
  varianceSummary: "Balanced",
};

const SAMPLE_SHIFT_ROWS = `
  <tr><td>SH-000201</td><td class="num">45,500.00</td><td class="num">1,000.00</td><td class="num">500.00</td></tr>
  <tr><td>SH-000202</td><td class="num">52,750.00</td><td class="num">0.00</td><td class="num">0.00</td></tr>
  <tr><td>SH-000203</td><td class="num">37,000.00</td><td class="num">500.00</td><td class="num">250.00</td></tr>
`;

const renderPreview = (html) => {
  if (!html) return "";
  let output = html.replace(/\{\{\s*shiftRows\s*\}\}/gi, SAMPLE_SHIFT_ROWS);
  Object.entries(SAMPLE_DATA).forEach(([token, value]) => {
    output = output.replace(new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, "gi"), value ?? "");
  });
  return output;
};

export default function DayEndPrintTemplatePage() {
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
