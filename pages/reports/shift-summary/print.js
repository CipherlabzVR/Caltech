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

const REPORT_KEY = "SHIFTSUMMARY";

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
    return `<tr><td colspan="10" style="text-align:center;padding:16px;">No shifts found for the selected filters.</td></tr>`;
  }

  return rows
    .map((row) => {
      const startDate = row.startDate ?? row.StartDate;
      const endDate = row.endDate ?? row.EndDate;
      return `<tr>
        <td>${escapeHtml(row.documentNo ?? row.DocumentNo ?? "—")}</td>
        <td>${escapeHtml(startDate ? formatDate(startDate) : "—")}</td>
        <td>${escapeHtml(endDate ? formatDate(endDate) : "—")}</td>
        <td>${escapeHtml(row.userName ?? row.UserName ?? "—")}</td>
        <td>${escapeHtml(row.terminalCode ?? row.TerminalCode ?? "—")}</td>
        <td class="num">${escapeHtml(formatAmount(row.totalStartAmount ?? row.TotalStartAmount))}</td>
        <td class="num">${escapeHtml(formatAmount(row.totalEndAmount ?? row.TotalEndAmount))}</td>
        <td class="num">${escapeHtml(formatAmount(row.totalInvoice ?? row.TotalInvoice))}</td>
        <td class="num">${escapeHtml(formatAmount(row.totalReceipt ?? row.TotalReceipt))}</td>
        <td>${escapeHtml(row.status ?? row.Status ?? "—")}</td>
      </tr>`;
    })
    .join("\n");
};

export default function ShiftSummaryPrintPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const { templateHtml, loading: loadingTemplate } = useReportTemplate(REPORT_KEY);
  const { letterheadTokens, warehouseData } = useTemplateLetterhead();

  const fromDate = router.query.fromDate ? String(router.query.fromDate) : "";
  const toDate = router.query.toDate ? String(router.query.toDate) : "";
  const userId = Number(router.query.userId ?? 0) || 0;
  const terminalId = Number(router.query.terminalId ?? 0) || 0;

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
          userId: String(userId),
          terminalId: String(terminalId),
        });

        const res = await fetch(`${BASE_URL}/Shift/GetShiftSummary?${params}`, {
          method: "GET",
          headers: authHeaders(),
        });
        const json = await res.json().catch(() => null);

        if (!res.ok) {
          toast.error(json?.message || "Failed to load shift summary.");
          setRows([]);
        } else {
          const result = json?.result ?? json?.Result ?? [];
          setRows(Array.isArray(result) ? result : []);
        }
      } catch (e) {
        console.error("[ShiftSummaryPrint] load failed", e);
        toast.error("Failed to load shift summary.");
        setRows([]);
      } finally {
        setLoadingData(false);
      }
    };

    load();
  }, [router.isReady, fromDate, toDate, userId, terminalId]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          acc.invoice += Number(row.totalInvoice ?? row.TotalInvoice ?? 0) || 0;
          acc.receipt += Number(row.totalReceipt ?? row.TotalReceipt ?? 0) || 0;
          return acc;
        },
        { invoice: 0, receipt: 0 }
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
      userFilter: toFilterLabel(router.query.userName, "All Users"),
      terminalFilter: toFilterLabel(router.query.terminalName, "All Terminals"),
      totalShifts: String(rows.length),
      totalInvoice: formatAmount(totals.invoice),
      totalReceipt: formatAmount(totals.receipt),
    }),
    [
      letterheadTokens,
      warehouseData?.name,
      fromDate,
      toDate,
      router.query.userName,
      router.query.terminalName,
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
        loadingText="Loading shift summary…"
        errorText="No shift summary available to print."
        downloadName={`ShiftSummary_${new Date().toISOString().slice(0, 10)}`}
        showDownloadPdf={false}
      />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
