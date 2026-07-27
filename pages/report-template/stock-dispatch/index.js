import React, { useCallback } from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";

const REPORT_KEY = "STOCKDISPATCH";
const TEMPLATE_NAME = "Stock Dispatch Print Template";

const SAMPLE_DATA = {
  companyLogo:
    '<div style="width:150px;height:58px;border:1px dashed #c0c0c0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9aa0a6;font:600 12px Arial,sans-serif;">LOGO</div>',
  companyName: "Your Company (Pvt) Ltd",
  companyAddress: "No. 123, Main Street, Colombo 03",
  companyContact: "+94 11 234 5678 / info@company.com",
  documentNo: "0000000042",
  dispatchDate: "2026-07-08",
  warehouseName: "Main",
  userName: "Kasun Perera",
  supplierName: "HANGZHUO CAIHUI TECHNOLOGY CO.LTD",
  remark: "yuytu",
  productCode: "0000000026",
  productName: "i 3200 HEAD CABLE",
  batchNumber: "B-2026-001",
  expiryDate: "2027-12-31",
  costPrice: "580.00",
  unitPrice: "180.00",
  sellingPrice: "1,500.00",
  dispatchQuantity: "10",
  totalCostValue: "5,800.00",
  totalSellingValue: "15,000.00",
};

const SAMPLE_ROWS = `
  <tr>
    <td>2026-07-08</td>
    <td>HANGZHUO CAIHUI TECHNOLOGY CO.LTD</td>
    <td>0000000026</td>
    <td>i 3200 HEAD CABLE</td>
    <td class="num">580.00</td>
    <td class="num">180.00</td>
    <td class="num">1,500.00</td>
    <td class="num">10</td>
    <td>yuytu</td>
  </tr>
`;

const renderPreview = (html) => {
  if (!html) return "";
  let output = html.replace(/\{\{\s*lineItemsRows\s*\}\}/gi, SAMPLE_ROWS);
  Object.entries(SAMPLE_DATA).forEach(([token, value]) => {
    output = output.replace(new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, "gi"), value ?? "");
  });
  return output;
};

export default function StockDispatchPrintTemplatePage() {
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
