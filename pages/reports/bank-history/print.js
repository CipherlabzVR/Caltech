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

const REPORT_KEY = "BANKHISTORY";

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

const EMPTY_LINE_ITEMS_HTML = `<tr><td colspan="8" style="text-align:center;padding:16px;">No bank history found for the selected filters.</td></tr>`;

const mapBankHistoryLine = (row) => {
  const date = row.date ?? row.Date;
  return {
    date: date ? formatDate(date) : "—",
    documentNo: row.documentNo ?? row.DocumentNo ?? "—",
    bankName: row.bankName ?? row.BankName ?? "—",
    categoryName: row.categoryName ?? row.CategoryName ?? "—",
    transactionType: row.transactionType ?? row.TransactionType ?? "—",
    amount: formatAmount(row.amount ?? row.Amount),
    remainingBalance: formatAmount(row.remainingBalance ?? row.RemainingBalance),
    description: (row.description ?? row.Description) || "—",
  };
};

const buildLineItemsRows = (rows) => {
  if (!rows || rows.length === 0) return EMPTY_LINE_ITEMS_HTML;

  return rows
    .map((row) => {
      const t = mapBankHistoryLine(row);
      return `<tr>
        <td>${escapeHtml(t.date)}</td>
        <td>${escapeHtml(t.documentNo)}</td>
        <td>${escapeHtml(t.bankName)}</td>
        <td>${escapeHtml(t.categoryName)}</td>
        <td>${escapeHtml(t.transactionType)}</td>
        <td class="num">${escapeHtml(t.amount)}</td>
        <td class="num">${escapeHtml(t.remainingBalance)}</td>
        <td>${escapeHtml(t.description)}</td>
      </tr>`;
    })
    .join("\n");
};

const buildLineTokenMaps = (rows) => (rows || []).map(mapBankHistoryLine);

export default function BankHistoryPrintPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const { templateHtml, loading: loadingTemplate } = useReportTemplate(REPORT_KEY);
  const { letterheadTokens, warehouseData } = useTemplateLetterhead();

  const fromDate = router.query.fromDate ? String(router.query.fromDate) : "";
  const toDate = router.query.toDate ? String(router.query.toDate) : "";
  const bankId = Number(router.query.bankId ?? 0) || 0;
  const cashFlowTypeId = Number(router.query.cashFlowTypeId ?? 0) || 0;

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

      if (!bankId) {
        toast.error("Bank is required.");
        setRows([]);
        setLoadingData(false);
        return;
      }

      try {
        const params = new URLSearchParams({
          fromDate,
          toDate,
          bankId: String(bankId),
          warehouseId: String(warehouseId),
          cashFlowTypeId: String(cashFlowTypeId),
        });

        const res = await fetch(`${BASE_URL}/BankHistory/GetBankHistorySummary?${params}`, {
          method: "GET",
          headers: authHeaders(),
        });
        const json = await res.json().catch(() => null);

        if (!res.ok) {
          toast.error(json?.message || "Failed to load bank history summary.");
          setRows([]);
        } else {
          const result = json?.result ?? json?.Result ?? [];
          setRows(Array.isArray(result) ? result : []);
        }
      } catch (e) {
        console.error("[BankHistoryPrint] load failed", e);
        toast.error("Failed to load bank history summary.");
        setRows([]);
      } finally {
        setLoadingData(false);
      }
    };

    load();
  }, [router.isReady, fromDate, toDate, bankId, cashFlowTypeId]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          const amount = Number(row.amount ?? row.Amount ?? 0) || 0;
          const type = String(row.transactionType ?? row.TransactionType ?? "").toLowerCase();
          if (type === "credit") acc.credit += amount;
          else if (type === "debit") acc.debit += amount;
          return acc;
        },
        { credit: 0, debit: 0 }
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
      bankFilter: toFilterLabel(router.query.bankName, "—"),
      categoryFilter: toFilterLabel(router.query.cashFlowTypeName, "All Categories"),
      totalRows: String(rows.length),
      totalCredit: formatAmount(totals.credit),
      totalDebit: formatAmount(totals.debit),
    }),
    [
      letterheadTokens,
      warehouseData?.name,
      fromDate,
      toDate,
      router.query.bankName,
      router.query.cashFlowTypeName,
      rows.length,
      totals,
    ]
  );

  const finalHtml = useMemo(() => {
    if (!templateHtml || loadingData) return "";
    return applyTemplate(templateHtml, tokenMap, lineItemsRows, {
      lineTokenMaps: buildLineTokenMaps(rows),
      emptyLineItemsHtml: EMPTY_LINE_ITEMS_HTML,
    });
  }, [templateHtml, loadingData, tokenMap, lineItemsRows, rows]);

  return (
    <>
      <TemplatePrintFrame
        finalHtml={finalHtml}
        loading={loadingData || loadingTemplate}
        loadingText="Loading bank history…"
        errorText="No bank history available to print."
        downloadName={`BankHistory_${new Date().toISOString().slice(0, 10)}`}
        showDownloadPdf={false}
        showDownloadExcel
        autoExportExcel={String(router.query.exportExcel || "") === "1"}
      />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
