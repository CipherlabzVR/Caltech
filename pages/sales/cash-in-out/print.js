import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { formatCurrency, formatDate } from "@/components/utils/formatHelper";
import { getCashType } from "@/components/types/types";
import TemplatePrintFrame from "@/components/ReportTemplate/TemplatePrintFrame";
import useReportTemplate from "@/components/ReportTemplate/useReportTemplate";
import useTemplateLetterhead from "@/components/ReportTemplate/useTemplateLetterhead";
import { applyTemplate } from "@/components/ReportTemplate/applyTemplate";

const REPORT_KEY = "CASHINOUT";

const authHeaders = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
  "Content-Type": "application/json",
});

const getStatusLabel = (status) => {
  if (status === 2) return "Approved";
  if (status === 3) return "Rejected";
  return "Pending";
};

export default function CashInOutPrintPage() {
  const router = useRouter();
  const cashInOutId = router.query.id;
  const shiftCode = router.query.shiftCode;

  const [record, setRecord] = useState(null);
  const [loadingRecord, setLoadingRecord] = useState(true);

  const { templateHtml, loading: loadingTemplate } = useReportTemplate(REPORT_KEY);
  const { letterheadTokens } = useTemplateLetterhead(record?.warehouseId);

  useEffect(() => {
    if (!router.isReady || !cashInOutId) return;

    const load = async () => {
      setLoadingRecord(true);
      try {
        const res = await fetch(`${BASE_URL}/Shift/GetCashInOutById?id=${cashInOutId}`, {
          method: "GET",
          headers: authHeaders(),
        });
        const json = await res.json().catch(() => null);
        const data = json?.result ?? null;

        if (!res.ok || data == null) {
          toast.error(json?.message || "Failed to load cash in/out record.");
          setRecord(null);
        } else {
          setRecord(data);
        }
      } catch (e) {
        console.error("[CashInOutPrint] load failed", e);
        toast.error("Failed to load cash in/out record.");
        setRecord(null);
      } finally {
        setLoadingRecord(false);
      }
    };

    load();
  }, [router.isReady, cashInOutId]);

  const tokenMap = useMemo(
    () => ({
      ...letterheadTokens,
      shiftCode: record?.shiftCode || shiftCode || "—",
      transactionDate: formatDate(record?.createdOn) || "—",
      description: record?.description || "—",
      warehouseName: record?.warehouseName || "—",
      createdUser: record?.createdUser || "—",
      cashFlowType: record?.cashFlowType || "—",
      cashType: getCashType(record?.cashType),
      status: getStatusLabel(record?.status),
      amount: formatCurrency(record?.amount),
      rejectedReason: record?.rejectedReason || "—",
    }),
    [record, shiftCode, letterheadTokens]
  );

  const finalHtml = useMemo(() => {
    if (!templateHtml || !record) return "";
    return applyTemplate(templateHtml, tokenMap);
  }, [templateHtml, record, tokenMap]);

  const isLoading = loadingRecord || loadingTemplate;

  return (
    <>
      <TemplatePrintFrame
        finalHtml={finalHtml}
        loading={isLoading}
        loadingText="Loading cash in/out…"
        errorText="Cash in/out record not found."
        downloadName={`CashInOut_${record?.shiftCode || shiftCode || cashInOutId || "document"}`}
      />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
