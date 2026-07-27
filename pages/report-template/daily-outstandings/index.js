import React, { useCallback } from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";

const REPORT_KEY = "DAILYOUTSTANDING";
const TEMPLATE_NAME = "Daily Outstandings Print Template";

const SAMPLE_DATA = {
  companyLogo:
    '<div style="width:150px;height:58px;border:1px dashed #c0c0c0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9aa0a6;font:600 12px Arial,sans-serif;">LOGO</div>',
  companyName: "Your Company (Pvt) Ltd",
  companyAddress: "No. 123, Main Street, Colombo 03",
  companyContact: "+94 11 234 5678 / info@company.com",
  snapshotDate: "07-Jul-2026 12:00 AM",
  warehouseName: "Main",
  customerCount: "28",
  generatedOn: "08-Jul-2026 02:30 PM",
  totalOutstanding: "3,387,686.00",
};

const SAMPLE_ROWS = `
  <tr><td>1</td><td>MADURA</td><td class="num">450,250.00</td></tr>
  <tr><td>2</td><td>HASANTHA</td><td class="num">320,500.00</td></tr>
  <tr><td>3</td><td>SACHINTHAKA</td><td class="num">275,000.00</td></tr>
  <tr><td>4</td><td>Kamal Fernando</td><td class="num">198,750.00</td></tr>
`;

const renderPreview = (html) => {
  if (!html) return "";
  let output = html.replace(/\{\{\s*lineItemsRows\s*\}\}/gi, SAMPLE_ROWS);
  Object.entries(SAMPLE_DATA).forEach(([token, value]) => {
    output = output.replace(new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, "gi"), value ?? "");
  });
  return output;
};

export default function DailyOutstandingsPrintTemplatePage() {
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
