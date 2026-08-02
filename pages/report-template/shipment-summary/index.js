import React, { useCallback } from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";

const REPORT_KEY = "SHIPMENTSUMMARY";
const TEMPLATE_NAME = "Shipment Summary Template";

const SAMPLE_DATA = {
  companyLogo:
    '<div style="width:150px;height:58px;border:1px dashed #c0c0c0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9aa0a6;font:600 12px Arial,sans-serif;">LOGO</div>',
  companyName: "INK FUSION",
  companyAddress: "192, Polwatta road, Pamunwa, Maharagama.",
  companyContact: "0768680890",
  generatedOn: "23-Jul-2026 05:00 PM",
  warehouseName: "Main",
  currentUser: "Admin",
  fromDate: "01-Jul-2026",
  toDate: "23-Jul-2026",
  supplierFilter: "All Suppliers",
  categoryFilter: "All Categories",
  subCategoryFilter: "All Sub Categories",
  productFilter: "All Items",
  statusFilter: "All Statuses",
  totalShipments: "2",
  totalQty: "160.00",
  totalAmount: "210,000.00",
};

const SAMPLE_ROWS = `
  <tr>
    <td>02-Jul-2026</td>
    <td>SHP-000045</td>
    <td>PO-000125</td>
    <td>ABC Suppliers</td>
    <td>REF-S01</td>
    <td>Dispatched</td>
    <td class="num">100.00</td>
    <td class="num">120,000.00</td>
    <td>Sea freight</td>
  </tr>
  <tr>
    <td>15-Jul-2026</td>
    <td>SHP-000052</td>
    <td>PO-000142</td>
    <td>XYZ Traders</td>
    <td>REF-S08</td>
    <td>Ordered</td>
    <td class="num">60.00</td>
    <td class="num">90,000.00</td>
    <td>—</td>
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

export default function ShipmentSummaryTemplatePage() {
  return (
    <ReportTemplateEditor
      reportKey={REPORT_KEY}
      templateName={TEMPLATE_NAME}
      pageTitle={TEMPLATE_NAME}
      renderPreview={useCallback(renderPreview, [])}
      breadcrumbs={[
        { label: "Report Template", href: "/report-template/report-template/" },
        { label: "Inventory", href: "/report-template/report-template/?module=inventory" },
        { label: TEMPLATE_NAME },
      ]}
    />
  );
}
