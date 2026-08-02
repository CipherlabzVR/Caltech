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

const REPORT_KEY = "PROFITABILITYREPORT";

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
    return `<tr><td colspan="8" style="text-align:center;padding:16px;">No profitability data found for the selected filters.</td></tr>`;
  }

  return rows
    .map((row) => {
      const documentDate = row.documentDate ?? row.DocumentDate;
      return `<tr>
        <td>${escapeHtml(documentDate ? formatDate(documentDate) : "—")}</td>
        <td>${escapeHtml(row.documentNo ?? row.DocumentNo ?? "—")}</td>
        <td>${escapeHtml(row.customerName ?? row.CustomerName ?? "—")}</td>
        <td>${escapeHtml(row.productCode ?? row.ProductCode ?? "—")}</td>
        <td>${escapeHtml(row.productName ?? row.ProductName ?? "—")}</td>
        <td class="num">${escapeHtml(formatAmount(row.qty ?? row.Qty))}</td>
        <td class="num">${escapeHtml(formatAmount(row.salesAmount ?? row.SalesAmount))}</td>
        <td class="num">${escapeHtml(formatAmount(row.profitAmount ?? row.ProfitAmount))}</td>
      </tr>`;
    })
    .join("\n");
};

export default function ProfitabilityReportPrintPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const { templateHtml, loading: loadingTemplate } = useReportTemplate(REPORT_KEY);
  const { letterheadTokens, warehouseData } = useTemplateLetterhead();

  const fromDate = router.query.fromDate ? String(router.query.fromDate) : "";
  const toDate = router.query.toDate ? String(router.query.toDate) : "";
  const customerId = Number(router.query.customerId ?? 0) || 0;
  const supplierId = Number(router.query.supplierId ?? 0) || 0;
  const categoryId = Number(router.query.categoryId ?? 0) || 0;
  const subCategoryId = Number(router.query.subCategoryId ?? 0) || 0;
  const productId = Number(router.query.productId ?? 0) || 0;

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
          supplierId: String(supplierId),
          categoryId: String(categoryId),
          subCategoryId: String(subCategoryId),
          productId: String(productId),
        });

        const res = await fetch(`${BASE_URL}/SalesInvoice/GetProfitabilitySummary?${params}`, {
          method: "GET",
          headers: authHeaders(),
        });
        const json = await res.json().catch(() => null);

        if (!res.ok) {
          toast.error(json?.message || "Failed to load profitability report.");
          setRows([]);
        } else {
          const result = json?.result ?? json?.Result ?? [];
          setRows(Array.isArray(result) ? result : []);
        }
      } catch (e) {
        console.error("[ProfitabilityReportPrint] load failed", e);
        toast.error("Failed to load profitability report.");
        setRows([]);
      } finally {
        setLoadingData(false);
      }
    };

    load();
  }, [
    router.isReady,
    fromDate,
    toDate,
    customerId,
    supplierId,
    categoryId,
    subCategoryId,
    productId,
  ]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          acc.sales += Number(row.salesAmount ?? row.SalesAmount ?? 0) || 0;
          acc.cost += Number(row.costAmount ?? row.CostAmount ?? 0) || 0;
          acc.profit += Number(row.profitAmount ?? row.ProfitAmount ?? 0) || 0;
          return acc;
        },
        { sales: 0, cost: 0, profit: 0 }
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
      supplierFilter: toFilterLabel(router.query.supplierName, "All Suppliers"),
      categoryFilter: toFilterLabel(router.query.categoryName, "All Categories"),
      subCategoryFilter: toFilterLabel(router.query.subCategoryName, "All Sub Categories"),
      productFilter: toFilterLabel(router.query.productName, "All Items"),
      totalRows: String(rows.length),
      totalSales: formatAmount(totals.sales),
      totalCost: formatAmount(totals.cost),
      totalProfit: formatAmount(totals.profit),
    }),
    [
      letterheadTokens,
      warehouseData?.name,
      fromDate,
      toDate,
      router.query.customerName,
      router.query.supplierName,
      router.query.categoryName,
      router.query.subCategoryName,
      router.query.productName,
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
        loadingText="Loading profitability report…"
        errorText="No profitability report available to print."
        downloadName={`ProfitabilityReport_${new Date().toISOString().slice(0, 10)}`}
        showDownloadPdf={false}
      />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
