import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import TemplatePrintFrame from "@/components/ReportTemplate/TemplatePrintFrame";
import useReportTemplate from "@/components/ReportTemplate/useReportTemplate";
import useTemplateLetterhead from "@/components/ReportTemplate/useTemplateLetterhead";
import { applyTemplate, escapeHtml } from "@/components/ReportTemplate/applyTemplate";

const REPORT_KEY = "STOCKDISPATCH";

const authHeaders = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
  "Content-Type": "application/json",
});

const formatAmount = (value) => {
  const numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) return "0.00";
  return numeric.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const buildLineItemsRows = (record) => {
  if (!record) {
    return `<tr><td colspan="9" style="text-align:center;padding:16px;">No dispatch details available.</td></tr>`;
  }

  return `<tr>
    <td>${escapeHtml(formatDate(record.createdOn) || "—")}</td>
    <td>${escapeHtml(record.supplierName || "—")}</td>
    <td>${escapeHtml(record.productCode || "—")}</td>
    <td>${escapeHtml(record.productName || "—")}</td>
    <td class="num">${escapeHtml(formatAmount(record.costPrice))}</td>
    <td class="num">${escapeHtml(formatAmount(record.unitPrice))}</td>
    <td class="num">${escapeHtml(formatAmount(record.sellingPrice))}</td>
    <td class="num">${escapeHtml(String(record.dispatchQuantity ?? 0))}</td>
    <td>${escapeHtml(record.remark || "—")}</td>
  </tr>`;
};

export default function StockDispatchPrintPage() {
  const router = useRouter();
  const dispatchId = router.query.id;
  const documentNumber = router.query.documentNumber;

  const [record, setRecord] = useState(null);
  const [loadingRecord, setLoadingRecord] = useState(true);

  const { templateHtml, loading: loadingTemplate } = useReportTemplate(REPORT_KEY);
  const { letterheadTokens } = useTemplateLetterhead(record?.warehouseId);

  useEffect(() => {
    if (!router.isReady || !dispatchId) return;

    const load = async () => {
      setLoadingRecord(true);
      try {
        const res = await fetch(`${BASE_URL}/StockBalance/GetStockDispatchById?id=${dispatchId}`, {
          method: "GET",
          headers: authHeaders(),
        });
        const json = await res.json().catch(() => null);
        const data = json?.result ?? null;

        if (!res.ok || data == null) {
          toast.error(json?.message || "Failed to load stock dispatch.");
          setRecord(null);
        } else {
          setRecord(data);
        }
      } catch (e) {
        console.error("[StockDispatchPrint] load failed", e);
        toast.error("Failed to load stock dispatch.");
        setRecord(null);
      } finally {
        setLoadingRecord(false);
      }
    };

    load();
  }, [router.isReady, dispatchId]);

  const lineItemsRows = useMemo(() => buildLineItemsRows(record), [record]);

  const qty = Number(record?.dispatchQuantity ?? 0);
  const costPrice = Number(record?.costPrice ?? 0);
  const sellingPrice = Number(record?.sellingPrice ?? 0);

  const tokenMap = useMemo(
    () => ({
      ...letterheadTokens,
      documentNo: record?.documentNo || documentNumber || "—",
      dispatchDate: formatDate(record?.createdOn) || "—",
      warehouseName: record?.warehouseName || "—",
      userName: record?.createdUser || "—",
      supplierName: record?.supplierName || "—",
      remark: record?.remark || "—",
      productCode: record?.productCode || "—",
      productName: record?.productName || "—",
      batchNumber: record?.batchNumber || "—",
      expiryDate: formatDate(record?.expiryDate) || "—",
      costPrice: formatAmount(record?.costPrice),
      unitPrice: formatAmount(record?.unitPrice),
      sellingPrice: formatAmount(record?.sellingPrice),
      dispatchQuantity: String(record?.dispatchQuantity ?? 0),
      totalCostValue: formatCurrency(qty * costPrice),
      totalSellingValue: formatCurrency(qty * sellingPrice),
    }),
    [record, documentNumber, letterheadTokens, qty, costPrice, sellingPrice]
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
        loadingText="Loading stock dispatch…"
        errorText="Stock dispatch record not found."
        downloadName={`StockDispatch_${record?.documentNo || documentNumber || dispatchId || "document"}`}
      />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
