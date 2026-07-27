import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatCurrency, formatDateWithTime } from "@/components/utils/formatHelper";
import { getCashType } from "@/components/types/types";
import TemplatePrintFrame from "@/components/ReportTemplate/TemplatePrintFrame";
import useReportTemplate from "@/components/ReportTemplate/useReportTemplate";
import useTemplateLetterhead from "@/components/ReportTemplate/useTemplateLetterhead";
import { applyTemplate, escapeHtml } from "@/components/ReportTemplate/applyTemplate";

const REPORT_KEY = "SHIFT";

const DENOMINATIONS = [5000, 2000, 1000, 500, 100, 50, 20, 10, 5, 2, 1, 0.5];

const authHeaders = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
  "Content-Type": "application/json",
});

const formatVarianceSummary = (value) => {
  const numeric = Number(value ?? 0);
  if (numeric < 0) return `Short / ${formatCurrency(Math.abs(numeric))}`;
  if (numeric > 0) return `Excess / ${formatCurrency(numeric)}`;
  return "Balanced";
};

const getDenominationQty = (item, value) => {
  if (!item) return 0;
  const map = {
    5000: item.fiveThousand,
    2000: item.twoThousand,
    1000: item.thousand,
    500: item.fiveHundred,
    100: item.hundred,
    50: item.fifty,
    20: item.twenty,
    10: item.ten,
    5: item.five,
    2: item.two,
    1: item.one,
    0.5: item.fiftyCents,
  };
  return map[value] || 0;
};

const buildDenominationRows = (item) => {
  if (!item) {
    return `<tr><td colspan="3" style="text-align:center;padding:16px;">No denomination data.</td></tr>`;
  }

  const rows = DENOMINATIONS.filter((value) => getDenominationQty(item, value) > 0)
    .map((value) => {
      const qty = getDenominationQty(item, value);
      return `<tr>
        <td>${escapeHtml(value)}</td>
        <td class="num">${escapeHtml(qty)}</td>
        <td class="num">${escapeHtml(formatCurrency(value * qty))}</td>
      </tr>`;
    })
    .join("\n");

  return rows || `<tr><td colspan="3" style="text-align:center;padding:16px;">No denominations recorded.</td></tr>`;
};

const buildCashInOutRows = (items) => {
  if (!items || items.length === 0) {
    return `<tr><td colspan="3" style="text-align:center;padding:16px;">No cash in/out entries.</td></tr>`;
  }

  return items
    .map(
      (row) => `<tr>
        <td>${escapeHtml(getCashType(row.cashType))}</td>
        <td>${escapeHtml(row.description || "—")}</td>
        <td class="num">${escapeHtml(formatCurrency(row.amount))}</td>
      </tr>`
    )
    .join("\n");
};

export default function POSShiftPrintPage() {
  const router = useRouter();
  const shiftId = router.query.id;
  const documentNumber = router.query.documentNumber;

  const [shift, setShift] = useState(null);
  const [denominations, setDenominations] = useState([]);
  const [cashInOut, setCashInOut] = useState([]);
  const [loadingShift, setLoadingShift] = useState(true);

  const { templateHtml, loading: loadingTemplate } = useReportTemplate(REPORT_KEY);
  const { letterheadTokens } = useTemplateLetterhead(shift?.warehouseId);

  useEffect(() => {
    if (!router.isReady || !shiftId) return;

    const load = async () => {
      setLoadingShift(true);
      try {
        const [shiftRes, denomRes, cashRes] = await Promise.all([
          fetch(`${BASE_URL}/POSShift/GetPOSShiftById?id=${shiftId}`, {
            method: "GET",
            headers: authHeaders(),
          }),
          fetch(`${BASE_URL}/POSShift/GetAllCashDenominationValues?shiftId=${shiftId}`, {
            method: "GET",
            headers: authHeaders(),
          }),
          fetch(`${BASE_URL}/POSShift/GetAllCashInOutByShiftId?shiftId=${shiftId}`, {
            method: "GET",
            headers: authHeaders(),
          }),
        ]);

        const shiftJson = await shiftRes.json().catch(() => null);
        const denomJson = await denomRes.json().catch(() => null);
        const cashJson = await cashRes.json().catch(() => null);

        const record = shiftJson?.result ?? null;
        if (!shiftRes.ok || record == null) {
          toast.error(shiftJson?.message || "Failed to load POS shift.");
          setShift(null);
          setDenominations([]);
          setCashInOut([]);
        } else {
          setShift(record);
          setDenominations(Array.isArray(denomJson?.result) ? denomJson.result : []);
          setCashInOut(Array.isArray(cashJson?.result) ? cashJson.result : []);
        }
      } catch (e) {
        console.error("[POSShiftPrint] load failed", e);
        toast.error("Failed to load POS shift.");
        setShift(null);
        setDenominations([]);
        setCashInOut([]);
      } finally {
        setLoadingShift(false);
      }
    };

    load();
  }, [router.isReady, shiftId]);

  const startDenomination = denominations.find((item) => item.isShiftAvailable);
  const endDenomination = denominations.find((item) => !item.isShiftAvailable);

  const tokenMap = useMemo(
    () => ({
      ...letterheadTokens,
      documentNo: shift?.documentNo || documentNumber || "—",
      terminalCode: shift?.terminalCode || "—",
      startDate: shift?.startDate ? formatDateWithTime(shift.startDate) : "—",
      endDate: shift?.endDate ? formatDateWithTime(shift.endDate) : "—",
      status: shift?.isActive ? "Active" : "Ended",
      warehouseName: shift?.warehouseName || "—",
      createdUser: shift?.createdUser || "—",
      totalStartAmount: formatCurrency(shift?.totalStartAmount),
      totalEndAmount: formatCurrency(shift?.totalEndAmount),
      totalInvoice: formatCurrency(shift?.totalInvoice),
      totalSalesReturnAmount: formatCurrency(0),
      totalCashInvoice: formatCurrency(shift?.totalCashInvoice),
      totalCashSalesReturnAmount: formatCurrency(0),
      totalCanceledInvoice: formatCurrency(0),
      totalReceipt: formatCurrency(0),
      totalCashIn: formatCurrency(shift?.totalCashIn),
      totalCashOut: formatCurrency(shift?.totalCashOut),
      cashVariance: formatCurrency(shift?.variance),
      varianceSummary: formatVarianceSummary(shift?.variance),
      startDenominationRows: buildDenominationRows(startDenomination),
      endDenominationRows: buildDenominationRows(endDenomination),
      cashInOutRows: buildCashInOutRows(cashInOut),
    }),
    [shift, documentNumber, letterheadTokens, startDenomination, endDenomination, cashInOut]
  );

  const finalHtml = useMemo(() => {
    if (!templateHtml || !shift) return "";
    return applyTemplate(templateHtml, tokenMap);
  }, [templateHtml, shift, tokenMap]);

  const isLoading = loadingShift || loadingTemplate;

  return (
    <>
      <TemplatePrintFrame
        finalHtml={finalHtml}
        loading={isLoading}
        loadingText="Loading POS shift report…"
        errorText="POS shift not found."
        downloadName={`POSShift_${shift?.documentNo || documentNumber || "document"}`}
      />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
