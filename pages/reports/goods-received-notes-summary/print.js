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

const REPORT_KEY = "GRNNOTESSUMMARY";

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
    return `<tr><td colspan="8" style="text-align:center;padding:16px;">No goods received notes found for the selected filters.</td></tr>`;
  }

  return rows
    .map((row) => {
      const grnDate = row.grnDate ?? row.GrnDate;
      const documentNo = row.documentNo ?? row.DocumentNo ?? "—";
      const purchaseOrderNo = row.purchaseOrderNo ?? row.PurchaseOrderNo;
      const referanceNo = row.referanceNo ?? row.ReferanceNo;
      const supplierName = row.supplierName ?? row.SupplierName ?? "—";
      const totalQty = row.totalQty ?? row.TotalQty ?? 0;
      const totalAmount = row.totalAmount ?? row.TotalAmount ?? 0;
      const remark = row.remark ?? row.Remark;

      return `<tr>
        <td>${escapeHtml(grnDate ? formatDate(grnDate) : "—")}</td>
        <td>${escapeHtml(documentNo || "—")}</td>
        <td>${escapeHtml(purchaseOrderNo || "—")}</td>
        <td>${escapeHtml(referanceNo || "—")}</td>
        <td>${escapeHtml(supplierName || "—")}</td>
        <td class="num">${escapeHtml(formatQty(totalQty))}</td>
        <td class="num">${escapeHtml(formatAmount(totalAmount))}</td>
        <td>${escapeHtml(remark || "—")}</td>
      </tr>`;
    })
    .join("\n");
};

export default function GoodsReceivedNotesSummaryPrintPage() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
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
          supplierId: String(supplierId),
          categoryId: String(categoryId),
          subCategoryId: String(subCategoryId),
          productId: String(productId),
        });

        const res = await fetch(
          `${BASE_URL}/GoodReceivedNote/GetGoodsReceivedNotesSummary?${params}`,
          { method: "GET", headers: authHeaders() }
        );
        const json = await res.json().catch(() => null);

        if (!res.ok) {
          toast.error(json?.message || "Failed to load goods received notes summary.");
          setRows([]);
        } else {
          const result = json?.result ?? json?.Result ?? [];
          setRows(Array.isArray(result) ? result : []);
        }
      } catch (e) {
        console.error("[GoodsReceivedNotesSummaryPrint] load failed", e);
        toast.error("Failed to load goods received notes summary.");
        setRows([]);
      } finally {
        setLoadingData(false);
      }
    };

    load();
  }, [router.isReady, fromDate, toDate, supplierId, categoryId, subCategoryId, productId]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.qty += Number(row.totalQty ?? row.TotalQty ?? 0) || 0;
        acc.amount += Number(row.totalAmount ?? row.TotalAmount ?? 0) || 0;
        return acc;
      },
      { qty: 0, amount: 0 }
    );
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
      supplierFilter: toFilterLabel(router.query.supplierName, "All Suppliers"),
      categoryFilter: toFilterLabel(router.query.categoryName, "All Categories"),
      subCategoryFilter: toFilterLabel(router.query.subCategoryName, "All Sub Categories"),
      productFilter: toFilterLabel(router.query.productName, "All Items"),
      totalGrns: String(rows.length),
      totalQty: formatQty(totals.qty),
      totalAmount: formatAmount(totals.amount),
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
      rows.length,
      totals.qty,
      totals.amount,
    ]
  );

  const finalHtml = useMemo(() => {
    if (!templateHtml || loadingData) return "";
    return applyTemplate(templateHtml, tokenMap, lineItemsRows);
  }, [templateHtml, loadingData, tokenMap, lineItemsRows]);

  const isLoading = loadingData || loadingTemplate;
  const downloadName = `GoodsReceivedNotesSummary_${new Date().toISOString().slice(0, 10)}`;

  return (
    <>
      <TemplatePrintFrame
        finalHtml={finalHtml}
        loading={isLoading}
        loadingText="Loading goods received notes summary…"
        errorText="No goods received notes summary available to print."
        downloadName={downloadName}
        showDownloadPdf={false}
      />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
