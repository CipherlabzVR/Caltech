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

const REPORT_KEY = "SHIPMENTSUMMARY";

const STATUS_LABELS = {
  0: "All Statuses",
  1: "Ordered",
  2: "Invoiced",
  3: "Warehouse Issued",
  4: "Dispatched",
  5: "Arrived",
  6: "Customer Warehouse",
  7: "Completed",
};

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

const statusLabelFromCode = (status) => STATUS_LABELS[Number(status ?? 0)] || STATUS_LABELS[0];

const EMPTY_LINE_ITEMS_HTML = `<tr><td colspan="9" style="text-align:center;padding:16px;">No shipments found for the selected filters.</td></tr>`;

const mapShipmentSummaryLine = (row) => {
  const shipmentDate = row.shipmentDate ?? row.ShipmentDate;
  return {
    shipmentDate: shipmentDate ? formatDate(shipmentDate) : "—",
    documentNo: row.documentNo ?? row.DocumentNo ?? "—",
    purchaseOrderNos: (row.purchaseOrderNos ?? row.PurchaseOrderNos) || "—",
    supplierName: row.supplierName ?? row.SupplierName ?? "—",
    referenceNo: (row.referanceNo ?? row.ReferanceNo) || "—",
    status: row.status ?? row.Status ?? "—",
    qty: formatQty(row.totalQty ?? row.TotalQty ?? 0),
    amount: formatAmount(row.totalAmount ?? row.TotalAmount ?? 0),
    remark: (row.remark ?? row.Remark) || "—",
  };
};

const buildLineItemsRows = (rows) => {
  if (!rows || rows.length === 0) return EMPTY_LINE_ITEMS_HTML;

  return rows
    .map((row) => {
      const t = mapShipmentSummaryLine(row);
      return `<tr>
        <td>${escapeHtml(t.shipmentDate)}</td>
        <td>${escapeHtml(t.documentNo)}</td>
        <td>${escapeHtml(t.purchaseOrderNos)}</td>
        <td>${escapeHtml(t.supplierName)}</td>
        <td>${escapeHtml(t.referenceNo)}</td>
        <td>${escapeHtml(t.status)}</td>
        <td class="num">${escapeHtml(t.qty)}</td>
        <td class="num">${escapeHtml(t.amount)}</td>
        <td>${escapeHtml(t.remark)}</td>
      </tr>`;
    })
    .join("\n");
};

const buildLineTokenMaps = (rows) => (rows || []).map(mapShipmentSummaryLine);

export default function ShipmentSummaryPrintPage() {
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
  const status = Number(router.query.status ?? 0) || 0;

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
          status: String(status),
        });

        const res = await fetch(
          `${BASE_URL}/ShipmentNote/GetShipmentSummary?${params}`,
          { method: "GET", headers: authHeaders() }
        );
        const json = await res.json().catch(() => null);

        if (!res.ok) {
          toast.error(json?.message || "Failed to load shipment summary.");
          setRows([]);
        } else {
          const result = json?.result ?? json?.Result ?? [];
          setRows(Array.isArray(result) ? result : []);
        }
      } catch (e) {
        console.error("[ShipmentSummaryPrint] load failed", e);
        toast.error("Failed to load shipment summary.");
        setRows([]);
      } finally {
        setLoadingData(false);
      }
    };

    load();
  }, [router.isReady, fromDate, toDate, supplierId, categoryId, subCategoryId, productId, status]);

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
      statusFilter: toFilterLabel(router.query.statusName, statusLabelFromCode(status)),
      totalShipments: String(rows.length),
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
      router.query.statusName,
      status,
      rows.length,
      totals.qty,
      totals.amount,
    ]
  );

  const finalHtml = useMemo(() => {
    if (!templateHtml || loadingData) return "";
    return applyTemplate(templateHtml, tokenMap, lineItemsRows, {
      lineTokenMaps: buildLineTokenMaps(rows),
      emptyLineItemsHtml: EMPTY_LINE_ITEMS_HTML,
    });
  }, [templateHtml, loadingData, tokenMap, lineItemsRows, rows]);

  const isLoading = loadingData || loadingTemplate;
  const downloadName = `ShipmentSummary_${new Date().toISOString().slice(0, 10)}`;

  return (
    <>
      <TemplatePrintFrame
        finalHtml={finalHtml}
        loading={isLoading}
        loadingText="Loading shipment summary…"
        errorText="No shipment summary available to print."
        downloadName={downloadName}
        showDownloadPdf={false}
      />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
