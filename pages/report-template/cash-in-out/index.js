import React, { useCallback } from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";

const REPORT_KEY = "CASHINOUT";
const TEMPLATE_NAME = "Cash In/Out Print Template";

const SAMPLE_DATA = {
  companyLogo:
    '<div style="width:150px;height:58px;border:1px dashed #c0c0c0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9aa0a6;font:600 12px Arial,sans-serif;">LOGO</div>',
  companyName: "Your Company (Pvt) Ltd",
  companyAddress: "No. 123, Main Street, Colombo 03",
  companyContact: "+94 11 234 5678 / info@company.com",
  shiftCode: "0000000178",
  transactionDate: "2026-07-03",
  description: "CASH DIPOSIT",
  warehouseName: "Main",
  createdUser: "Kavindu Perera",
  cashFlowType: "BANK",
  cashType: "Cash Out",
  status: "Approved",
  amount: "140,000.00",
  rejectedReason: "—",
};

const renderPreview = (html) => {
  if (!html) return "";
  let output = html;
  Object.entries(SAMPLE_DATA).forEach(([token, value]) => {
    output = output.replace(new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, "gi"), value ?? "");
  });
  return output;
};

export default function CashInOutPrintTemplatePage() {
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
