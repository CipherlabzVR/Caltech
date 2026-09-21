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

const REPORT_KEY = "SALESSUMMARY";

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

const EMPTY_LINE_ITEMS_HTML = `<tr><td colspan="9" style="text-align:center;padding:16px;">No sales invoices found for the selected filters.</td></tr>`;

const mapSalesSummaryLine = (row) => {
  const documentDate = row.documentDate ?? row.DocumentDate;
  return {
    documentDate: documentDate ? formatDate(documentDate) : "—",
    documentNo: row.documentNo ?? row.DocumentNo ?? "—",
    customerName: row.customerName ?? row.CustomerName ?? "—",
    paymentType: row.paymentType ?? row.PaymentType ?? "—",
    grossTotal: formatAmount(row.grossTotal ?? row.GrossTotal),
    netTotal: formatAmount(row.netTotal ?? row.NetTotal),
    paymentAmount: formatAmount(row.paymentAmount ?? row.PaymentAmount),
    balance: formatAmount(row.balance ?? row.Balance),
    remark: (row.remark ?? row.Remark) || "—",
  };
};

const buildLineItemsRows = (rows) => {
  if (!rows || rows.length === 0) return EMPTY_LINE_ITEMS_HTML;

  return rows
    .map((row) => {
      const t = mapSalesSummaryLine(row);
      return `<tr>
        <td>${escapeHtml(t.documentDate)}</td>
        <td>${escapeHtml(t.documentNo)}</td>
        <td>${escapeHtml(t.customerName)}</td>
        <td>${escapeHtml(t.paymentType)}</td>
        <td class="num">${escapeHtml(t.grossTotal)}</td>
        <td class="num">${escapeHtml(t.netTotal)}</td>
        <td class="num">${escapeHtml(t.paymentAmount)}</td>
        <td class="num">${escapeHtml(t.balance)}</td>
        <td>${escapeHtml(t.remark)}</td>
      </tr>`;
    })
    .join("\n");
};

const buildLineTokenMaps = (rows) => (rows || []).map(mapSalesSummaryLine);

export default function SalesSummaryPrintPage() {
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
  const paymentType = Number(router.query.paymentType ?? 0) || 0;

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
          paymentType: String(paymentType),
        });

        const res = await fetch(`${BASE_URL}/SalesInvoice/GetSalesSummary?${params}`, {
          method: "GET",
          headers: authHeaders(),
        });
        const json = await res.json().catch(() => null);

        if (!res.ok) {
          toast.error(json?.message || "Failed to load sales summary.");
          setRows([]);
        } else {
          const result = json?.result ?? json?.Result ?? [];
          setRows(Array.isArray(result) ? result : []);
        }
      } catch (e) {
        console.error("[SalesSummaryPrint] load failed", e);
        toast.error("Failed to load sales summary.");
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
    paymentType,
  ]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          acc.gross += Number(row.grossTotal ?? row.GrossTotal ?? 0) || 0;
          acc.net += Number(row.netTotal ?? row.NetTotal ?? 0) || 0;
          acc.paid += Number(row.paymentAmount ?? row.PaymentAmount ?? 0) || 0;
          acc.balance += Number(row.balance ?? row.Balance ?? 0) || 0;
          return acc;
        },
        { gross: 0, net: 0, paid: 0, balance: 0 }
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
      paymentTypeFilter: toFilterLabel(router.query.paymentTypeName, "All Payment Types"),
      totalInvoices: String(rows.length),
      totalGross: formatAmount(totals.gross),
      totalNet: formatAmount(totals.net),
      totalPaid: formatAmount(totals.paid),
      totalBalance: formatAmount(totals.balance),
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
      router.query.paymentTypeName,
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
        loadingText="Loading sales summary…"
        errorText="No sales summary available to print."
        downloadName={`SalesSummary_${new Date().toISOString().slice(0, 10)}`}
        showDownloadPdf={false}
      />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
