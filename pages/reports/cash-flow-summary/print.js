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

const REPORT_KEY = "CASHFLOWSUMMARY";

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
    return `<tr><td colspan="7" style="text-align:center;padding:16px;">No cash flow entries found for the selected filters.</td></tr>`;
  }

  return rows
    .map((row) => {
      const date = row.date ?? row.Date;
      return `<tr>
        <td>${escapeHtml(date ? formatDate(date) : "—")}</td>
        <td>${escapeHtml(row.shiftNo ?? row.ShiftNo ?? "—")}</td>
        <td>${escapeHtml(row.cashFlowTypeName ?? row.CashFlowTypeName ?? "—")}</td>
        <td>${escapeHtml(row.cashType ?? row.CashType ?? "—")}</td>
        <td class="num">${escapeHtml(formatAmount(row.amount ?? row.Amount))}</td>
        <td>${escapeHtml((row.description ?? row.Description) || "—")}</td>
        <td>${escapeHtml(row.status ?? row.Status ?? "—")}</td>
      </tr>`;
    })
    .join("\n");
};

export default function CashFlowSummaryPrintPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const { templateHtml, loading: loadingTemplate } = useReportTemplate(REPORT_KEY);
  const { letterheadTokens, warehouseData } = useTemplateLetterhead();

  const fromDate = router.query.fromDate ? String(router.query.fromDate) : "";
  const toDate = router.query.toDate ? String(router.query.toDate) : "";
  const cashFlowTypeId = Number(router.query.cashFlowTypeId ?? 0) || 0;
  const cashType = Number(router.query.cashType ?? 0) || 0;

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
          cashFlowTypeId: String(cashFlowTypeId),
          cashType: String(cashType),
        });

        const res = await fetch(`${BASE_URL}/Shift/GetCashFlowSummary?${params}`, {
          method: "GET",
          headers: authHeaders(),
        });
        const json = await res.json().catch(() => null);

        if (!res.ok) {
          toast.error(json?.message || "Failed to load cash flow summary.");
          setRows([]);
        } else {
          const result = json?.result ?? json?.Result ?? [];
          setRows(Array.isArray(result) ? result : []);
        }
      } catch (e) {
        console.error("[CashFlowSummaryPrint] load failed", e);
        toast.error("Failed to load cash flow summary.");
        setRows([]);
      } finally {
        setLoadingData(false);
      }
    };

    load();
  }, [router.isReady, fromDate, toDate, cashFlowTypeId, cashType]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          acc.amount += Number(row.amount ?? row.Amount ?? 0) || 0;
          return acc;
        },
        { amount: 0 }
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
      cashFlowTypeFilter: toFilterLabel(router.query.cashFlowTypeName, "All Cash Flow Types"),
      cashTypeFilter: toFilterLabel(router.query.cashTypeName, "All"),
      totalRows: String(rows.length),
      totalAmount: formatAmount(totals.amount),
    }),
    [
      letterheadTokens,
      warehouseData?.name,
      fromDate,
      toDate,
      router.query.cashFlowTypeName,
      router.query.cashTypeName,
      rows.length,
      totals,
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
        loadingText="Loading cash flow summary…"
        errorText="No cash flow summary available to print."
        downloadName={`CashFlowSummary_${new Date().toISOString().slice(0, 10)}`}
        showDownloadPdf={false}
      />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
