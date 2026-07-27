import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TemplatePrintFrame from "@/components/ReportTemplate/TemplatePrintFrame";
import useReportTemplate from "@/components/ReportTemplate/useReportTemplate";
import useTemplateLetterhead from "@/components/ReportTemplate/useTemplateLetterhead";
import { applyTemplate, escapeHtml } from "@/components/ReportTemplate/applyTemplate";

// Customer-facing "Work Authorization Receipt" printed once the owner gives
// Final Approval. Rendered from the editable SERVICEWORKAUTH print template.

const REPORT_KEY = "SERVICEWORKAUTH";

const authHeaders = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
  "Content-Type": "application/json",
});

const LINE_TYPE_LABEL = { 1: "Part", 2: "Labour", 3: "Diagnostic" };

const serviceTypeLabel = (jc) => {
  if (jc?.serviceType === 1) {
    return jc.isWarrantyRepair ? "Warranty Repair (no charge)" : "Free Service (no charge)";
  }
  return jc?.serviceType === 2 ? "Paid Repair" : "—";
};

const buildBillRows = (rows) => {
  if (!rows || rows.length === 0) {
    return `<tr><td colspan="6" style="text-align:center;padding:12px;">No approved lines.</td></tr>`;
  }
  return rows
    .map((l, i) => {
      const amount = l._covered ? `<span class="free">FREE</span>` : escapeHtml(l._total.toFixed(2));
      return `<tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(LINE_TYPE_LABEL[l.lineType] || "-")}</td>
        <td>${escapeHtml(l.productName || l.description || "-")}</td>
        <td class="num">${escapeHtml(l.qty)}</td>
        <td class="num">${escapeHtml(Number(l.unitPrice || 0).toFixed(2))}</td>
        <td class="num">${amount}</td>
      </tr>`;
    })
    .join("\n");
};

export default function WorkAuthorizationReceipt() {
  const router = useRouter();
  const { id } = router.query;
  const [jobCard, setJobCard] = useState(null);
  const [loadingJob, setLoadingJob] = useState(true);

  const { templateHtml, loading: loadingTemplate } = useReportTemplate(REPORT_KEY);
  const { letterheadTokens } = useTemplateLetterhead(jobCard?.warehouseId);

  const fetchJob = useCallback(async () => {
    if (!id) return;
    setLoadingJob(true);
    try {
      const r = await fetch(`${BASE_URL}/ServiceJobCard/GetById/${id}`, { headers: authHeaders() });
      const j = await r.json();
      setJobCard(j?.result || null);
    } catch {
      setJobCard(null);
    } finally {
      setLoadingJob(false);
    }
  }, [id]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const computed = useMemo(() => {
    const lines = (jobCard?.lines || []).filter(
      (l) => !l.isDeleted && (!l.isTechnicianRequested || l.isApproved)
    );
    const jobIsFree = jobCard?.serviceType === 1;
    return lines.map((l) => {
      const covered = l.isWarrantyCovered || jobIsFree;
      const base = Number(l.qty || 0) * Number(l.unitPrice || 0);
      const discount = covered ? base : Number(l.discountAmount || 0);
      const total = Math.max(0, base - discount);
      return { ...l, _covered: covered, _base: base, _total: total };
    });
  }, [jobCard]);

  const tokenMap = useMemo(() => {
    if (!jobCard) return { ...letterheadTokens };
    const jobIsFree = jobCard.serviceType === 1;
    const gross = computed.reduce((s, l) => s + l._base, 0);
    const customerPays = computed.reduce((s, l) => s + l._total, 0);
    const deviceLine =
      [jobCard.deviceType, jobCard.brand, jobCard.model].filter(Boolean).join(" · ") ||
      jobCard.productName ||
      "-";
    const productLine = [
      jobCard.productName,
      jobCard.serialNumber ? `Serial: ${jobCard.serialNumber}` : null,
    ]
      .filter(Boolean)
      .join(" · ") || "-";
    return {
      ...letterheadTokens,
      documentNo: jobCard.documentNo || "-",
      approvedDate: jobCard.finalApprovedOn
        ? new Date(jobCard.finalApprovedOn).toLocaleString()
        : new Date().toLocaleString(),
      customerName: jobCard.customerName || "-",
      contactNo: jobCard.contactNo || "-",
      serviceType: serviceTypeLabel(jobCard),
      deviceLine,
      productLine,
      reportedFault: jobCard.faultReportedByCustomer || "-",
      diagnosis: jobCard.diagnosis?.technicianFindings || "-",
      grossTotal: gross.toFixed(2),
      customerPayable: jobIsFree ? "0.00" : customerPays.toFixed(2),
    };
  }, [jobCard, computed, letterheadTokens]);

  const finalHtml = useMemo(() => {
    if (!templateHtml || !jobCard) return "";
    return applyTemplate(templateHtml, tokenMap, buildBillRows(computed));
  }, [templateHtml, jobCard, tokenMap, computed]);

  const isLoading = loadingJob || loadingTemplate;

  return (
    <>
      <TemplatePrintFrame
        finalHtml={finalHtml}
        loading={isLoading}
        loadingText="Loading…"
        errorText="Job card not found."
        downloadName={`WorkAuthorization_${jobCard?.documentNo || "document"}`}
      />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
