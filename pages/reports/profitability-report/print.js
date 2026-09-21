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

const EMPTY_LINE_ITEMS_HTML = `<tr><td colspan="8" style="text-align:center;padding:16px;">No profitability data found for the selected filters.</td></tr>`;

// Display API amounts as-is. Profit is already Sold Total - Cost Total from the backend;
// CostAmount is the line's total cost, so Qty must not be applied again.
const mapProfitabilityLine = (row) => {
  const documentDate = row.documentDate ?? row.DocumentDate;
  return {
    documentDate: documentDate ? formatDate(documentDate) : "—",
    documentNo: row.documentNo ?? row.DocumentNo ?? "—",
    customerName: row.customerName ?? row.CustomerName ?? "—",
    productCode: row.productCode ?? row.ProductCode ?? "—",
    productName: row.productName ?? row.ProductName ?? "—",
    qty: formatAmount(row.qty ?? row.Qty),
    salesAmount: formatAmount(row.salesAmount ?? row.SalesAmount),
    profitAmount: formatAmount(row.profitAmount ?? row.ProfitAmount),
  };
};

const buildLineItemsRows = (rows) => {
  if (!rows || rows.length === 0) return EMPTY_LINE_ITEMS_HTML;

  return rows
    .map((row) => {
      const t = mapProfitabilityLine(row);
      return `<tr>
        <td>${escapeHtml(t.documentDate)}</td>
        <td>${escapeHtml(t.documentNo)}</td>
        <td>${escapeHtml(t.customerName)}</td>
        <td>${escapeHtml(t.productCode)}</td>
        <td>${escapeHtml(t.productName)}</td>
        <td class="num">${escapeHtml(t.qty)}</td>
        <td class="num">${escapeHtml(t.salesAmount)}</td>
        <td class="num">${escapeHtml(t.profitAmount)}</td>
      </tr>`;
    })
    .join("\n");
};

const buildLineTokenMaps = (rows) => (rows || []).map(mapProfitabilityLine);

const resolveWarehouseName = (...values) => {
  for (const value of values) {
    const text = value == null ? "" : String(value).trim();
    if (text && text !== "—" && text !== "-") return text;
  }
  return "";
};

export default function ProfitabilityReportPrintPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [reportWarehouseName, setReportWarehouseName] = useState("");
  const [loadingData, setLoadingData] = useState(true);

  const sessionWarehouseId =
    typeof window !== "undefined" ? localStorage.getItem("warehouse") : "";
  const queryWarehouseId = router.query.warehouseId ? String(router.query.warehouseId) : "";
  const letterheadWarehouseId = queryWarehouseId || sessionWarehouseId || undefined;

  const { templateHtml, loading: loadingTemplate } = useReportTemplate(REPORT_KEY);
  const { letterheadTokens, warehouseData } = useTemplateLetterhead(letterheadWarehouseId);

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
      const warehouseId = queryWarehouseId || getWarehouseId();

      if (!warehouseId) {
        toast.error("Warehouse not found. Please sign in again.");
        setRows([]);
        setReportWarehouseName("");
        setLoadingData(false);
        return;
      }

      if (!fromDate || !toDate) {
        toast.error("From Date and To Date are required.");
        setRows([]);
        setReportWarehouseName("");
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
          setReportWarehouseName("");
        } else {
          const result = json?.result ?? json?.Result ?? {};
          const lines = Array.isArray(result)
            ? result
            : result.lines ?? result.Lines ?? [];
          setRows(Array.isArray(lines) ? lines : []);
          const apiWarehouseName = resolveWarehouseName(
            result.warehouseName,
            result.WarehouseName,
            lines[0]?.warehouseName,
            lines[0]?.WarehouseName
          );
          setReportWarehouseName(apiWarehouseName);
        }
      } catch (e) {
        console.error("[ProfitabilityReportPrint] load failed", e);
        toast.error("Failed to load profitability report.");
        setRows([]);
        setReportWarehouseName("");
      } finally {
        setLoadingData(false);
      }
    };

    load();
  }, [
    router.isReady,
    fromDate,
    toDate,
    queryWarehouseId,
    customerId,
    supplierId,
    categoryId,
    subCategoryId,
    productId,
  ]);

  // API is the source of truth. Invoice line CostAmount is already the line's total cost
  // (not unit cost), so do not multiply by Qty here. Totals: SUM(sales) - SUM(cost).
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
      warehouseName:
        resolveWarehouseName(
          reportWarehouseName,
          warehouseData?.name,
          warehouseData?.Name
        ) || "—",
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
      reportWarehouseName,
      warehouseData?.name,
      warehouseData?.Name,
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
        loadingText="Loading profitability report…"
        errorText="No profitability report available to print."
        downloadName={`ProfitabilityReport_${new Date().toISOString().slice(0, 10)}`}
        showDownloadPdf={false}
      />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
