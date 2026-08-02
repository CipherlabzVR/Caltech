import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatDate, formatDateWithTime } from "@/components/utils/formatHelper";
import TemplatePrintFrame from "@/components/ReportTemplate/TemplatePrintFrame";
import useReportTemplate from "@/components/ReportTemplate/useReportTemplate";
import useTemplateLetterhead from "@/components/ReportTemplate/useTemplateLetterhead";
import { applyTemplate, escapeHtml } from "@/components/ReportTemplate/applyTemplate";

const REPORT_KEY = "CUSTOMERPAYMENTSUMMARY";

const authHeaders = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
  "Content-Type": "application/json",
});

const getWarehouseId = () =>
  typeof window !== "undefined" ? localStorage.getItem("warehouse") : null;

const getCurrentUser = () =>
  typeof window !== "undefined" ? localStorage.getItem("name") || "—" : "—";

const formatAmount = (value) => {
  const numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) return "0.00";
  return numeric.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const toFilterLabel = (value, allLabel) => {
  const text = value == null ? "" : String(value).trim();
  if (!text || text === "0" || text.toLowerCase() === "all") return allLabel;
  return text;
};

const buildLineItemsRows = (rows) => {
  if (!rows || rows.length === 0) {
    return `<tr><td colspan="8" style="text-align:center;padding:16px;">No customer payments found for the selected filters.</td></tr>`;
  }

  return rows
    .map((row) => {
      const receiptDate = row.receiptDate ?? row.ReceiptDate;
      return `<tr>
        <td>${escapeHtml(receiptDate ? formatDate(receiptDate) : "—")}</td>
        <td>${escapeHtml(row.receiptNumber ?? row.ReceiptNumber ?? "—")}</td>
        <td>${escapeHtml(row.customerName ?? row.CustomerName ?? "—")}</td>
        <td>${escapeHtml((row.invoiceNos ?? row.InvoiceNos) || "—")}</td>
        <td>${escapeHtml(row.paymentType ?? row.PaymentType ?? "—")}</td>
        <td class="num">${escapeHtml(formatAmount(row.totalPaidAmount ?? row.TotalPaidAmount))}</td>
        <td>${escapeHtml((row.referenceNumber ?? row.ReferenceNumber) || "—")}</td>
        <td>${escapeHtml((row.remark ?? row.Remark) || "—")}</td>
      </tr>`;
    })
    .join("\n");
};

export default function CustomerPaymentSummaryPrintPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const { templateHtml, loading: loadingTemplate } = useReportTemplate(REPORT_KEY);
  const { letterheadTokens, warehouseData } = useTemplateLetterhead();

  const fromDate = router.query.fromDate ? String(router.query.fromDate) : "";
  const toDate = router.query.toDate ? String(router.query.toDate) : "";
  const customerId = Number(router.query.customerId ?? 0) || 0;
  const invoiceId = Number(router.query.invoiceId ?? 0) || 0;
  const paymentType = Number(router.query.paymentType ?? 0) || 0;

  useEffect(() => {
    if (!router.isReady) return;

    const load = async () => {
      setLoadingData(true);
      const warehouseId = getWarehouseId();

      if (!warehouseId) {
        toast.error("Warehouse not found. Please sign in again.");
        setRows([]);
        setLoadingData(false);
        return;
      }

      if (!fromDate || !toDate) {
        toast.error("From Date and To Date are required.");
        setRows([]);
        setLoadingData(false);
        return;
      }

      try {
        const params = new URLSearchParams({
          fromDate,
          toDate,
          warehouseId: String(warehouseId),
          customerId: String(customerId),
          invoiceId: String(invoiceId),
          paymentType: String(paymentType),
        });

        const res = await fetch(`${BASE_URL}/Receipt/GetCustomerPaymentSummary?${params}`, {
          method: "GET",
          headers: authHeaders(),
        });
        const json = await res.json().catch(() => null);

        if (!res.ok) {
          toast.error(json?.message || "Failed to load customer payment summary.");
          setRows([]);
        } else {
          const result = json?.result ?? json?.Result ?? [];
          setRows(Array.isArray(result) ? result : []);
        }
      } catch (e) {
        console.error("[CustomerPaymentSummaryPrint] load failed", e);
        toast.error("Failed to load customer payment summary.");
        setRows([]);
      } finally {
        setLoadingData(false);
      }
    };

    load();
  }, [router.isReady, fromDate, toDate, customerId, invoiceId, paymentType]);

  const totalPaid = useMemo(
    () =>
      rows.reduce(
        (sum, row) => sum + (Number(row.totalPaidAmount ?? row.TotalPaidAmount ?? 0) || 0),
        0
      ),
    [rows]
  );

  const lineItemsRows = useMemo(() => buildLineItemsRows(rows), [rows]);

  const tokenMap = useMemo(
    () => ({
      ...letterheadTokens,
      generatedOn: formatDateWithTime(new Date()) || "—",
      warehouseName: warehouseData?.name || "—",
      currentUser: getCurrentUser(),
      fromDate: fromDate ? formatDate(fromDate) || fromDate : "—",
      toDate: toDate ? formatDate(toDate) || toDate : "—",
      customerFilter: toFilterLabel(router.query.customerName, "All Customers"),
      invoiceFilter: toFilterLabel(router.query.invoiceName, "All Invoices"),
      paymentTypeFilter: toFilterLabel(router.query.paymentTypeName, "All Payment Types"),
      totalReceipts: String(rows.length),
      totalPaid: formatAmount(totalPaid),
    }),
    [
      letterheadTokens,
      warehouseData?.name,
      fromDate,
      toDate,
      router.query.customerName,
      router.query.invoiceName,
      router.query.paymentTypeName,
      rows.length,
      totalPaid,
    ]
  );

  const finalHtml = useMemo(() => {
    if (!templateHtml || loadingData) return "";
    return applyTemplate(templateHtml, tokenMap, lineItemsRows);
  }, [templateHtml, loadingData, tokenMap, lineItemsRows]);

  return (
    <>
      <TemplatePrintFrame
        finalHtml={finalHtml}
        loading={loadingData || loadingTemplate}
        loadingText="Loading customer payment summary…"
        errorText="No customer payment summary available to print."
        downloadName={`CustomerPaymentSummary_${new Date().toISOString().slice(0, 10)}`}
        showDownloadPdf={false}
      />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
