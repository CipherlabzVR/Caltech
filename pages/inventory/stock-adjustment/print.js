import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatDate } from "@/components/utils/formatHelper";
import TemplatePrintFrame from "@/components/ReportTemplate/TemplatePrintFrame";
import useReportTemplate from "@/components/ReportTemplate/useReportTemplate";
import useTemplateLetterhead from "@/components/ReportTemplate/useTemplateLetterhead";
import { applyTemplate, escapeHtml } from "@/components/ReportTemplate/applyTemplate";

const REPORT_KEY = "STOCKADJUSTMENT";

const authHeaders = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
  "Content-Type": "application/json",
});

const formatQty = (value) => {
  const numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) return "0";
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(2);
};

const buildLineItemsRows = (record) => {
  if (!record) {
    return `<tr><td colspan="7" style="text-align:center;padding:16px;">No adjustment details available.</td></tr>`;
  }

  return `<tr>
    <td>${escapeHtml(formatDate(record.createdOn) || "—")}</td>
    <td>${escapeHtml(record.supplierName || "—")}</td>
    <td>${escapeHtml(record.productCode || "—")}</td>
    <td>${escapeHtml(record.productName || "—")}</td>
    <td class="num">${escapeHtml(formatQty(record.availableQty))}</td>
    <td class="num">${escapeHtml(formatQty(record.updatedQty))}</td>
    <td>${escapeHtml(record.remark || "—")}</td>
  </tr>`;
};

export default function StockAdjustmentPrintPage() {
  const router = useRouter();
  const adjustmentId = router.query.id;
  const documentNumber = router.query.documentNumber;

  const [record, setRecord] = useState(null);
  const [loadingRecord, setLoadingRecord] = useState(true);

  const { templateHtml, loading: loadingTemplate } = useReportTemplate(REPORT_KEY);
  const { letterheadTokens } = useTemplateLetterhead(record?.warehouseId);

  useEffect(() => {
    if (!router.isReady || !adjustmentId) return;

    const load = async () => {
      setLoadingRecord(true);
      try {
        const res = await fetch(`${BASE_URL}/StockAdjustment/GetStockAdjustmentById?id=${adjustmentId}`, {
          method: "GET",
          headers: authHeaders(),
        });
        const json = await res.json().catch(() => null);
        const data = json?.result ?? null;

        if (!res.ok || data == null) {
          toast.error(json?.message || "Failed to load stock adjustment.");
          setRecord(null);
        } else {
          setRecord(data);
        }
      } catch (e) {
        console.error("[StockAdjustmentPrint] load failed", e);
        toast.error("Failed to load stock adjustment.");
        setRecord(null);
      } finally {
        setLoadingRecord(false);
      }
    };

    load();
  }, [router.isReady, adjustmentId]);

  const lineItemsRows = useMemo(() => buildLineItemsRows(record), [record]);

  const previousQty = Number(record?.availableQty ?? 0);
  const updatedQty = Number(record?.updatedQty ?? 0);
  const qtyDiff = updatedQty - previousQty;

  const tokenMap = useMemo(
    () => ({
      ...letterheadTokens,
      documentNo: record?.documentNo || documentNumber || "—",
      adjustmentDate: formatDate(record?.createdOn) || "—",
      warehouseName: record?.warehouseName || "—",
      userName: record?.createdUser || "—",
      supplierName: record?.supplierName || "—",
      remark: record?.remark || "—",
      productCode: record?.productCode || "—",
      productName: record?.productName || "—",
      previousQuantity: formatQty(record?.availableQty),
      updatedQuantity: formatQty(record?.updatedQty),
      quantityDifference: formatQty(qtyDiff),
    }),
    [record, documentNumber, letterheadTokens, qtyDiff]
  );

  const finalHtml = useMemo(() => {
    if (!templateHtml || !record) return "";
    return applyTemplate(templateHtml, tokenMap, lineItemsRows);
  }, [templateHtml, record, tokenMap, lineItemsRows]);

  const isLoading = loadingRecord || loadingTemplate;

  return (
    <>
      <TemplatePrintFrame
        finalHtml={finalHtml}
        loading={isLoading}
        loadingText="Loading stock adjustment…"
        errorText="Stock adjustment record not found."
        downloadName={`StockAdjustment_${record?.documentNo || documentNumber || adjustmentId || "document"}`}
      />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
