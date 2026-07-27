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

const REPORT_KEY_LIST = "STOCKDETAILS";
const REPORT_KEY_ITEM = "STOCKDETAILSITEM";

const SORT_LABELS = {
  default: "Default (API order)",
  "price-low-high": "Price: Low to High",
  "price-high-low": "Price: High to Low",
  "a-z": "Name: A - Z",
  "z-a": "Name: Z - A",
  "code-asc": "Item Code: Low → High",
  "code-desc": "Item Code: High → Low",
};

const authHeaders = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
  "Content-Type": "application/json",
});

const getWarehouseId = () =>
  typeof window !== "undefined" ? localStorage.getItem("warehouse") : null;

const getItemCodeSortString = (item) => {
  const raw = item?.code ?? item?.Code;
  if (raw === null || raw === undefined) return "";
  const s = String(raw).trim();
  if (s === "" || s === "null" || s === "undefined") return "";
  return s;
};

const compareItemCodeSort = (a, b, direction) => {
  const sa = getItemCodeSortString(a);
  const sb = getItemCodeSortString(b);
  const cmp = sa.localeCompare(sb, undefined, { numeric: true, sensitivity: "base" });
  return direction === "desc" ? -cmp : cmp;
};

const sortItems = (items, sortBy) => {
  if (!items?.length) return [];
  const sorted = [...items];
  switch (sortBy) {
    case "price-low-high":
      sorted.sort((a, b) => Number(a.salingPrice ?? 0) - Number(b.salingPrice ?? 0));
      break;
    case "price-high-low":
      sorted.sort((a, b) => Number(b.salingPrice ?? 0) - Number(a.salingPrice ?? 0));
      break;
    case "a-z":
      sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      break;
    case "z-a":
      sorted.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
      break;
    case "code-asc":
      sorted.sort((a, b) => compareItemCodeSort(a, b, "asc"));
      break;
    case "code-desc":
      sorted.sort((a, b) => compareItemCodeSort(a, b, "desc"));
      break;
    default:
      break;
  }
  return sorted;
};

const formatQty = (value) => {
  const numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) return "0";
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(2);
};

const parsePrintFlags = (query) => ({
  showBatch: query.showBatch !== "0",
  showExpiry: query.showExpiry !== "0",
  showCostPrice: query.showCostPrice === "1",
});

const fetchStockLinesForProduct = async (productId, warehouseId) => {
  if (!productId || !warehouseId) return [];
  const res = await fetch(
    `${BASE_URL}/StockBalance/GetAllProductStockBalanceLine?warehouseId=${warehouseId}&productId=${productId}`,
    { method: "GET", headers: authHeaders() }
  );
  const json = await res.json().catch(() => null);
  if (!res.ok) return [];
  const result = json?.result;
  if (Array.isArray(result)) return result;
  if (result?.items) return result.items;
  return [];
};

const buildStockLineTableHead = (flags) => {
  const cols = ["#"];
  if (flags.showBatch) cols.push("Batch No");
  if (flags.showExpiry) cols.push("EXP Date");
  cols.push("Stock Balance", "Selling Price", "Category", "Sub Category", "UOM");
  if (flags.showCostPrice) cols.push("Cost Price");
  return cols
    .map((col) => {
      const isNum = col.includes("Balance") || col.includes("Price");
      return `<th${isNum ? ' class="num"' : ""}>${escapeHtml(col)}</th>`;
    })
    .join("");
};

const buildStockLineRows = (lines, flags, fallbackProduct = {}) => {
  if (!lines || lines.length === 0) {
    const colSpan = 6 + (flags.showBatch ? 1 : 0) + (flags.showExpiry ? 1 : 0) + (flags.showCostPrice ? 1 : 0);
    return `<tr><td colspan="${colSpan}" style="text-align:center;padding:12px;">No stock balance details found.</td></tr>`;
  }

  return lines
    .map((line, index) => {
      const cells = [`<td>${index + 1}</td>`];
      if (flags.showBatch) {
        cells.push(`<td>${escapeHtml(line.batchNumber ?? "—")}</td>`);
      }
      if (flags.showExpiry) {
        cells.push(`<td>${escapeHtml(line.expiryDate ? formatDate(line.expiryDate) : "—")}</td>`);
      }
      const qty = line.bookBalanceQuantity ?? line.BookBalanceQuantity;
      cells.push(`<td class="num">${escapeHtml(qty != null ? formatQty(qty) : "—")}</td>`);
      cells.push(
        `<td class="num">${escapeHtml(line.sellingPrice != null ? formatCurrency(line.sellingPrice) : "—")}</td>`
      );
      cells.push(
        `<td>${escapeHtml(line.categoryName ?? line.CategoryName ?? fallbackProduct.categoryName ?? "—")}</td>`
      );
      cells.push(
        `<td>${escapeHtml(line.subCategoryName ?? line.SubCategoryName ?? fallbackProduct.subCategoryName ?? "—")}</td>`
      );
      cells.push(`<td>${escapeHtml(line.uom ?? line.UOM ?? fallbackProduct.uomName ?? "—")}</td>`);
      if (flags.showCostPrice) {
        cells.push(
          `<td class="num">${escapeHtml(line.costPrice != null ? formatCurrency(line.costPrice) : "—")}</td>`
        );
      }
      return `<tr>${cells.join("")}</tr>`;
    })
    .join("\n");
};

const buildNestedStockLinesHtml = (lines, flags, fallbackProduct) => {
  const head = buildStockLineTableHead(flags);
  const body = buildStockLineRows(lines, flags, fallbackProduct);
  return `<table class="nested-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
};

const buildListLineItemsRows = (items, stockLinesMap, flags, includeDetails) => {
  if (!items || items.length === 0) {
    return `<tr><td colspan="8" style="text-align:center;padding:16px;">No stock items available.</td></tr>`;
  }

  return items
    .map((item, index) => {
      const productId = item.id;
      const summaryRow = `<tr class="item-header">
        <td>${index + 1}</td>
        <td>${escapeHtml(item.code ?? item.Code ?? "—")}</td>
        <td>${escapeHtml(item.name || "—")}</td>
        <td>${escapeHtml(item.categoryName ?? "—")}</td>
        <td>${escapeHtml(item.subCategoryName ?? "—")}</td>
        <td>${escapeHtml(item.supplierName ?? "—")}</td>
        <td>${escapeHtml(item.uomName ?? "—")}</td>
        <td class="num">${escapeHtml(formatQty(item.qty))}</td>
      </tr>`;

      if (!includeDetails) return summaryRow;

      const lines = stockLinesMap[productId] ?? [];
      const nested = buildNestedStockLinesHtml(lines, flags, item);
      const detailRow = `<tr><td colspan="8" class="nested-wrap">${nested}</td></tr>`;
      return `${summaryRow}\n${detailRow}`;
    })
    .join("\n");
};

const fetchStockLinesMap = async (items, warehouseId) => {
  const map = {};
  const batchSize = 8;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (item) => {
        if (!item?.id) return;
        map[item.id] = await fetchStockLinesForProduct(item.id, warehouseId);
      })
    );
  }
  return map;
};

export default function StockDetailsPrintPage() {
  const router = useRouter();
  const productId = router.query.productId;
  const isItemMode = Boolean(productId);
  const searchQuery = router.query.search ?? "";
  const sortBy = router.query.sortBy ?? "code-asc";
  const includeDetails = router.query.includeDetails !== "0";
  const printFlags = useMemo(() => parsePrintFlags(router.query), [router.query]);

  const [items, setItems] = useState([]);
  const [stockLinesMap, setStockLinesMap] = useState({});
  const [itemStockLines, setItemStockLines] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const reportKey = isItemMode ? REPORT_KEY_ITEM : REPORT_KEY_LIST;
  const { templateHtml, loading: loadingTemplate } = useReportTemplate(reportKey);
  const { letterheadTokens, warehouseData } = useTemplateLetterhead();

  useEffect(() => {
    if (!router.isReady) return;

    const load = async () => {
      setLoadingData(true);
      const warehouseId = getWarehouseId();

      try {
        if (isItemMode) {
          const lines = await fetchStockLinesForProduct(productId, warehouseId);
          setItemStockLines(lines);
          setItems([]);
          setStockLinesMap({});
        } else {
          const searchParam = searchQuery ? encodeURIComponent(String(searchQuery)) : "null";
          const res = await fetch(
            `${BASE_URL}/Items/GetAllItemWithZeroQuantityPage?SkipCount=0&MaxResultCount=10000&Search=${searchParam}`,
            { method: "GET", headers: authHeaders() }
          );
          const json = await res.json().catch(() => null);
          const list = sortItems(json?.result?.items ?? [], String(sortBy));

          if (!res.ok) {
            toast.error(json?.message || "Failed to load stock details.");
            setItems([]);
            setStockLinesMap({});
          } else {
            setItems(list);
            if (includeDetails && list.length > 0) {
              const linesMap = await fetchStockLinesMap(list, warehouseId);
              setStockLinesMap(linesMap);
            } else {
              setStockLinesMap({});
            }
          }
          setItemStockLines([]);
        }
      } catch (e) {
        console.error("[StockDetailsPrint] load failed", e);
        toast.error("Failed to load stock details.");
        setItems([]);
        setStockLinesMap({});
        setItemStockLines([]);
      } finally {
        setLoadingData(false);
      }
    };

    load();
  }, [router.isReady, isItemMode, productId, searchQuery, sortBy, includeDetails]);

  const lineItemsRows = useMemo(
    () => buildListLineItemsRows(items, stockLinesMap, printFlags, includeDetails),
    [items, stockLinesMap, printFlags, includeDetails]
  );

  const stockLineRows = useMemo(() => {
    const fallback = {
      categoryName: router.query.categoryName,
      subCategoryName: router.query.subCategoryName,
      uomName: router.query.uomName,
    };
    return buildStockLineRows(itemStockLines, printFlags, fallback);
  }, [itemStockLines, printFlags, router.query.categoryName, router.query.subCategoryName, router.query.uomName]);

  const totalStockQuantity = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.qty ?? 0), 0),
    [items]
  );

  const itemTotalStock = useMemo(() => {
    if (isItemMode && router.query.stockLevel != null && router.query.stockLevel !== "") {
      return formatQty(router.query.stockLevel);
    }
    return formatQty(
      itemStockLines.reduce(
        (sum, line) => sum + Number(line.bookBalanceQuantity ?? line.BookBalanceQuantity ?? 0),
        0
      )
    );
  }, [isItemMode, itemStockLines, router.query.stockLevel]);

  const listTokenMap = useMemo(
    () => ({
      ...letterheadTokens,
      generatedOn: formatDateWithTime(new Date()) || "—",
      warehouseName: warehouseData?.name || "—",
      searchFilter: searchQuery ? String(searchQuery) : "All",
      sortBy: SORT_LABELS[sortBy] || String(sortBy),
      totalItems: String(items.length),
      totalStockQuantity: formatQty(totalStockQuantity),
    }),
    [letterheadTokens, warehouseData?.name, searchQuery, sortBy, items.length, totalStockQuantity]
  );

  const itemTokenMap = useMemo(
    () => ({
      ...letterheadTokens,
      generatedOn: formatDateWithTime(new Date()) || "—",
      warehouseName: warehouseData?.name || "—",
      itemCode: String(router.query.itemCode || "—"),
      itemName: String(router.query.itemName || "—"),
      categoryName: String(router.query.categoryName || "—"),
      subCategoryName: String(router.query.subCategoryName || "—"),
      supplierName: String(router.query.supplierName || "—"),
      uomName: String(router.query.uomName || "—"),
      totalStockLevel: itemTotalStock,
      stockLineRows,
    }),
    [
      letterheadTokens,
      warehouseData?.name,
      router.query.itemCode,
      router.query.itemName,
      router.query.categoryName,
      router.query.subCategoryName,
      router.query.supplierName,
      router.query.uomName,
      itemTotalStock,
      stockLineRows,
    ]
  );

  const finalHtml = useMemo(() => {
    if (!templateHtml || loadingData) return "";
    if (isItemMode) {
      return applyTemplate(templateHtml, itemTokenMap);
    }
    return applyTemplate(templateHtml, listTokenMap, lineItemsRows);
  }, [templateHtml, loadingData, isItemMode, itemTokenMap, listTokenMap, lineItemsRows]);

  const isLoading = loadingData || loadingTemplate;
  const downloadName = isItemMode
    ? `StockDetails_${router.query.itemCode || productId || "item"}`
    : `StockDetails_${new Date().toISOString().slice(0, 10)}`;

  return (
    <>
      <TemplatePrintFrame
        finalHtml={finalHtml}
        loading={isLoading}
        loadingText={isItemMode ? "Loading item stock details…" : "Loading stock details…"}
        errorText={isItemMode ? "Item stock details not found." : "No stock details available to print."}
        downloadName={downloadName}
      />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
