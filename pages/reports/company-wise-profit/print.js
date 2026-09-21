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

const REPORT_KEY = "COMPANYWISEPROFIT";

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

const EMPTY_LINE_ITEMS_HTML = `<tr><td colspan="6" style="text-align:center;padding:16px;">No company wise profit data found for the selected filters.</td></tr>`;

const mapCompanyWiseProfitLine = (row) => ({
  productCode: row.productCode ?? row.ProductCode ?? "—",
  productName: row.productName ?? row.ProductName ?? "—",
  qty: formatAmount(row.qty ?? row.Qty),
  salesAmount: formatAmount(row.salesAmount ?? row.SalesAmount),
  costAmount: formatAmount(row.costAmount ?? row.CostAmount),
  profitAmount: formatAmount(row.profitAmount ?? row.ProfitAmount),
});

const buildLineItemsRows = (rows) => {
  if (!rows || rows.length === 0) return EMPTY_LINE_ITEMS_HTML;

  return rows
    .map((row) => {
      const t = mapCompanyWiseProfitLine(row);
      return `<tr>
        <td>${escapeHtml(t.productCode)}</td>
        <td>${escapeHtml(t.productName)}</td>
        <td class="num">${escapeHtml(t.qty)}</td>
        <td class="num">${escapeHtml(t.salesAmount)}</td>
        <td class="num">${escapeHtml(t.costAmount)}</td>
        <td class="num">${escapeHtml(t.profitAmount)}</td>
      </tr>`;
    })
    .join("\n");
};

const buildLineTokenMaps = (rows) => (rows || []).map(mapCompanyWiseProfitLine);

export default function CompanyWiseProfitPrintPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const { templateHtml, loading: loadingTemplate } = useReportTemplate(REPORT_KEY);
  const { letterheadTokens, warehouseData } = useTemplateLetterhead();

  const fromDate = router.query.fromDate ? String(router.query.fromDate) : "";
  const toDate = router.query.toDate ? String(router.query.toDate) : "";
  const supplierId = Number(router.query.supplierId ?? 0) || 0;
  const salesPersonId = Number(router.query.salesPersonId ?? 0) || 0;

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

      if (!supplierId) {
        toast.error("Supplier is required.");
        setRows([]);
        setLoadingData(false);
        return;
      }

      try {
        const params = new URLSearchParams({
          fromDate,
          toDate,
          supplierId: String(supplierId),
          warehouseId: String(warehouseId),
          salesPersonId: String(salesPersonId),
        });

        const res = await fetch(`${BASE_URL}/SalesInvoice/GetCompanyWiseProfitSummary?${params}`, {
          method: "GET",
          headers: authHeaders(),
        });
        const json = await res.json().catch(() => null);

        if (!res.ok) {
          toast.error(json?.message || "Failed to load company wise profit.");
          setRows([]);
        } else {
          const result = json?.result ?? json?.Result ?? [];
          setRows(Array.isArray(result) ? result : []);
        }
      } catch (e) {
        console.error("[CompanyWiseProfitPrint] load failed", e);
        toast.error("Failed to load company wise profit.");
        setRows([]);
      } finally {
        setLoadingData(false);
      }
    };

    load();
  }, [router.isReady, fromDate, toDate, supplierId, salesPersonId]);

  // API is the source of truth. CostAmount is already line total cost — do not multiply by Qty.
  const totals = useMemo(() => {
    const sales = rows.reduce((sum, row) => sum + (Number(row.salesAmount ?? row.SalesAmount ?? 0) || 0), 0);
    const cost = rows.reduce((sum, row) => sum + (Number(row.costAmount ?? row.CostAmount ?? 0) || 0), 0);
    return {
      sales,
      cost,
      profit: sales - cost,
    };
  }, [rows]);

  const lineItemsRows = useMemo(() => buildLineItemsRows(rows), [rows]);

  const tokenMap = useMemo(
    () => ({
      ...letterheadTokens,
      generatedOn: formatDateWithTime(new Date()) || "—",
      warehouseName: warehouseData?.name || "—",
      currentUser: getCurrentUser(),
      fromDate: fromDate ? formatDate(fromDate) || fromDate : "—",
      toDate: toDate ? formatDate(toDate) || toDate : "—",
      supplierFilter: toFilterLabel(router.query.supplierName, "—"),
      salesPersonFilter: toFilterLabel(router.query.salesPersonName, "All Sales Persons"),
      totalProducts: String(rows.length),
      totalSales: formatAmount(totals.sales),
      totalCost: formatAmount(totals.cost),
      totalProfit: formatAmount(totals.profit),
    }),
    [
      letterheadTokens,
      warehouseData?.name,
      fromDate,
      toDate,
      router.query.supplierName,
      router.query.salesPersonName,
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
        loadingText="Loading company wise profit…"
        errorText="No company wise profit available to print."
        downloadName={`CompanyWiseProfit_${new Date().toISOString().slice(0, 10)}`}
        showDownloadPdf={false}
      />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
