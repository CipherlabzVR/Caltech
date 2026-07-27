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

const REPORT_KEY = "POSDAYEND";

const authHeaders = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
  "Content-Type": "application/json",
});

const buildShiftRows = (shifts) => {
  if (!shifts || shifts.length === 0) {
    return `<tr><td colspan="4" style="text-align:center;padding:16px;">No POS shifts for this date.</td></tr>`;
  }

  return shifts
    .map(
      (shift) => `<tr>
        <td>${escapeHtml(shift.documentNo ?? shift.DocumentNo ?? "—")}</td>
        <td class="num">${escapeHtml(formatCurrency(shift.shiftEndAmount ?? shift.ShiftEndAmount))}</td>
        <td class="num">${escapeHtml(formatCurrency(shift.cashInAmount ?? shift.CashInAmount))}</td>
        <td class="num">${escapeHtml(formatCurrency(shift.cashOutAmount ?? shift.CashOutAmount))}</td>
      </tr>`
    )
    .join("\n");
};

export default function POSDayEndPrintPage() {
  const router = useRouter();
  const dayEndId = router.query.id;
  const documentNumber = router.query.documentNumber;

  const [dayEnd, setDayEnd] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [loadingDayEnd, setLoadingDayEnd] = useState(true);

  const { templateHtml, loading: loadingTemplate } = useReportTemplate(REPORT_KEY);
  const { letterheadTokens } = useTemplateLetterhead(dayEnd?.warehouseId);

  useEffect(() => {
    if (!router.isReady || !dayEndId) return;

    const load = async () => {
      setLoadingDayEnd(true);
      try {
        const res = await fetch(`${BASE_URL}/POSDayEnd/GetPOSDayEndById?id=${dayEndId}`, {
          method: "GET",
          headers: authHeaders(),
        });
        const json = await res.json().catch(() => null);
        const record = json?.result ?? null;

        if (!res.ok || record == null) {
          toast.error(json?.message || "Failed to load POS day end.");
          setDayEnd(null);
          setShifts([]);
        } else {
          setDayEnd(record);

          if (record.endDate) {
            const dateParam = formatDate(record.endDate);
            const shiftRes = await fetch(
              `${BASE_URL}/POSShift/GetAllShiftsByDate?date=${encodeURIComponent(dateParam)}`,
              { method: "GET", headers: authHeaders() }
            );
            const shiftJson = await shiftRes.json().catch(() => null);
            const shiftList = Array.isArray(shiftJson)
              ? shiftJson
              : Array.isArray(shiftJson?.result)
                ? shiftJson.result
                : [];
            setShifts(shiftList);
          } else {
            setShifts([]);
          }
        }
      } catch (e) {
        console.error("[POSDayEndPrint] load failed", e);
        toast.error("Failed to load POS day end.");
        setDayEnd(null);
        setShifts([]);
      } finally {
        setLoadingDayEnd(false);
      }
    };

    load();
  }, [router.isReady, dayEndId]);

  const tokenMap = useMemo(
    () => ({
      ...letterheadTokens,
      documentNo: dayEnd?.documentNo || documentNumber || "—",
      endDate: formatDate(dayEnd?.endDate) || "—",
      warehouseName: dayEnd?.warehouseName || "—",
      userName: dayEnd?.userName || "—",
      remark: dayEnd?.remark || "—",
      totalInvoice: formatCurrency(dayEnd?.totalInvoice),
      totalCashInvoice: formatCurrency(dayEnd?.totalCashInvoice),
      shiftRows: buildShiftRows(shifts),
    }),
    [dayEnd, documentNumber, letterheadTokens, shifts]
  );

  const finalHtml = useMemo(() => {
    if (!templateHtml || !dayEnd) return "";
    return applyTemplate(templateHtml, tokenMap);
  }, [templateHtml, dayEnd, tokenMap]);

  const isLoading = loadingDayEnd || loadingTemplate;

  return (
    <>
      <TemplatePrintFrame
        finalHtml={finalHtml}
        loading={isLoading}
        loadingText="Loading POS day end report…"
        errorText="POS day end record not found."
        downloadName={`POSDayEnd_${dayEnd?.documentNo || documentNumber || "document"}`}
      />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
