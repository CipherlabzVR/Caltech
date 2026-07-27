import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/router";
import BASE_URL from "Base/api";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TemplatePrintFrame from "@/components/ReportTemplate/TemplatePrintFrame";
import useReportTemplate from "@/components/ReportTemplate/useReportTemplate";
import useTemplateLetterhead from "@/components/ReportTemplate/useTemplateLetterhead";
import { applyTemplate, escapeHtml } from "@/components/ReportTemplate/applyTemplate";

// Customer-facing intake receipt printed at Step 7 of the job-card flow.
// Rendered from the editable SERVICEINTAKERECEIPT print template.

const REPORT_KEY = "SERVICEINTAKERECEIPT";

const authHeaders = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
  "Content-Type": "application/json",
});

const serviceTypeLabel = (jc) => {
  if (jc?.serviceType === 1) {
    return jc.isWarrantyRepair ? "Warranty Repair (no charge)" : "Free Service (no charge)";
  }
  return jc?.serviceType === 2 ? "Paid Repair" : "—";
};
const PRIORITY_LABEL = { 1: "Normal", 2: "Urgent", 3: "Critical" };

const buildAccessoryRows = (jobCard) => {
  const list = (jobCard?.accessoriesReceived || "")
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.length === 0) {
    return `<tr><td colspan="2" style="text-align:center;padding:12px;">-</td></tr>`;
  }
  return list
    .map((a, i) => `<tr><td>${i + 1}</td><td>${escapeHtml(a)}</td></tr>`)
    .join("\n");
};

export default function JobCardReceipt() {
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

  const tokenMap = useMemo(() => {
    if (!jobCard) return { ...letterheadTokens };
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
      receivedDate: jobCard.receivedDate ? new Date(jobCard.receivedDate).toLocaleString() : "-",
      customerName: jobCard.customerName || "-",
      contactNo: jobCard.contactNo || "-",
      serviceType: serviceTypeLabel(jobCard),
      priority: PRIORITY_LABEL[jobCard.priority] || "Normal",
      deviceLine,
      productLine,
      reportedFault: jobCard.faultReportedByCustomer || "-",
      physicalCondition: jobCard.physicalCondition || "-",
    };
  }, [jobCard, letterheadTokens]);

  const finalHtml = useMemo(() => {
    if (!templateHtml || !jobCard) return "";
    return applyTemplate(templateHtml, tokenMap, buildAccessoryRows(jobCard));
  }, [templateHtml, jobCard, tokenMap]);

  const isLoading = loadingJob || loadingTemplate;

  return (
    <>
      <TemplatePrintFrame
        finalHtml={finalHtml}
        loading={isLoading}
        loadingText="Loading…"
        errorText="Receipt not found."
        downloadName={`IntakeReceipt_${jobCard?.documentNo || "document"}`}
      />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
