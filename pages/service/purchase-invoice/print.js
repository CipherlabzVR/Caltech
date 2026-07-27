import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { format } from "date-fns";
import BASE_URL from "Base/api";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TemplatePrintFrame from "@/components/ReportTemplate/TemplatePrintFrame";
import useReportTemplate from "@/components/ReportTemplate/useReportTemplate";
import useTemplateLetterhead from "@/components/ReportTemplate/useTemplateLetterhead";
import { applyTemplate, escapeHtml } from "@/components/ReportTemplate/applyTemplate";

const REPORT_KEY = "SERVICEPURCHASEINVOICE";

const formatLongDate = (value) => {
  if (!value) return "—";
  try {
    return format(new Date(value), "dd MMMM yyyy");
  } catch {
    return "—";
  }
};

const formatAmount = (value) => {
  const numericValue = Number(value ?? 0);
  if (Number.isNaN(numericValue)) return "0.00";
  return numericValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatQty = (value) => {
  const numericValue = Number(value ?? 0);
  if (Number.isNaN(numericValue)) return "0";
  return Number.isInteger(numericValue) ? String(numericValue) : numericValue.toFixed(2);
};

const getLineTotal = (line) => {
  const lineTotal = Number(line?.lineTotal ?? 0);
  if (lineTotal > 0) return lineTotal;
  return Number(line?.unitPrice ?? 0) * Number(line?.qty ?? 0);
};

const buildBillToLines = (invoice) =>
  [invoice?.billToline1, invoice?.billToline2, invoice?.billToline3, invoice?.billToline4].filter(
    (line) => line && String(line).trim()
  );

const resolveLineDevice = (line, invoice) => ({
  deviceType: line?.deviceType || invoice?.deviceType || "",
  brand: line?.brand || invoice?.brand || "",
  model: line?.model || invoice?.model || "",
  serialNumber: line?.serialNumber || invoice?.serialNumber || "",
});

const resolveLineWarranty = (line, invoice) => line?.warranty || invoice?.warranty || null;

const hasLineExtras = (line, invoice) => {
  const device = resolveLineDevice(line, invoice);
  const warranty = resolveLineWarranty(line, invoice);
  return Boolean(
    device.deviceType ||
      device.brand ||
      device.model ||
      device.serialNumber ||
      warranty?.warrantyType ||
      warranty?.periodMonths ||
      warranty?.startDate ||
      warranty?.expiryDate ||
      warranty?.terms
  );
};

const buildLineDetailSubRow = (line, invoice, index, colSpan = 6) => {
  if (!hasLineExtras(line, invoice)) return "";

  const device = resolveLineDevice(line, invoice);
  const warranty = resolveLineWarranty(line, invoice);

  const deviceItems = [
    device.deviceType ? `Type: ${device.deviceType}` : null,
    device.brand ? `Brand: ${device.brand}` : null,
    device.model ? `Model: ${device.model}` : null,
    device.serialNumber ? `Serial/IMEI: ${device.serialNumber}` : null,
  ].filter(Boolean);

  const warrantyItems = warranty
    ? [
        warranty.warrantyType ? `Type: ${warranty.warrantyType}` : null,
        warranty.periodMonths ? `Period: ${warranty.periodMonths} months` : null,
        warranty.startDate ? `Start: ${formatLongDate(warranty.startDate)}` : null,
        warranty.expiryDate ? `Expiry: ${formatLongDate(warranty.expiryDate)}` : null,
      ].filter(Boolean)
    : [];

  const termsBlock = warranty?.terms
    ? `<div style="margin-top:6px;font-size:11px;color:#4B5563;line-height:1.5;"><span style="font-weight:600;color:#6B7280;">Terms:</span> ${escapeHtml(warranty.terms)}</div>`
    : "";

  return `<tr>
    <td colspan="${colSpan}" style="padding:10px 12px 12px 44px;background:#F5F3FF;border-bottom:1px solid #E5E7EB;">
      <div style="font-size:10px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#4338CA;margin-bottom:6px;">
        Product ${index + 1} details
      </div>
      ${
        deviceItems.length
          ? `<div style="font-size:11.5px;color:#374151;margin-bottom:4px;line-height:1.5;"><span style="font-weight:600;color:#111827;">Device</span> — ${escapeHtml(deviceItems.join(" · "))}</div>`
          : ""
      }
      ${
        warrantyItems.length
          ? `<div style="font-size:11.5px;color:#374151;line-height:1.5;"><span style="font-weight:600;color:#111827;">Warranty</span> — ${escapeHtml(warrantyItems.join(" · "))}</div>`
          : ""
      }
      ${termsBlock}
    </td>
  </tr>`;
};

const buildRows = (lines, invoice) => {
  if (!lines || lines.length === 0) {
    return `<tr><td colspan="6" style="text-align:center;padding:16px;">No line items</td></tr>`;
  }

  return lines
    .map((line, index) => {
      const discountAmount = Number(line?.discountAmount ?? 0);
      const netLineTotal = getLineTotal(line) - discountAmount;
      const productRow = `<tr>
        <td class="idx">${index + 1}</td>
        <td>${escapeHtml(line.productName || "—")}</td>
        <td class="num">${escapeHtml(formatQty(line.qty))}</td>
        <td class="num">${escapeHtml(formatAmount(line.unitPrice))}</td>
        <td class="num">${discountAmount > 0 ? escapeHtml(formatAmount(discountAmount)) : "—"}</td>
        <td class="num">${escapeHtml(formatAmount(netLineTotal))}</td>
      </tr>`;
      const detailRow = buildLineDetailSubRow(line, invoice, index);
      return `${productRow}${detailRow}`;
    })
    .join("\n");
};

const buildLineDetailsSection = (lines, invoice) => {
  if (!lines || lines.length === 0) {
    return `<div style="padding:12px 16px;border:1px solid #D1D5DB;border-radius:6px;color:#6B7280;font-size:12px;">No product details recorded.</div>`;
  }

  const cards = lines
    .map((line, index) => {
      const device = resolveLineDevice(line, invoice);
      const warranty = resolveLineWarranty(line, invoice);
      const productName = line.productName || `Product ${index + 1}`;

      if (!hasLineExtras(line, invoice)) {
        return `<div class="product-detail-card">
          <div class="product-detail-title">${index + 1}. ${escapeHtml(productName)}</div>
          <div class="product-detail-empty">No device or warranty details recorded for this item.</div>
        </div>`;
      }

      return `<div class="product-detail-card">
        <div class="product-detail-title">${index + 1}. ${escapeHtml(productName)}</div>
        <div class="product-detail-grid">
          <div class="detail-block">
            <div class="detail-label">Device Type</div>
            <div class="detail-value">${escapeHtml(device.deviceType || "—")}</div>
          </div>
          <div class="detail-block">
            <div class="detail-label">Brand</div>
            <div class="detail-value">${escapeHtml(device.brand || "—")}</div>
          </div>
          <div class="detail-block">
            <div class="detail-label">Model</div>
            <div class="detail-value">${escapeHtml(device.model || "—")}</div>
          </div>
          <div class="detail-block">
            <div class="detail-label">Serial / IMEI</div>
            <div class="detail-value">${escapeHtml(device.serialNumber || "—")}</div>
          </div>
          <div class="detail-block">
            <div class="detail-label">Warranty Type</div>
            <div class="detail-value">${escapeHtml(warranty?.warrantyType || "—")}</div>
          </div>
          <div class="detail-block">
            <div class="detail-label">Period</div>
            <div class="detail-value">${warranty?.periodMonths ? `${escapeHtml(String(warranty.periodMonths))} months` : "—"}</div>
          </div>
          <div class="detail-block">
            <div class="detail-label">Start Date</div>
            <div class="detail-value">${formatLongDate(warranty?.startDate)}</div>
          </div>
          <div class="detail-block">
            <div class="detail-label">Expiry Date</div>
            <div class="detail-value">${formatLongDate(warranty?.expiryDate)}</div>
          </div>
        </div>
        <div class="product-detail-terms"><span class="terms-label">Terms:</span> ${escapeHtml(warranty?.terms || "—")}</div>
      </div>`;
    })
    .join("\n");

  return `<div class="product-details">${cards}</div>`;
};

export default function PurchaseInvoicePrintPage() {
  const router = useRouter();
  const invoiceId = router.query.id;
  const documentNumber = router.query.documentNumber;

  const [invoice, setInvoice] = useState(null);
  const [loadingInvoice, setLoadingInvoice] = useState(true);

  const { templateHtml, loading: loadingTemplate } = useReportTemplate(REPORT_KEY);
  const { letterheadTokens } = useTemplateLetterhead(invoice?.warehouseId);

  useEffect(() => {
    if (!router.isReady || !invoiceId) return;

    const fetchInvoice = async () => {
      try {
        setLoadingInvoice(true);
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(`${BASE_URL}/PurchaseInvoice/GetPurchaseInvoiceById?id=${invoiceId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const data = await response.json().catch(() => null);
        const result = data?.result?.result ?? data?.result;

        if (response.ok && result) {
          setInvoice(result);
        } else {
          setInvoice(null);
        }
      } catch (error) {
        console.error("Error fetching purchase invoice:", error);
        setInvoice(null);
      } finally {
        setLoadingInvoice(false);
      }
    };

    fetchInvoice();
  }, [router.isReady, invoiceId]);

  const lines = useMemo(() => {
    const raw = invoice?.purchaseInvoiceLines ?? [];
    return [...raw].sort((a, b) => (a.sequanceNo ?? 0) - (b.sequanceNo ?? 0));
  }, [invoice]);

  const tokenMap = useMemo(() => {
    const headerWarranty = invoice?.warranty;
    // Line "Total Price" already reflects the per-line discount (net). The header
    // grossTotal is the sum of those net line totals; discountamount is the order-level discount.
    const grossTotalValue = Number(
      invoice?.grossTotal ??
        lines.reduce((sum, line) => sum + (getLineTotal(line) - Number(line?.discountAmount ?? 0)), 0)
    );
    const orderDiscount = Number(invoice?.discountamount ?? 0);
    return {
      ...letterheadTokens,
      documentNo: invoice?.documentNo || documentNumber || "—",
      invoiceDate: formatLongDate(invoice?.documentDate),
      customerName: invoice?.customerName || "—",
      billTo: buildBillToLines(invoice).join(", ") || "—",
      salesPerson: invoice?.salesPersonName || "—",
      remark: invoice?.remark || "—",
      grossTotal: formatAmount(grossTotalValue),
      totalDiscount: formatAmount(orderDiscount),
      netTotal: formatAmount(invoice?.netTotal),
      warrantyType: headerWarranty?.warrantyType || "—",
      warrantyPeriod: headerWarranty?.periodMonths ? `${headerWarranty.periodMonths} months` : "—",
      warrantyStart: formatLongDate(headerWarranty?.startDate),
      warrantyExpiry: formatLongDate(headerWarranty?.expiryDate),
      warrantyTerms: headerWarranty?.terms || "—",
      lineDetailsRows: buildLineDetailsSection(lines, invoice),
    };
  }, [invoice, documentNumber, letterheadTokens, lines]);

  const finalHtml = useMemo(() => {
    if (!templateHtml || !invoice) return "";
    return applyTemplate(templateHtml, tokenMap, buildRows(lines, invoice));
  }, [templateHtml, invoice, tokenMap, lines]);

  const isLoading = loadingInvoice || loadingTemplate;

  return (
    <>
      <TemplatePrintFrame
        finalHtml={finalHtml}
        loading={isLoading}
        loadingText="Loading purchase invoice…"
        errorText="Failed to load purchase invoice."
        downloadName={`PurchaseInvoice_${invoice?.documentNo || documentNumber || "document"}`}
      />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
