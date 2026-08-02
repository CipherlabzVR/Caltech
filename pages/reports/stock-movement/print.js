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

const REPORT_KEY = "STOCKMOVEMENTREPORT";

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
  if (Number.isNaN(numeric)) return "0.00";
  return numeric.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const toFilterLabel = (value, allLabel) => {
  const text = value == null ? "" : String(value).trim();
  if (!text || text === "0" || text.toLowerCase() === "all") return allLabel;
  return text;
};

const getTxQtyIn = (tx) => {
  const qtyIn = Number(tx?.qtyIn ?? tx?.QtyIn ?? 0);
  if (qtyIn) return qtyIn;
  const qty = Number(tx?.qty ?? tx?.Qty ?? 0);
  return qty > 0 ? qty : 0;
};

const getTxQtyOut = (tx) => {
  const qtyOut = Number(tx?.qtyOut ?? tx?.QtyOut ?? 0);
  if (qtyOut) return qtyOut;
  const qty = Number(tx?.qty ?? tx?.Qty ?? 0);
  return qty < 0 ? Math.abs(qty) : 0;
};

const buildLineItemsRows = (groups) => {
  if (!groups || groups.length === 0) {
    return `<tr><td colspan="9" style="text-align:center;padding:16px;">No stock movement lines found for the selected filters.</td></tr>`;
  }

  return groups
    .map((group) => {
      const productCode = group.productCode ?? group.ProductCode ?? "—";
      const productName = group.productName ?? group.ProductName ?? "—";
      const startStock = Number(group.startStock ?? group.StartStock ?? 0);
      const endStock = Number(group.endStock ?? group.EndStock ?? startStock);
      const transactions = [...(group.transactions ?? group.Transactions ?? [])].sort(
        (a, b) => new Date(a.date || a.Date || 0) - new Date(b.date || b.Date || 0)
      );

      const headerRow = `<tr class="item-header">
        <td colspan="9">${escapeHtml(`${productCode} - ${productName}`)}</td>
      </tr>`;

      const startRow = `<tr class="stock-mark">
        <td>Start Stock</td>
        <td>—</td>
        <td>—</td>
        <td>${escapeHtml(productCode)}</td>
        <td>${escapeHtml(productName)}</td>
        <td>—</td>
        <td class="num">0.00</td>
        <td class="num">0.00</td>
        <td class="num">${escapeHtml(formatQty(startStock))}</td>
      </tr>`;

      let running = startStock;
      const txRows =
        transactions.length === 0
          ? `<tr><td colspan="9" style="text-align:center;color:#777;padding:10px;">No transactions in period</td></tr>`
          : transactions
              .map((tx) => {
                const qtyIn = getTxQtyIn(tx);
                const qtyOut = getTxQtyOut(tx);
                const apiBalance = tx.balanceAfter ?? tx.BalanceAfter;
                running =
                  apiBalance !== null && apiBalance !== undefined && apiBalance !== ""
                    ? Number(apiBalance)
                    : running + qtyIn - qtyOut;

                return `<tr>
                  <td>${escapeHtml(tx.date || tx.Date ? formatDate(tx.date ?? tx.Date) : "—")}</td>
                  <td>${escapeHtml(tx.documentNo ?? tx.DocumentNo ?? "—")}</td>
                  <td>${escapeHtml(tx.transactionTypeName ?? tx.TransactionTypeName ?? "—")}</td>
                  <td>${escapeHtml(productCode)}</td>
                  <td>${escapeHtml(productName)}</td>
                  <td>${escapeHtml(tx.batch ?? tx.Batch ?? "—")}</td>
                  <td class="num">${escapeHtml(formatQty(qtyIn))}</td>
                  <td class="num">${escapeHtml(formatQty(qtyOut))}</td>
                  <td class="num">${escapeHtml(formatQty(running))}</td>
                </tr>`;
              })
              .join("\n");

      const endRow = `<tr class="stock-mark">
        <td>End Stock</td>
        <td>—</td>
        <td>—</td>
        <td>${escapeHtml(productCode)}</td>
        <td>${escapeHtml(productName)}</td>
        <td>—</td>
        <td class="num">0.00</td>
        <td class="num">0.00</td>
        <td class="num">${escapeHtml(formatQty(endStock))}</td>
      </tr>`;

      return `${headerRow}\n${startRow}\n${txRows}\n${endRow}`;
    })
    .join("\n");
};

export default function StockMovementReportPrintPage() {
  const router = useRouter();
  const [groups, setGroups] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const { templateHtml, loading: loadingTemplate } = useReportTemplate(REPORT_KEY);
  const { letterheadTokens, warehouseData } = useTemplateLetterhead();

  const fromDate = router.query.fromDate ? String(router.query.fromDate) : "";
  const toDate = router.query.toDate ? String(router.query.toDate) : "";
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
        setGroups([]);
        setLoadingData(false);
        return;
      }

      if (!fromDate || !toDate) {
        toast.error("From Date and To Date are required.");
        setGroups([]);
        setLoadingData(false);
        return;
      }

      try {
        const params = new URLSearchParams({
          fromDate,
          toDate,
          warehouseId: String(warehouseId),
        });
        if (productId > 0) params.set("productId", String(productId));
        if (supplierId > 0) params.set("supplierId", String(supplierId));
        if (categoryId > 0) params.set("categoryId", String(categoryId));
        if (subCategoryId > 0) params.set("subCategoryId", String(subCategoryId));

        const res = await fetch(
          `${BASE_URL}/StockTransactionsHistory/GetStockTransactionReportByPeriod?${params}`,
          { method: "GET", headers: authHeaders() }
        );
        const json = await res.json().catch(() => null);

        if (!res.ok) {
          toast.error(json?.message || "Failed to load stock movement report.");
          setGroups([]);
        } else {
          const result = json?.result ?? json?.Result ?? [];
          setGroups(Array.isArray(result) ? result : []);
        }
      } catch (e) {
        console.error("[StockMovementReportPrint] load failed", e);
        toast.error("Failed to load stock movement report.");
        setGroups([]);
      } finally {
        setLoadingData(false);
      }
    };

    load();
  }, [router.isReady, fromDate, toDate, supplierId, categoryId, subCategoryId, productId]);

  const totals = useMemo(() => {
    return groups.reduce(
      (acc, group) => {
        const transactions = group.transactions ?? group.Transactions ?? [];
        transactions.forEach((tx) => {
          acc.qtyIn += getTxQtyIn(tx);
          acc.qtyOut += getTxQtyOut(tx);
        });
        return acc;
      },
      { qtyIn: 0, qtyOut: 0 }
    );
  }, [groups]);

  const lineItemsRows = useMemo(() => buildLineItemsRows(groups), [groups]);

  const tokenMap = useMemo(
    () => ({
      ...letterheadTokens,
      generatedOn: formatDateWithTime(new Date()) || "—",
      warehouseName: warehouseData?.name || "—",
      currentUser: getCurrentUser(),
      fromDate: fromDate ? formatDate(fromDate) || fromDate : "—",
      toDate: toDate ? formatDate(toDate) || toDate : "—",
      supplierFilter: toFilterLabel(router.query.supplierName, "All Suppliers"),
      categoryFilter: toFilterLabel(router.query.categoryName, "All Categories"),
      subCategoryFilter: toFilterLabel(router.query.subCategoryName, "All Sub Categories"),
      productFilter: toFilterLabel(router.query.productName, "All Items"),
      totalQtyIn: formatQty(totals.qtyIn),
      totalQtyOut: formatQty(totals.qtyOut),
    }),
    [
      letterheadTokens,
      warehouseData?.name,
      fromDate,
      toDate,
      router.query.supplierName,
      router.query.categoryName,
      router.query.subCategoryName,
      router.query.productName,
      totals.qtyIn,
      totals.qtyOut,
    ]
  );

  const finalHtml = useMemo(() => {
    if (!templateHtml || loadingData) return "";
    return applyTemplate(templateHtml, tokenMap, lineItemsRows);
  }, [templateHtml, loadingData, tokenMap, lineItemsRows]);

  const isLoading = loadingData || loadingTemplate;
  const downloadName = `StockMovementReport_${new Date().toISOString().slice(0, 10)}`;

  return (
    <>
      <TemplatePrintFrame
        finalHtml={finalHtml}
        loading={isLoading}
        loadingText="Loading stock movement report…"
        errorText="No stock movement report available to print."
        downloadName={downloadName}
        showDownloadPdf={false}
      />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
