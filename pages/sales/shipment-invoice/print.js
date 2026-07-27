import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import TemplatePrintFrame from "@/components/ReportTemplate/TemplatePrintFrame";
import useReportTemplate from "@/components/ReportTemplate/useReportTemplate";
import useTemplateLetterhead from "@/components/ReportTemplate/useTemplateLetterhead";
import { applyTemplate, escapeHtml } from "@/components/ReportTemplate/applyTemplate";

const REPORT_KEY = "SHIPMENTINVOICE";

const authHeaders = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
  "Content-Type": "application/json",
});

const buildLineRows = (lines, totalLineAmount, lineSubtotal) => {
  const subtotal = formatCurrency(totalLineAmount ?? lineSubtotal);
  const subtotalRow = `<tr><td colspan="5" style="text-align:right;font-weight:700;">Line Subtotal</td><td class="num" style="font-weight:700;">${escapeHtml(subtotal)}</td></tr>`;

  if (!lines || lines.length === 0) {
    return `<tr><td colspan="6" style="text-align:center;">No line items</td></tr>${subtotalRow}`;
  }

  const rows = lines
    .map(
      (row, idx) => `<tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(row.itemName ?? "—")}</td>
        <td>${escapeHtml(row.description || "—")}</td>
        <td class="num">${escapeHtml(row.quantity ?? "—")}</td>
        <td class="num">${escapeHtml(formatCurrency(row.unitPrice))}</td>
        <td class="num">${escapeHtml(formatCurrency(row.lineTotal))}</td>
      </tr>`
    )
    .join("\n");

  return `${rows}\n${subtotalRow}`;
};

const buildAdditionalCostRows = (costs, totalAdditionalCost, additionalTotal) => {
  const total = formatCurrency(totalAdditionalCost ?? additionalTotal);
  const totalRow = `<tr><td colspan="3" style="text-align:right;font-weight:700;">Additional Costs Total</td><td class="num" style="font-weight:700;">${escapeHtml(total)}</td></tr>`;

  if (!costs || costs.length === 0) {
    return `<tr><td colspan="4" style="text-align:center;">No additional costs</td></tr>${totalRow}`;
  }

  const rows = costs
    .map(
      (row, idx) => `<tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(row.costType ?? "—")}</td>
        <td>${escapeHtml(row.description || "—")}</td>
        <td class="num">${escapeHtml(formatCurrency(row.amount))}</td>
      </tr>`
    )
    .join("\n");

  return `${rows}\n${totalRow}`;
};

export default function ShipmentInvoicePrintPage() {
  const router = useRouter();
  const invoiceId = router.query.id;

  const [invoice, setInvoice] = useState(null);
  const [loadingInvoice, setLoadingInvoice] = useState(true);

  const { templateHtml, loading: loadingTemplate } = useReportTemplate(REPORT_KEY);
  const { letterheadTokens } = useTemplateLetterhead();

  useEffect(() => {
    if (!router.isReady || !invoiceId) return;

    const load = async () => {
      setLoadingInvoice(true);
      try {
        const res = await fetch(`${BASE_URL}/ShipmentInvoice/GetById/${invoiceId}`, {
          method: "GET",
          headers: authHeaders(),
        });
        const json = await res.json().catch(() => null);
        const header = json?.result?.result ?? json?.result ?? json?.data ?? json;
        if (!res.ok || header == null) {
          toast.error(json?.message || "Failed to load shipment invoice.");
          setInvoice(null);
        } else {
          setInvoice(header);
        }
      } catch (e) {
        console.error("[ShipmentInvoicePrint] load failed", e);
        toast.error("Failed to load shipment invoice.");
        setInvoice(null);
      } finally {
        setLoadingInvoice(false);
      }
    };

    load();
  }, [router.isReady, invoiceId]);

  const lines =
    invoice?.shipmentInvoiceLineDetails ??
    invoice?.ShipmentInvoiceLineDetails ??
    [];
  const costs =
    invoice?.shipmentInvoiceAdditionalCosts ??
    invoice?.ShipmentInvoiceAdditionalCosts ??
    [];

  const lineSubtotal = Array.isArray(lines)
    ? lines.reduce((s, l) => s + (parseFloat(l.lineTotal) || 0), 0)
    : 0;
  const additionalTotal = Array.isArray(costs)
    ? costs.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0)
    : 0;
  const grandTotal =
    invoice?.grandTotal != null
      ? parseFloat(invoice.grandTotal)
      : lineSubtotal + additionalTotal;

  const supplierName =
    invoice?.supplierName ?? invoice?.SupplierName ?? null;
  const supplierDisplay =
    supplierName != null && supplierName !== ""
      ? supplierName
      : invoice?.supplierId != null
        ? String(invoice.supplierId)
        : "—";

  const tokenMap = useMemo(
    () => ({
      ...letterheadTokens,
      documentNo: invoice?.documentNo || "—",
      invoiceDate: formatDate(invoice?.invoiceDate) || "—",
      supplierName: supplierDisplay,
      referenceNo: invoice?.referenceNo || "—",
      remark: invoice?.remark || "—",
      totalLineAmount: formatCurrency(invoice?.totalLineAmount ?? lineSubtotal),
      totalAdditionalCost: formatCurrency(invoice?.totalAdditionalCost ?? additionalTotal),
      grandTotal: formatCurrency(grandTotal),
      additionalCostRows: buildAdditionalCostRows(
        costs,
        invoice?.totalAdditionalCost,
        additionalTotal
      ),
    }),
    [invoice, letterheadTokens, supplierDisplay, lineSubtotal, additionalTotal, grandTotal, costs]
  );

  const finalHtml = useMemo(() => {
    if (!templateHtml || !invoice) return "";
    return applyTemplate(
      templateHtml,
      tokenMap,
      buildLineRows(lines, invoice?.totalLineAmount, lineSubtotal)
    );
  }, [templateHtml, invoice, tokenMap, lines, lineSubtotal]);

  const isLoading = loadingInvoice || loadingTemplate;

  return (
    <>
      <TemplatePrintFrame
        finalHtml={finalHtml}
        loading={isLoading}
        loadingText="Loading shipment invoice…"
        errorText="Invoice not found."
        downloadName={`ShipmentInvoice_${invoice?.documentNo || invoiceId || "document"}`}
      />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
