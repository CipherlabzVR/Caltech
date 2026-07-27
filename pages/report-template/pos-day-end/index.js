import React, { useCallback } from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";

const REPORT_KEY = "POSDAYEND";
const TEMPLATE_NAME = "POS Day End Print Template";

const SAMPLE_DATA = {
  companyLogo:
    '<div style="width:150px;height:58px;border:1px dashed #c0c0c0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9aa0a6;font:600 12px Arial,sans-serif;">LOGO</div>',
  companyName: "Your Company (Pvt) Ltd",
  companyAddress: "No. 123, Main Street, Colombo 03",
  companyContact: "+94 11 234 5678 / info@company.com",
  documentNo: "0000000001",
  endDate: "2026-07-08",
  warehouseName: "Main",
  userName: "SuperAdmin Admin",
  remark: "End of day closing",
  totalInvoice: "0.00",
  totalCashInvoice: "0.00",
};

const SAMPLE_SHIFT_ROWS = `
  <tr><td>0000000001</td><td class="num">10,000.00</td><td class="num">0.00</td><td class="num">0.00</td></tr>
`;

const renderPreview = (html) => {
  if (!html) return "";
  let output = html.replace(/\{\{\s*shiftRows\s*\}\}/gi, SAMPLE_SHIFT_ROWS);
  Object.entries(SAMPLE_DATA).forEach(([token, value]) => {
    output = output.replace(new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, "gi"), value ?? "");
  });
  return output;
};

export default function POSDayEndPrintTemplatePage() {
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
