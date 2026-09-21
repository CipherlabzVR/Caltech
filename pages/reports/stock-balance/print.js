import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatCurrency, formatDate, formatDateWithTime } from "@/components/utils/formatHelper";
import TemplatePrintFrame from "@/components/ReportTemplate/TemplatePrintFrame";
import useReportTemplate from "@/components/ReportTemplate/useReportTemplate";
import useTemplateLetterhead from "@/components/ReportTemplate/useTemplateLetterhead";
import { applyTemplate, escapeHtml } from "@/components/ReportTemplate/applyTemplate";

const REPORT_KEY = "STOCKBALANCESTATEMENT";

const authHeaders = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
  "Content-Type": "application/json",
});

const getWarehouseId = () =>
  typeof window !== "undefined" ? localStorage.getItem("warehouse") : null;

const getCurrentUser = () =>
  typeof window !== "undefined" ? localStorage.getItem("name") || "—" : "—";

const formatQty = (value) => {
  const numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) return "0";
  return Number.isInteger(numeric)
    ? numeric.toLocaleString("en-US")
    : numeric.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const toFilterLabel = (value, allLabel) => {
  const text = value == null ? "" : String(value).trim();
  if (!text || text === "0" || text.toLowerCase() === "all") return allLabel;
  return text;
};

const EMPTY_LINE_ITEMS_HTML = `<tr><td colspan="10" style="text-align:center;padding:16px;">No stock balance lines found for the selected filters.</td></tr>`;

const mapStockBalanceLine = (line) => {
  const qty = Number(line.bookBalanceQuantity ?? line.BookBalanceQuantity ?? 0);
  const unitCost = Number(
    line.costPrice ?? line.CostPrice ?? line.unitPrice ?? line.UnitPrice ?? 0
  );
  const totalCost = qty * unitCost;
  return {
    supplierName: line.supplierName ?? line.SupplierName ?? "—",
    categoryName: line.categoryName ?? line.CategoryName ?? "—",
    subCategoryName: line.subCategoryName ?? line.SubCategoryName ?? "—",
    uom: line.uom ?? line.UOM ?? "—",
    grnNumber: line.documentNumber ?? line.DocumentNumber ?? "—",
    batchNumber: line.batchNumber ?? line.BatchNumber ?? "—",
    expiryDate:
      line.expiryDate || line.ExpiryDate
        ? formatDate(line.expiryDate ?? line.ExpiryDate)
        : "—",
    qty: formatQty(qty),
    unitCost: formatCurrency(unitCost),
    totalCost: formatCurrency(totalCost),
  };
};

const buildLineItemsRows = (lines) => {
  if (!lines || lines.length === 0) return EMPTY_LINE_ITEMS_HTML;

  return lines
    .map((line) => {
      const t = mapStockBalanceLine(line);
      return `<tr>
        <td>${escapeHtml(t.supplierName)}</td>
        <td>${escapeHtml(t.categoryName)}</td>
        <td>${escapeHtml(t.subCategoryName)}</td>
        <td>${escapeHtml(t.uom)}</td>
        <td>${escapeHtml(t.grnNumber)}</td>
        <td>${escapeHtml(t.batchNumber)}</td>
        <td>${escapeHtml(t.expiryDate)}</td>
        <td class="num">${escapeHtml(t.qty)}</td>
        <td class="num">${escapeHtml(t.unitCost)}</td>
        <td class="num">${escapeHtml(t.totalCost)}</td>
      </tr>`;
    })
    .join("\n");
};

const buildLineTokenMaps = (lines) => (lines || []).map(mapStockBalanceLine);

export default function StockBalanceStatementPrintPage() {
  const router = useRouter();
  const [lines, setLines] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const { templateHtml, loading: loadingTemplate } = useReportTemplate(REPORT_KEY);
  const { letterheadTokens, warehouseData } = useTemplateLetterhead();

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
        setLines([]);
        setLoadingData(false);
        return;
      }

      try {
        const params = new URLSearchParams({
          warehouseId: String(warehouseId),
          supplierId: String(supplierId),
          categoryId: String(categoryId),
          subCategoryId: String(subCategoryId),
          productId: String(productId),
        });

        const res = await fetch(`${BASE_URL}/StockBalance/GetStockBalanceStatement?${params}`, {
          method: "GET",
          headers: authHeaders(),
        });
        const json = await res.json().catch(() => null);

        if (!res.ok) {
          toast.error(json?.message || "Failed to load stock balance statement.");
          setLines([]);
        } else {
          const result = json?.result;
          setLines(Array.isArray(result) ? result : result?.items ?? []);
        }
      } catch (e) {
        console.error("[StockBalanceStatementPrint] load failed", e);
        toast.error("Failed to load stock balance statement.");
        setLines([]);
      } finally {
        setLoadingData(false);
      }
    };

    load();
  }, [router.isReady, supplierId, categoryId, subCategoryId, productId]);

  const totals = useMemo(() => {
    return lines.reduce(
      (acc, line) => {
        const qty = Number(line.bookBalanceQuantity ?? line.BookBalanceQuantity ?? 0);
        const unitCost = Number(line.costPrice ?? line.CostPrice ?? line.unitPrice ?? line.UnitPrice ?? 0);
        acc.qty += qty;
        acc.value += qty * unitCost;
        return acc;
      },
      { qty: 0, value: 0 }
    );
  }, [lines]);

  const lineItemsRows = useMemo(() => buildLineItemsRows(lines), [lines]);

  const tokenMap = useMemo(
    () => ({
      ...letterheadTokens,
      generatedOn: formatDateWithTime(new Date()) || "—",
      warehouseName: warehouseData?.name || "—",
      currentUser: getCurrentUser(),
      supplierFilter: toFilterLabel(router.query.supplierName, "All Suppliers"),
      categoryFilter: toFilterLabel(router.query.categoryName, "All Categories"),
      subCategoryFilter: toFilterLabel(router.query.subCategoryName, "All Sub Categories"),
      productFilter: toFilterLabel(router.query.productName, "All Items"),
      totalQty: formatQty(totals.qty),
      totalValue: formatCurrency(totals.value),
    }),
    [
      letterheadTokens,
      warehouseData?.name,
      router.query.supplierName,
      router.query.categoryName,
      router.query.subCategoryName,
      router.query.productName,
      totals.qty,
      totals.value,
    ]
  );

  const finalHtml = useMemo(() => {
    if (!templateHtml || loadingData) return "";
    return applyTemplate(templateHtml, tokenMap, lineItemsRows, {
      lineTokenMaps: buildLineTokenMaps(lines),
      emptyLineItemsHtml: EMPTY_LINE_ITEMS_HTML,
    });
  }, [templateHtml, loadingData, tokenMap, lineItemsRows, lines]);

  const isLoading = loadingData || loadingTemplate;
  const downloadName = `StockBalanceStatement_${new Date().toISOString().slice(0, 10)}`;

  return (
    <>
      <TemplatePrintFrame
        finalHtml={finalHtml}
        loading={isLoading}
        loadingText="Loading stock balance statement…"
        errorText="No stock balance statement available to print."
        downloadName={downloadName}
        showDownloadPdf={false}
      />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
