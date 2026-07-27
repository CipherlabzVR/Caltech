import React, { useCallback } from "react";
import ReportTemplateEditor from "@/components/ReportTemplate/ReportTemplateEditor";

const REPORT_KEY = "SERVICEPURCHASEINVOICE";
const TEMPLATE_NAME = "Purchase Invoice Print Template";

const SAMPLE_DATA = {
  companyLogo:
    '<div style="width:150px;height:58px;border:1px dashed #c0c0c0;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#9aa0a6;font:600 12px Arial,sans-serif;">LOGO</div>',
  companyName: "Your Company (Pvt) Ltd",
  companyAddress: "No. 123, Main Street, Colombo 03",
  companyContact: "+94 11 234 5678 / info@company.com",
  documentNo: "PI-000078",
  invoiceDate: "30 June 2026",
  customerName: "Nimal Perera",
  billTo: "No. 45, Galle Road, Colombo 04",
  salesPerson: "Kasun Silva",
  remark: "Walk-in purchase.",
  grossTotal: "96,500.00",
  totalDiscount: "1,500.00",
  netTotal: "95,000.00",
  warrantyType: "Manufacturer",
  warrantyPeriod: "12 months",
  warrantyStart: "30 June 2026",
  warrantyExpiry: "30 June 2027",
  warrantyTerms: "Covers manufacturing defects only.",
};

const SAMPLE_ROWS = `
  <tr><td class="idx">1</td><td>Iphone 12</td><td class="num">1</td><td class="num">100,000.00</td><td class="num">5,000.00</td><td class="num">95,000.00</td></tr>
  <tr><td colspan="6" style="padding:10px 12px 12px 44px;background:#F5F3FF;border-bottom:1px solid #E5E7EB;"><div style="font-size:11.5px;color:#374151;"><strong>Device</strong> — Type: Mobile · Brand: Apple · Model: iPhone 12 · Serial/IMEI: SN001</div><div style="font-size:11.5px;color:#374151;margin-top:4px;"><strong>Warranty</strong> — Type: Manufacturer · Period: 12 months</div></td></tr>
  <tr><td class="idx">2</td><td>Iphone Camera</td><td class="num">1</td><td class="num">1,500.00</td><td class="num">—</td><td class="num">1,500.00</td></tr>
  <tr><td colspan="6" style="padding:10px 12px 12px 44px;background:#F5F3FF;border-bottom:1px solid #E5E7EB;"><div style="font-size:11.5px;color:#374151;"><strong>Device</strong> — Type: Mobile · Brand: Apple · Model: Camera Module</div><div style="font-size:11.5px;color:#374151;margin-top:4px;"><strong>Warranty</strong> — Type: Shop · Period: 6 months</div></td></tr>
`;

const SAMPLE_LINE_DETAILS = `
  <div class="product-details">
    <div class="product-detail-card">
      <div class="product-detail-title">1. Iphone 12</div>
      <div class="product-detail-grid">
        <div class="detail-block"><div class="detail-label">Device Type</div><div class="detail-value">Mobile</div></div>
        <div class="detail-block"><div class="detail-label">Brand</div><div class="detail-value">Apple</div></div>
        <div class="detail-block"><div class="detail-label">Model</div><div class="detail-value">iPhone 12</div></div>
        <div class="detail-block"><div class="detail-label">Serial / IMEI</div><div class="detail-value">SN001</div></div>
        <div class="detail-block"><div class="detail-label">Warranty Type</div><div class="detail-value">Manufacturer</div></div>
        <div class="detail-block"><div class="detail-label">Period</div><div class="detail-value">12 months</div></div>
        <div class="detail-block"><div class="detail-label">Start Date</div><div class="detail-value">06 July 2026</div></div>
        <div class="detail-block"><div class="detail-label">Expiry Date</div><div class="detail-value">06 July 2027</div></div>
      </div>
      <div class="product-detail-terms"><span class="terms-label">Terms:</span> Manufacturer warranty applies.</div>
    </div>
  </div>
`;

const renderPreview = (html) => {
  if (!html) return "";
  let output = html.replace(/\{\{\s*lineItemsRows\s*\}\}/gi, SAMPLE_ROWS);
  output = output.replace(/\{\{\s*lineDetailsRows\s*\}\}/gi, SAMPLE_LINE_DETAILS);
  Object.entries(SAMPLE_DATA).forEach(([token, value]) => {
    output = output.replace(new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, "gi"), value ?? "");
  });
  return output;
};

export default function ServicePurchaseInvoiceTemplatePage() {
  return (
    <ReportTemplateEditor
      reportKey={REPORT_KEY}
      templateName={TEMPLATE_NAME}
      pageTitle={TEMPLATE_NAME}
      renderPreview={useCallback(renderPreview, [])}
      breadcrumbs={[
        { label: "Screens Template", href: "/report-template/screens-template/" },
        { label: "Service Management", href: "/report-template/screens-template/?module=service" },
        { label: TEMPLATE_NAME },
      ]}
    />
  );
}
