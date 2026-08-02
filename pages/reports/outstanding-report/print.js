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

const REPORT_KEY = "OUTSTANDINGREPORT";

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
    return `<tr><td colspan="8" style="text-align:center;padding:16px;">No outstanding invoices found for the selected filters.</td></tr>`;
  }

  return rows
    .map((row) => {
      const invoiceDate = row.invoiceDate ?? row.InvoiceDate;
      return `<tr>
        <td>${escapeHtml(invoiceDate ? formatDate(invoiceDate) : "—")}</td>
        <td>${escapeHtml(row.invoiceNumber ?? row.InvoiceNumber ?? "—")}</td>
        <td>${escapeHtml(row.customerName ?? row.CustomerName ?? "—")}</td>
        <td class="num">${escapeHtml(formatAmount(row.totalInvoiceAmount ?? row.TotalInvoiceAmount))}</td>
        <td class="num">${escapeHtml(formatAmount(row.creditAmount ?? row.CreditAmount))}</td>
        <td class="num">${escapeHtml(formatAmount(row.outstandingAmount ?? row.OutstandingAmount))}</td>
        <td>${escapeHtml((row.salesPersonName ?? row.SalesPersonName) || "—")}</td>
        <td>${escapeHtml((row.remark ?? row.Remark) || "—")}</td>
      </tr>`;
    })
    .join("\n");
};

export default function OutstandingReportPrintPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const { templateHtml, loading: loadingTemplate } = useReportTemplate(REPORT_KEY);
  const { letterheadTokens, warehouseData } = useTemplateLetterhead();

  const customerId = Number(router.query.customerId ?? 0) || 0;

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

      try {
        const params = new URLSearchParams({
          customerId: String(customerId),
          warehouseId: String(warehouseId),
        });

        const res = await fetch(`${BASE_URL}/Outstanding/GetOutstandingSummary?${params}`, {
          method: "GET",
          headers: authHeaders(),
        });
        const json = await res.json().catch(() => null);

        if (!res.ok) {
          toast.error(json?.message || "Failed to load outstanding report.");
          setRows([]);
        } else {
          const result = json?.result ?? json?.Result ?? [];
          setRows(Array.isArray(result) ? result : []);
        }
      } catch (e) {
        console.error("[OutstandingReportPrint] load failed", e);
        toast.error("Failed to load outstanding report.");
        setRows([]);
      } finally {
        setLoadingData(false);
      }
    };

    load();
  }, [router.isReady, customerId]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          acc.invoice += Number(row.totalInvoiceAmount ?? row.TotalInvoiceAmount ?? 0) || 0;
          acc.credit += Number(row.creditAmount ?? row.CreditAmount ?? 0) || 0;
          acc.outstanding += Number(row.outstandingAmount ?? row.OutstandingAmount ?? 0) || 0;
          return acc;
        },
        { invoice: 0, credit: 0, outstanding: 0 }
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
      customerFilter: toFilterLabel(router.query.customerName, "All Customers"),
      totalInvoices: String(rows.length),
      totalInvoiceAmount: formatAmount(totals.invoice),
      totalCredit: formatAmount(totals.credit),
      totalOutstanding: formatAmount(totals.outstanding),
    }),
    [
      letterheadTokens,
      warehouseData?.name,
      router.query.customerName,
      rows.length,
      totals.invoice,
      totals.credit,
      totals.outstanding,
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
        loadingText="Loading outstanding report…"
        errorText="No outstanding report available to print."
        downloadName={`OutstandingReport_${new Date().toISOString().slice(0, 10)}`}
        showDownloadPdf={false}
      />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
